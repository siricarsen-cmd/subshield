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

    // 3. Atomically verify ownership, block active reservations, and place the
    // audit in a deletion state that reserve_review_credit refuses to enter.
    // The RPC, not the browser, supplies the trusted Storage path/prior status.
    const { data: deletionLock, error: lockError } = await supabase.rpc(
      'begin_review_deletion',
      { p_audit_id: id, p_user_id: user.id }
    );
    if (lockError) {
      console.error("[DELETE-REVIEW] Deletion lock failed:", lockError.message);
      return NextResponse.json({ error: "Review deletion could not be started." }, { status: 500 });
    }
    const lock = deletionLock as { outcome?: string; file_path?: unknown } | null;
    if (lock?.outcome === 'reserved') {
      return NextResponse.json(
        { error: "A review cannot be deleted while analysis is processing." },
        { status: 409 }
      );
    }
    if (lock?.outcome === 'forbidden') {
      return NextResponse.json({ error: "Unauthorized request" }, { status: 403 });
    }
    if (lock?.outcome !== 'locked') {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // 4. Remove only the trusted path returned by the locked server-side row.
    const filePath = typeof lock.file_path === 'string' && lock.file_path.length > 0
      ? lock.file_path
      : null;
    if (filePath) {
      const { error: storageError } = await supabase.storage
        .from('contracts')
        .remove([filePath]);

      if (storageError) {
        console.error("[DELETE-REVIEW] Storage cleanup failed:", storageError.message);
        const { data: cancelOutcome, error: cancelError } = await supabase.rpc(
          'cancel_review_deletion',
          { p_audit_id: id, p_user_id: user.id }
        );
        if (cancelError || cancelOutcome !== 'restored') {
          console.error("[DELETE-REVIEW] Failed to restore prior audit state:", cancelError?.message || cancelOutcome);
          return NextResponse.json(
            { error: "Storage cleanup failed and review state requires support." },
            { status: 500 }
          );
        }
        return NextResponse.json(
          { error: "The uploaded file could not be removed, so the review was retained." },
          { status: 500 }
        );
      }
    }

    // 5. Finalize only the still-locked audit. A transient failure leaves it in
    // Deletion Pending, blocking analysis and allowing an idempotent delete retry.
    const { data: deleteOutcome, error: deleteError } = await supabase.rpc(
      'finalize_review_deletion',
      { p_audit_id: id, p_user_id: user.id }
    );

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
    if (deleteOutcome === 'reserved') {
      return NextResponse.json(
        { error: "A review cannot be deleted while analysis is processing." },
        { status: 409 }
      );
    }
    if (deleteOutcome === 'forbidden') {
      return NextResponse.json({ error: "Unauthorized request" }, { status: 403 });
    }
    if (deleteOutcome !== 'deleted') {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Delete Review Error:", error);
    const message = error instanceof Error ? error.message : "Delete failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
