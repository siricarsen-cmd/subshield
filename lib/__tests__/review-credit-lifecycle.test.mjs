import {
  executePaidReview,
  extractBearerToken,
  ReviewCreditError,
} from "../review-credit-lifecycle.ts";

let failures = 0;
function check(label, condition) {
  if (condition) console.log(`PASS: ${label}`);
  else {
    console.error(`FAIL: ${label}`);
    failures += 1;
  }
}

class MemoryReviewDatabase {
  balances = new Map();
  audits = new Map();
  reservations = new Map();

  async rpc(functionName, params) {
    const audit = this.audits.get(params.p_audit_id);
    if (!audit) return { data: "not_found", error: null };
    if (audit.userId !== params.p_user_id) return { data: "forbidden", error: null };

    if (functionName === "reserve_review_credit") {
      const reservation = this.reservations.get(params.p_audit_id);
      if (reservation?.status === "completed") return { data: "already_completed", error: null };
      if (reservation?.status === "reserved") return { data: "already_reserved", error: null };
      const balance = this.balances.get(params.p_user_id) ?? 0;
      if (balance <= 0) return { data: "insufficient_credits", error: null };
      this.balances.set(params.p_user_id, balance - 1);
      this.reservations.set(params.p_audit_id, { status: "reserved" });
      return { data: "reserved", error: null };
    }

    if (functionName === "complete_review_credit") {
      const reservation = this.reservations.get(params.p_audit_id);
      if (reservation?.status !== "reserved") return { data: false, error: null };
      reservation.status = "completed";
      audit.result = params.p_ai_results;
      return { data: true, error: null };
    }

    if (functionName === "refund_review_credit") {
      const reservation = this.reservations.get(params.p_audit_id);
      if (reservation?.status !== "reserved") return { data: false, error: null };
      reservation.status = "refunded";
      this.balances.set(params.p_user_id, (this.balances.get(params.p_user_id) ?? 0) + 1);
      return { data: true, error: null };
    }

    return { data: null, error: { message: "Unexpected RPC" } };
  }

  from() {
    return {
      select: () => ({
        eq: (_idColumn, auditId) => ({
          eq: (_userColumn, userId) => ({
            maybeSingle: async () => {
              const audit = this.audits.get(auditId);
              return {
                data: audit?.userId === userId ? { ai_results: audit.result } : null,
                error: null,
              };
            },
          }),
        }),
      }),
    };
  }
}

const userA = "00000000-0000-4000-8000-000000000001";
const userB = "00000000-0000-4000-8000-000000000002";
const auditA = "00000000-0000-4000-8000-000000000011";
const auditB = "00000000-0000-4000-8000-000000000012";
const database = new MemoryReviewDatabase();
database.audits.set(auditA, { userId: userA });
database.audits.set(auditB, { userId: userA });

const unauthenticatedRequest = new Request("https://example.test/api/analyze-contract", { method: "POST" });
check("unauthenticated analysis is denied before lifecycle execution", extractBearerToken(unauthenticatedRequest) === null);

let zeroCreditDenied = false;
try {
  await executePaidReview(database, { userId: userA, auditId: auditA }, async () => ({ ok: true }));
} catch (error) {
  zeroCreditDenied = error instanceof ReviewCreditError && error.status === 402;
}
check("zero-credit analysis is denied", zeroCreditDenied);

database.balances.set(userA, 1);
const completed = await executePaidReview(database, { userId: userA, auditId: auditA }, async () => ({ source: "file" }));
check("one-credit analysis succeeds and leaves zero", completed.result.source === "file" && database.balances.get(userA) === 0);

const duplicate = await executePaidReview(database, { userId: userA, auditId: auditA }, async () => {
  throw new Error("completed retry must not rerun analysis");
});
check("duplicate retry for the same audit does not charge twice", duplicate.replayed && database.balances.get(userA) === 0);

database.balances.set(userA, 1);
const auditC = "00000000-0000-4000-8000-000000000013";
const auditD = "00000000-0000-4000-8000-000000000014";
database.audits.set(auditC, { userId: userA });
database.audits.set(auditD, { userId: userA });
const concurrent = await Promise.allSettled([
  executePaidReview(database, { userId: userA, auditId: auditC }, async () => ({ ok: true })),
  executePaidReview(database, { userId: userA, auditId: auditD }, async () => ({ ok: true })),
]);
check("concurrent attempts cannot overspend the final credit", concurrent.filter((item) => item.status === "fulfilled").length === 1 && database.balances.get(userA) === 0);

let forbidden = false;
try {
  await executePaidReview(database, { userId: userB, auditId: auditB }, async () => ({ ok: true }));
} catch (error) {
  forbidden = error instanceof ReviewCreditError && error.status === 403;
}
check("another user cannot analyze or spend against an audit they do not own", forbidden);

database.balances.set(userA, 2);
const fileAudit = "00000000-0000-4000-8000-000000000015";
const textAudit = "00000000-0000-4000-8000-000000000016";
database.audits.set(fileAudit, { userId: userA });
database.audits.set(textAudit, { userId: userA });
const fileReview = await executePaidReview(database, { userId: userA, auditId: fileAudit }, async () => ({ source: "file" }));
const textReview = await executePaidReview(database, { userId: userA, auditId: textAudit }, async () => ({ source: "pasted-text" }));
check("file and pasted-text paths use the identical lifecycle", fileReview.result.source === "file" && textReview.result.source === "pasted-text" && database.balances.get(userA) === 0);

const failedAudit = "00000000-0000-4000-8000-000000000017";
database.audits.set(failedAudit, { userId: userA });
database.balances.set(userA, 1);
let restored = false;
try {
  await executePaidReview(database, { userId: userA, auditId: failedAudit }, async () => {
    throw new Error("simulated processing failure");
  });
} catch (error) {
  restored = error.creditRestored === true;
}
check("genuine server failure restores the reserved credit", restored && database.balances.get(userA) === 1);

if (failures > 0) process.exit(1);
