import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // This is safe here because this is a server-side route
);

export async function POST(req: Request) {
  const { email, userId } = await req.json();

  // 1. Find pending credits for this email
  const { data: pending } = await supabase
    .from('pending_credits')
    .select('credits')
    .eq('email', email.toLowerCase())
    .single();

  if (pending) {
    // 2. Get existing credits
    const { data: currentRecord } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', userId)
      .single();

    const existingCredits = currentRecord?.credits || 0;

    // 3. Update user_credits
    await supabase
      .from('user_credits')
      .upsert({ user_id: userId, credits: existingCredits + pending.credits }, { onConflict: 'user_id' });

    // 4. Delete the pending record
    await supabase
      .from('pending_credits')
      .delete()
      .eq('email', email.toLowerCase());
  }

  return NextResponse.json({ success: true });
}