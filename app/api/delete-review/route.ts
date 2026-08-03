import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { normalizeAuditId } from "@/lib/audit-id";
import { getServerSupabaseClient } from "@/lib/server-credit-database";
import { recordOperationalIncident } from "@/lib/operational-incidents";

export async function POST(req: Request) {
  try {
    // 1. Verify the caller is a real logged-in user before initializing the
    // privileged service-role client used for ownership-checked deletion RPCs.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Missing Auth Token" }, { status: 401 });
    }
    const token = authHeader.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) {
      return NextResponse.json({ error: "Invalid Auth Token" }, { status: 401 });
    }

    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized request" }, { status: 401 });
    }

    const supabase = getServerSupabaseClient();

    // 2. Validate the target review id
    const { id: rawId } = await req.json();
    const id = normalizeAuditId(rawId);
    if (!id) {
      return NextResponse.json({ error: "Missing review id" }, { status: 400 });
    }

    // 3. Atomically verify ownership, block active reservations, and place the
    // audit in a deletion state that reserve_review_credit refuses to enter.
    // The RPC, not the browser, supplies the trusted Storage path/prior status.
    const { data: deletionLock, error: lockError } = await supabase.rpc(
      "begin_review_deletion",
      { p_audit_id: id, p_user_id: user.id },
    );
    if (lockError) {
      await recordOperationalIncident("delete_lock_failed");
      console.error("[DELETE-REVIEW] Deletion lock failed");
      return NextResponse.json({ error: "Review deletion could not be started." }, { status: 500 });
    }
    const lock = deletionLock as { outcome?: string; file_path?: unknown } | null;
    if (lock?.outcome === "reserved") {
      return NextResponse.json(
        { error: "A review cannot be deleted while analysis is processing." },
        { status: 409 },
      );
    }
    if (lock?.outcome === "forbidden") {
      return NextResponse.json({ error: "Unauthorized request" }, { status: 403 });
    }
    if (lock?.outcome !== "locked") {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // 4. Remove only the trusted path returned by the locked server-side row.
    const filePath = typeof lock.file_path === "string" && lock.file_path.length > 0
      ? lock.file_path
      : null;
    if (filePath) {
      const { error: storageError } = await supabase.storage
        .from("contracts")
        .remove([filePath]);

      if (storageError) {
        await recordOperationalIncident("delete_storage_cleanup_failed");
        console.error("[DELETE-REVIEW] Storage cleanup failed");
        const { data: cancelOutcome, error: cancelError } = await supabase.rpc(
          "cancel_review_deletion",
          { p_audit_id: id, p_user_id: user.id },
        );
        if (cancelError || cancelOutcome !== "restored") {
          await recordOperationalIncident("delete_state_restore_failed");
          console.error("[DELETE-REVIEW] Prior audit state restoration failed");
          return NextResponse.json(
            { error: "Storage cleanup failed and review state requires support." },
            { status: 500 },
          );
        }
        return NextResponse.json(
          { error: "The uploaded file could not be removed, so the review was retained." },
          { status: 500 },
        );
      }
    }

    // 5. Finalize only the still-locked audit. A transient failure leaves it in
    // Deletion Pending, blocking analysis and allowing an idempotent delete retry.
    const { data: deleteOutcome, error: deleteError } = await supabase.rpc(
      "finalize_review_deletion",
      { p_audit_id: id, p_user_id: user.id },
    );

    if (deleteError) {
      await recordOperationalIncident("delete_finalize_failed");
      console.error("[DELETE-REVIEW] Finalization failed");
      return NextResponse.json(
        { error: "Review deletion could not be finalized." },
        { status: 500 },
      );
    }
    if (deleteOutcome === "reserved") {
      return NextResponse.json(
        { error: "A review cannot be deleted while analysis is processing." },
        { status: 409 },
      );
    }
    if (deleteOutcome === "forbidden") {
      return NextResponse.json({ error: "Unauthorized request" }, { status: 403 });
    }
    if (deleteOutcome !== "deleted") {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    await recordOperationalIncident("delete_unexpected_failure");
    console.error("[DELETE-REVIEW] Unexpected request failure");
    return NextResponse.json({ error: "Delete failed." }, { status: 500 });
  }
}
