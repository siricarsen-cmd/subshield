begin;

create table if not exists public.stripe_credit_events (
  stripe_event_id text primary key,
  checkout_session_id text not null unique,
  email text not null,
  credits integer not null check (credits > 0),
  processed_at timestamptz not null default now()
);

alter table public.stripe_credit_events enable row level security;

create or replace function public.fulfill_stripe_credits(
  p_event_id text,
  p_checkout_session_id text,
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
    or nullif(trim(p_checkout_session_id), '') is null
    or nullif(normalized_email, '') is null
    or p_credits <= 0 then
    raise exception 'Invalid Stripe credit fulfillment input';
  end if;

  insert into public.stripe_credit_events (
    stripe_event_id,
    checkout_session_id,
    email,
    credits
  )
  values (
    p_event_id,
    p_checkout_session_id,
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
revoke all on function public.fulfill_stripe_credits(text, text, text, integer) from public, anon, authenticated;
revoke all on function public.claim_pending_credits(uuid, text) from public, anon, authenticated;
grant execute on function public.fulfill_stripe_credits(text, text, text, integer) to service_role;
grant execute on function public.claim_pending_credits(uuid, text) to service_role;

commit;
