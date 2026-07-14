begin;

create table if not exists public.stripe_credit_events (
  stripe_event_id text primary key,
  source_type text not null check (source_type in ('checkout_session', 'invoice')),
  source_id text not null,
  email text not null,
  credits integer not null check (credits > 0),
  processed_at timestamptz not null default now(),
  unique (source_type, source_id)
);

alter table public.stripe_credit_events enable row level security;

create or replace function public.fulfill_stripe_credits(
  p_event_id text,
  p_source_type text,
  p_source_id text,
  p_email text,
  p_credits integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_email text := lower(trim(p_email));
  inserted_event_id text;
begin
  if nullif(trim(p_event_id), '') is null
    or p_source_type not in ('checkout_session', 'invoice')
    or nullif(trim(p_source_id), '') is null
    or nullif(normalized_email, '') is null
    or p_credits <= 0 then
    raise exception 'Invalid Stripe credit fulfillment input';
  end if;

  insert into public.stripe_credit_events (
    stripe_event_id,
    source_type,
    source_id,
    email,
    credits
  )
  values (
    p_event_id,
    p_source_type,
    p_source_id,
    normalized_email,
    p_credits
  )
  on conflict do nothing
  returning stripe_event_id into inserted_event_id;

  if inserted_event_id is null then
    return false;
  end if;

  insert into public.pending_credits (email, credits)
  values (normalized_email, p_credits)
  on conflict (email) do update
    set credits = public.pending_credits.credits + excluded.credits;

  return true;
end;
$$;

create table if not exists public.review_credit_reservations (
  audit_id uuid primary key references public.contract_audits(id) on delete cascade,
  user_id uuid not null,
  status text not null check (status in ('reserved', 'completed', 'refunded')),
  attempt_count integer not null default 1 check (attempt_count > 0),
  reserved_at timestamptz not null default now(),
  finalized_at timestamptz,
  last_error text
);

create index if not exists review_credit_reservations_user_id_idx
  on public.review_credit_reservations(user_id);

alter table public.review_credit_reservations enable row level security;

create or replace function public.reserve_review_credit(
  p_user_id uuid,
  p_audit_id uuid
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  audit_owner uuid;
  reservation_status text;
  reservation_time timestamptz;
begin
  select user_id
    into audit_owner
    from public.contract_audits
    where id = p_audit_id
    for update;

  if audit_owner is null then
    return 'not_found';
  end if;
  if audit_owner <> p_user_id then
    return 'forbidden';
  end if;

  select status, reserved_at
    into reservation_status, reservation_time
    from public.review_credit_reservations
    where audit_id = p_audit_id;

  if reservation_status = 'completed' then
    return 'already_completed';
  end if;
  if reservation_status = 'reserved' then
    if reservation_time > now() - interval '15 minutes' then
      return 'already_reserved';
    end if;

    update public.user_credits
      set credits = credits + 1
      where user_id = p_user_id;

    update public.review_credit_reservations
      set status = 'refunded',
          finalized_at = now(),
          last_error = 'Automatically restored after stale reservation timeout'
      where audit_id = p_audit_id;
  end if;

  update public.user_credits
    set credits = credits - 1
    where user_id = p_user_id and credits > 0;

  if not found then
    update public.contract_audits
      set status = 'Awaiting Credits'
      where id = p_audit_id;
    return 'insufficient_credits';
  end if;

  insert into public.review_credit_reservations (
    audit_id,
    user_id,
    status
  ) values (
    p_audit_id,
    p_user_id,
    'reserved'
  )
  on conflict (audit_id) do update set
    status = 'reserved',
    attempt_count = public.review_credit_reservations.attempt_count + 1,
    reserved_at = now(),
    finalized_at = null,
    last_error = null;

  update public.contract_audits
    set status = 'Processing'
    where id = p_audit_id;

  return 'reserved';
end;
$$;

create or replace function public.complete_review_credit(
  p_user_id uuid,
  p_audit_id uuid,
  p_ai_results jsonb
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  reservation_status text;
begin
  if not exists (
    select 1 from public.contract_audits
    where id = p_audit_id and user_id = p_user_id
  ) then
    return false;
  end if;

  select status
    into reservation_status
    from public.review_credit_reservations
    where audit_id = p_audit_id and user_id = p_user_id
    for update;

  if reservation_status = 'completed' then
    return true;
  end if;
  if reservation_status <> 'reserved' then
    return false;
  end if;

  update public.contract_audits
    set status = 'Review Ready', ai_results = p_ai_results
    where id = p_audit_id and user_id = p_user_id;

  update public.review_credit_reservations
    set status = 'completed', finalized_at = now(), last_error = null
    where audit_id = p_audit_id;

  return true;
end;
$$;

create or replace function public.refund_review_credit(
  p_user_id uuid,
  p_audit_id uuid,
  p_error text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  reservation_status text;
begin
  if not exists (
    select 1 from public.contract_audits
    where id = p_audit_id and user_id = p_user_id
  ) then
    return false;
  end if;

  select status
    into reservation_status
    from public.review_credit_reservations
    where audit_id = p_audit_id and user_id = p_user_id
    for update;

  if reservation_status <> 'reserved' then
    return false;
  end if;

  update public.user_credits
    set credits = credits + 1
    where user_id = p_user_id;

  update public.review_credit_reservations
    set status = 'refunded', finalized_at = now(), last_error = left(p_error, 500)
    where audit_id = p_audit_id;

  update public.contract_audits
    set status = 'Processing Failed'
    where id = p_audit_id and user_id = p_user_id;

  return true;
end;
$$;

create or replace function public.claim_pending_credits(
  p_user_id uuid,
  p_email text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_email text := lower(trim(p_email));
  pending_balance integer;
  current_balance integer;
begin
  if p_user_id is null or nullif(normalized_email, '') is null then
    raise exception 'Invalid pending credit claim input';
  end if;

  select credits
    into pending_balance
    from public.pending_credits
    where email = normalized_email
    for update;

  if pending_balance is not null and pending_balance > 0 then
    insert into public.user_credits (user_id, credits)
    values (p_user_id, pending_balance)
    on conflict (user_id) do update
      set credits = public.user_credits.credits + excluded.credits
    returning credits into current_balance;

    delete from public.pending_credits
      where email = normalized_email;
  else
    select credits
      into current_balance
      from public.user_credits
      where user_id = p_user_id;
  end if;

  return coalesce(current_balance, 0);
end;
$$;

revoke all on table public.stripe_credit_events from public, anon, authenticated;
revoke all on table public.review_credit_reservations from public, anon, authenticated;
revoke all on function public.fulfill_stripe_credits(text, text, text, text, integer) from public, anon, authenticated;
revoke all on function public.claim_pending_credits(uuid, text) from public, anon, authenticated;
revoke all on function public.reserve_review_credit(uuid, uuid) from public, anon, authenticated;
revoke all on function public.complete_review_credit(uuid, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.refund_review_credit(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.fulfill_stripe_credits(text, text, text, text, integer) to service_role;
grant execute on function public.claim_pending_credits(uuid, text) to service_role;
grant execute on function public.reserve_review_credit(uuid, uuid) to service_role;
grant execute on function public.complete_review_credit(uuid, uuid, jsonb) to service_role;
grant execute on function public.refund_review_credit(uuid, uuid, text) to service_role;

commit;
