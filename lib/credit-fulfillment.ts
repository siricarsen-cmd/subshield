export interface CreditDatabase {
  rpc(
    functionName: string,
    params: Record<string, string | number>
  ): PromiseLike<{ data: unknown; error: { message: string } | null }>;
  from(table: "user_credits"): {
    select(columns: "credits"): {
      eq(column: "user_id", value: string): {
        maybeSingle(): PromiseLike<{
          data: { credits: number } | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
}

interface FulfillCheckoutInput {
  eventId: string;
  checkoutSessionId: string;
  email: string;
  credits: number;
}

interface ClaimCreditsInput {
  userId: string;
  email: string;
}

export async function fulfillCheckoutCredits(
  database: CreditDatabase,
  input: FulfillCheckoutInput
): Promise<boolean> {
  const { data, error } = await database.rpc("fulfill_stripe_credits", {
    p_event_id: input.eventId,
    p_checkout_session_id: input.checkoutSessionId,
    p_email: input.email.toLowerCase(),
    p_credits: input.credits,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data === true;
}

export async function claimCreditsAndGetBalance(
  database: CreditDatabase,
  input: ClaimCreditsInput
): Promise<{ credits: number; claimError: string | null }> {
  const { error: claimError } = await database.rpc("claim_pending_credits", {
    p_user_id: input.userId,
    p_email: input.email.toLowerCase(),
  });

  const { data, error: balanceError } = await database
    .from("user_credits")
    .select("credits")
    .eq("user_id", input.userId)
    .maybeSingle();

  if (balanceError) {
    throw new Error(balanceError.message);
  }

  return {
    credits: data?.credits ?? 0,
    claimError: claimError?.message ?? null,
  };
}
