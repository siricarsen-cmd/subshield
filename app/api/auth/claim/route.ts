import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { claimCreditsAndGetBalance, type CreditDatabase } from "@/lib/credit-fulfillment";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Server-side only: privileged reads/writes happen only after the caller's identity is verified below
);
const creditDatabase = supabase as unknown as CreditDatabase;

export async function POST(req: Request) {
  try {
    // 1. Require a valid bearer token — no longer trust email/userId from the request body
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: "Missing Auth Token" }, { status: 401 });
    }
    const token = authHeader.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) {
      return NextResponse.json({ error: "Invalid Auth Token" }, { status: 401 });
    }

    // 2. Verify the token with Supabase auth using an anon-keyed client (mirrors create-portal)
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized request" }, { status: 401 });
    }

    if (!user.email || !user.email_confirmed_at) {
      return NextResponse.json({ error: "Account has no verified email on file." }, { status: 400 });
    }

    const result = await claimCreditsAndGetBalance(creditDatabase, {
      userId: user.id,
      email: user.email,
    });

    if (result.claimError) {
      console.error("[CLAIM] Failed to claim pending credits:", result.claimError);
      return NextResponse.json(
        { error: "Pending credits could not be claimed. Please retry.", credits: result.credits },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, credits: result.credits });
  } catch (error: unknown) {
    console.error("Claim Credits Error:", error);
    return NextResponse.json({ error: "Credit balance could not be loaded." }, { status: 500 });
  }
}
