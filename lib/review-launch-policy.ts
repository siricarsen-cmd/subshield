export type CreditLoadStatus = "loading" | "ready" | "error";

export interface ReportAccessRecord {
  user_id: string;
  status: string;
  ai_results: unknown;
}

export type ReportAccessDecision =
  | { kind: "ready" }
  | { kind: "not_ready"; status: string }
  | { kind: "not_found" }
  | { kind: "forbidden" };

export function hasGeneratedReport(value: unknown): boolean {
  return Boolean(
    value
      && typeof value === "object"
      && !Array.isArray(value)
      && Object.keys(value).length > 0
  );
}

export function getReportAccessDecision(
  report: ReportAccessRecord | null,
  authenticatedUserId: string,
): ReportAccessDecision {
  if (!report) return { kind: "not_found" };
  if (report.user_id !== authenticatedUserId) return { kind: "forbidden" };
  if (report.status !== "Review Ready" || !hasGeneratedReport(report.ai_results)) {
    return { kind: "not_ready", status: report.status };
  }
  return { kind: "ready" };
}

export function canSubmitReview(status: CreditLoadStatus, balance: number | null): boolean {
  return status === "ready" && typeof balance === "number" && balance > 0;
}

export function shouldCleanupInsufficientCreditIntake(httpStatus: number, code: unknown): boolean {
  return httpStatus === 402 && code === "insufficient_credits";
}
