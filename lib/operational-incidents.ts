import { getServerSupabaseClient } from "./server-credit-database";

export const OPERATIONAL_INCIDENT_SEVERITIES = {
  analyzer_credit_reservation_failed: "critical",
  analyzer_processing_failed_credit_restored: "warning",
  analyzer_processing_failed_credit_unconfirmed: "critical",
  analyzer_unexpected_failure: "critical",
  analyzer_ocr_timeout: "warning",
  analyzer_ocr_failed: "warning",
  stripe_webhook_configuration_failed: "critical",
  stripe_checkout_missing_email: "critical",
  stripe_checkout_credit_fulfillment_failed: "critical",
  stripe_invoice_lookup_failed: "critical",
  stripe_invoice_reconciliation_required: "critical",
  stripe_invoice_credit_fulfillment_failed: "critical",
  delete_lock_failed: "critical",
  delete_storage_cleanup_failed: "warning",
  delete_state_restore_failed: "critical",
  delete_finalize_failed: "critical",
  delete_unexpected_failure: "critical",
} as const;

export type OperationalIncidentCode = keyof typeof OPERATIONAL_INCIDENT_SEVERITIES;
export type OperationalStatus = "ok" | "degraded";

interface OperationalIncidentDatabase {
  rpc(
    functionName: "record_operational_incident" | "has_recent_operational_incidents",
    params: Record<string, unknown>,
  ): PromiseLike<{ data: unknown; error: { message: string } | null }>;
}

const DEFAULT_INCIDENT_WINDOW_MS = 90 * 60 * 1000;

export async function recordOperationalIncidentWithDatabase(
  database: OperationalIncidentDatabase,
  eventCode: OperationalIncidentCode,
): Promise<boolean> {
  const { error } = await database.rpc("record_operational_incident", {
    p_event_code: eventCode,
  });

  return !error;
}

export async function recordOperationalIncident(
  eventCode: OperationalIncidentCode,
): Promise<void> {
  try {
    const recorded = await recordOperationalIncidentWithDatabase(
      getServerSupabaseClient() as unknown as OperationalIncidentDatabase,
      eventCode,
    );

    if (!recorded) {
      console.error("[OPS] Incident recording failed", { eventCode });
    }
  } catch {
    console.error("[OPS] Incident recording failed", { eventCode });
  }
}

export async function getOperationalStatusWithDatabase(
  database: OperationalIncidentDatabase,
  options: { now?: Date; windowMs?: number } = {},
): Promise<OperationalStatus> {
  const now = options.now ?? new Date();
  const windowMs = options.windowMs ?? DEFAULT_INCIDENT_WINDOW_MS;
  const since = new Date(now.getTime() - windowMs).toISOString();

  const { data, error } = await database.rpc("has_recent_operational_incidents", {
    p_since: since,
  });

  if (error || typeof data !== "boolean") return "degraded";
  return data ? "degraded" : "ok";
}

export async function getOperationalStatus(): Promise<OperationalStatus> {
  try {
    return await getOperationalStatusWithDatabase(
      getServerSupabaseClient() as unknown as OperationalIncidentDatabase,
    );
  } catch {
    return "degraded";
  }
}
