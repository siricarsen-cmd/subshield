import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Server-side only: privileged reads/writes happen only after the caller's identity is verified below
);

export async function POST(req: Request) {
  try {
    // 1. Require a valid bearer token — no longer trust email/userId from the request body
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: "Missing Auth Token" }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');

    // 2. Verify the token with Supabase auth using an anon-keyed client (mirrors create-portal)
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized request" }, { status: 401 });
    }

    if (!user.email) {
      return NextResponse.json({ error: "Account has no verified email on file." }, { status: 400 });
    }

    const email = user.email.toLowerCase();
    const userId = user.id;

    // 3. Find pending credits for the verified user's own email only
    const { data: pending } = await supabase
      .from('pending_credits')
      .select('credits')
      .eq('email', email)
      .single();

    if (pending) {
      // 4. Get existing credits for the verified user
      const { data: currentRecord } = await supabase
        .from('user_credits')
        .select('credits')
        .eq('user_id', userId)
        .single();

      const existingCredits = currentRecord?.credits || 0;

      // 5. Apply credits to the verified user's row
      const { error: upsertError } = await supabase
        .from('user_credits')
        .upsert({ user_id: userId, credits: existingCredits + pending.credits }, { onConflict: 'user_id' });

      if (upsertError) {
        console.error("[CLAIM] Failed to apply credits:", upsertError.message);
        return NextResponse.json({ error: "Failed to apply credits." }, { status: 500 });
      }

      // 6. Only clear the pending record once credits are confirmed applied
      await supabase
        .from('pending_credits')
        .delete()
        .eq('email', email);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Claim Credits Error:", error);
    return NextResponse.json({ error: error.message || "Claim failed." }, { status: 500 });
  }
}
