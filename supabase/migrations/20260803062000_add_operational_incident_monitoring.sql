-- Stores only fixed operational incident codes. No customer identifiers,
-- filenames, emails, payment identifiers, exception text, or document content.

create table if not exists public.operational_incidents (
  event_code text primary key,
  severity text not null check (severity in ('warning', 'critical')),
  first_seen_at timestamp with time zone not null default now(),
  last_seen_at timestamp with time zone not null default now(),
  occurrence_count bigint not null default 1 check (occurrence_count > 0),
  constraint operational_incidents_event_code_check check (
    event_code in (
      'analyzer_credit_reservation_failed',
      'analyzer_processing_failed_credit_restored',
      'analyzer_processing_failed_credit_unconfirmed',
      'analyzer_unexpected_failure',
      'analyzer_ocr_timeout',
      'analyzer_ocr_failed',
      'stripe_webhook_configuration_failed',
      'stripe_checkout_missing_email',
      'stripe_checkout_credit_fulfillment_failed',
      'stripe_invoice_lookup_failed',
      'stripe_invoice_reconciliation_required',
      'stripe_invoice_credit_fulfillment_failed',
      'delete_lock_failed',
      'delete_storage_cleanup_failed',
      'delete_state_restore_failed',
      'delete_finalize_failed',
      'delete_unexpected_failure'
    )
  )
);

alter table public.operational_incidents enable row level security;

revoke all on table public.operational_incidents from public, anon, authenticated;
grant select, insert, update on table public.operational_incidents to service_role;

create or replace function public.record_operational_incident(p_event_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  incident_severity text;
begin
  incident_severity := case p_event_code
    when 'analyzer_processing_failed_credit_restored' then 'warning'
    when 'analyzer_ocr_timeout' then 'warning'
    when 'analyzer_ocr_failed' then 'warning'
    when 'delete_storage_cleanup_failed' then 'warning'
    when 'analyzer_credit_reservation_failed' then 'critical'
    when 'analyzer_processing_failed_credit_unconfirmed' then 'critical'
    when 'analyzer_unexpected_failure' then 'critical'
    when 'stripe_webhook_configuration_failed' then 'critical'
    when 'stripe_checkout_missing_email' then 'critical'
    when 'stripe_checkout_credit_fulfillment_failed' then 'critical'
    when 'stripe_invoice_lookup_failed' then 'critical'
    when 'stripe_invoice_reconciliation_required' then 'critical'
    when 'stripe_invoice_credit_fulfillment_failed' then 'critical'
    when 'delete_lock_failed' then 'critical'
    when 'delete_state_restore_failed' then 'critical'
    when 'delete_finalize_failed' then 'critical'
    when 'delete_unexpected_failure' then 'critical'
    else null
  end;

  if incident_severity is null then
    raise exception 'Unsupported operational incident code';
  end if;

  insert into public.operational_incidents (
    event_code,
    severity,
    first_seen_at,
    last_seen_at,
    occurrence_count
  ) values (
    p_event_code,
    incident_severity,
    now(),
    now(),
    1
  )
  on conflict (event_code) do update
  set severity = excluded.severity,
      last_seen_at = now(),
      occurrence_count = public.operational_incidents.occurrence_count + 1;
end;
$$;

revoke all on function public.record_operational_incident(text) from public, anon, authenticated;
grant execute on function public.record_operational_incident(text) to service_role;

create or replace function public.has_recent_operational_incidents(p_since timestamp with time zone)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.operational_incidents
    where last_seen_at >= p_since
  );
$$;

revoke all on function public.has_recent_operational_incidents(timestamp with time zone)
  from public, anon, authenticated;
grant execute on function public.has_recent_operational_incidents(timestamp with time zone)
  to service_role;
