-- Mirrors the production migration applied on 2026-08-03.
-- The hybrid retrieval RPC is not used by the current customer application.
-- Keep execution restricted to service-role server code and pin object lookup.

alter function public.retrieve_hybrid_govcon_rules(
  public.vector,
  double precision,
  integer,
  text[]
) set search_path = public, pg_temp;

revoke execute on function public.retrieve_hybrid_govcon_rules(
  public.vector,
  double precision,
  integer,
  text[]
) from public, anon, authenticated;

grant execute on function public.retrieve_hybrid_govcon_rules(
  public.vector,
  double precision,
  integer,
  text[]
) to service_role;
