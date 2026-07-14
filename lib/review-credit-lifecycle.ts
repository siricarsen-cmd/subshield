export type ReviewReservationOutcome =
  | "reserved"
  | "already_reserved"
  | "already_completed"
  | "insufficient_credits"
  | "not_found"
  | "forbidden";

export interface ReviewCreditDatabase {
  rpc(
    functionName: string,
    params: Record<string, unknown>
  ): PromiseLike<{ data: unknown; error: { message: string } | null }>;
  from(table: "contract_audits"): {
    select(columns: "ai_results"): {
      eq(column: "id", value: string): {
        eq(column: "user_id", value: string): {
          maybeSingle(): PromiseLike<{
            data: { ai_results: unknown } | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  };
}

export class ReviewCreditError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(
    message: string,
    status: number,
    code: string
  ) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export class ReviewProcessingError extends Error {
  readonly creditRestored: boolean;

  constructor(creditRestored: boolean) {
    super(
      creditRestored
        ? "Analysis failed before completion. Your credit was restored."
        : "Analysis failed and automatic credit restoration could not be confirmed. Please contact support before retrying."
    );
    this.creditRestored = creditRestored;
  }
}

export function extractBearerToken(request: Request): string | null {
  return request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1] ?? null;
}

async function callRpc(
  database: ReviewCreditDatabase,
  functionName: string,
  params: Record<string, unknown>
): Promise<unknown> {
  const { data, error } = await database.rpc(functionName, params);
  if (error) throw new Error(error.message);
  return data;
}

async function getCompletedResult(
  database: ReviewCreditDatabase,
  userId: string,
  auditId: string
): Promise<unknown> {
  const { data, error } = await database
    .from("contract_audits")
    .select("ai_results")
    .eq("id", auditId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data?.ai_results) throw new Error("Completed review result is unavailable.");
  return data.ai_results;
}

function reservationError(outcome: ReviewReservationOutcome): ReviewCreditError {
  switch (outcome) {
    case "insufficient_credits":
      return new ReviewCreditError("No review credits are available.", 402, outcome);
    case "forbidden":
      return new ReviewCreditError("You do not own this review.", 403, outcome);
    case "not_found":
      return new ReviewCreditError("Review not found.", 404, outcome);
    case "already_reserved":
      return new ReviewCreditError("This review is already processing.", 409, outcome);
    default:
      return new ReviewCreditError("Review credit could not be reserved.", 500, outcome);
  }
}

export async function executePaidReview<T>(
  database: ReviewCreditDatabase,
  input: { userId: string; auditId: string },
  analyze: () => Promise<T>
): Promise<{ result: T | unknown; replayed: boolean }> {
  const outcome = await callRpc(database, "reserve_review_credit", {
    p_user_id: input.userId,
    p_audit_id: input.auditId,
  }) as ReviewReservationOutcome;

  if (outcome === "already_completed") {
    return {
      result: await getCompletedResult(database, input.userId, input.auditId),
      replayed: true,
    };
  }
  if (outcome !== "reserved") throw reservationError(outcome);

  try {
    const result = await analyze();
    const completed = await callRpc(database, "complete_review_credit", {
      p_user_id: input.userId,
      p_audit_id: input.auditId,
      p_ai_results: result,
    });
    if (completed !== true) throw new Error("Review completion was not persisted.");
    return { result, replayed: false };
  } catch (error: unknown) {
    console.error("[ANALYSIS] Paid review processing failed:", error);
    let creditRestored = false;
    try {
      creditRestored = await callRpc(database, "refund_review_credit", {
        p_user_id: input.userId,
        p_audit_id: input.auditId,
        p_error: error instanceof Error ? error.message.slice(0, 500) : "Unknown processing failure",
      }) === true;
    } catch (refundError: unknown) {
      console.error("[ANALYSIS] Automatic credit restoration failed:", refundError);
    }
    throw new ReviewProcessingError(creditRestored);
  }
}
