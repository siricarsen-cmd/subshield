import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Server-side only: needed to bypass RLS for an explicit, code-enforced ownership check
);

export async function POST(req: Request) {
  try {
    // 1. Verify the caller is a real logged-in user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: "Missing Auth Token" }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized request" }, { status: 401 });
    }

    // 2. Validate the target review id
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Missing review id" }, { status: 400 });
    }

    // 3. Look up the review and enforce ownership explicitly in code
    const { data: review, error: fetchError } = await supabase
      .from('contract_audits')
      .select('id, user_id, file_path')
      .eq('id', id)
      .single();

    if (fetchError || !review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (review.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized request" }, { status: 403 });
    }

    // 4. Remove the Storage object if we know where it lives.
    // Older rows created before file_path was tracked are left alone here by design.
    if (review.file_path) {
      const { error: storageError } = await supabase.storage
        .from('contracts')
        .remove([review.file_path]);

      if (storageError) {
        console.error("[DELETE-REVIEW] Storage cleanup failed:", storageError.message);
      }
    }

    // 5. Hard-delete the registry record
    const { error: deleteError } = await supabase
      .from('contract_audits')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete Review Error:", error);
    return NextResponse.json({ error: error.message || "Delete failed." }, { status: 500 });
  }
}
