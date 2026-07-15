export function shouldFulfillCheckout(mode: "payment" | "subscription" | undefined): boolean {
  return mode === "payment";
}

export function shouldFulfillSubscriptionInvoice(input: {
  status: string | null;
  billingReason: string | null;
  linePriceIds: string[];
  activeBidderPriceId: string | undefined;
  subscriptionStatus: string;
}): boolean {
  const eligibleCycle = input.billingReason === "subscription_create"
    || input.billingReason === "subscription_cycle";

  return input.status === "paid"
    && input.subscriptionStatus === "active"
    && eligibleCycle
    && Boolean(input.activeBidderPriceId)
    && input.linePriceIds.includes(input.activeBidderPriceId!);
}
