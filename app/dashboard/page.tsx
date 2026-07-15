"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UploadCloud, FileText, CheckCircle, AlertCircle, Loader2, Building2, CreditCard, LayoutDashboard, LogOut, Trash2, X } from "lucide-react";
import { createClient, type User } from "@supabase/supabase-js";
import {
  canSubmitReview,
  hasGeneratedReport,
  shouldCleanupInsufficientCreditIntake,
} from "@/lib/review-launch-policy";
import { normalizeAuditId } from "@/lib/audit-id";

// Uses environment variables first, falls back to your temporary bypass keys if needed
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fqwkvyypjnxkiojbubdf.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_o4tvWZUZF3eLv6nfjRs95A_KdNMAvHA";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ALLOWED_EXTENSIONS = ["pdf", "docx", "txt"];
// DOCX MIME reporting is inconsistent across browsers/OS (sometimes
// application/octet-stream), so extension is checked first and MIME is only
// a secondary signal - see isSupportedFile below.
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];
const MAX_PASTED_TEXT_LENGTH = 200_000;

interface AuditRow {
  id: string;
  file_name: string;
  status: string;
  file_path?: string | null;
  ai_results?: unknown;
  created_at?: string;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function isSupportedFile(file: File): { ok: true } | { ok: false; message: string } {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";

  if (extension === "doc") {
    return {
      ok: false,
      message: "Legacy .doc files are not supported. Please save as .docx, export as PDF, or paste the contract text below instead.",
    };
  }

  const extensionOk = ALLOWED_EXTENSIONS.includes(extension);
  const mimeOk = ALLOWED_MIME_TYPES.includes(file.type);

  if (!extensionOk && !mimeOk) {
    return {
      ok: false,
      message: "Unsupported format. Please upload a PDF, DOCX, or TXT file, or paste the contract text below.",
    };
  }

  return { ok: true };
}

export default function DashboardPage() {
  const router = useRouter();

  // --- AUTH & BILLING STATE ---
  const [user, setUser] = useState<User | null>(null);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [creditStatus, setCreditStatus] = useState<"loading" | "ready" | "error">("loading");
  const [creditError, setCreditError] = useState<string | null>(null);

  // --- UPLOAD & AUDIT STATE ---
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [audits, setAudits] = useState<AuditRow[]>([]);

  // --- PASTED TEXT STATE ---
  const [pasteText, setPasteText] = useState("");
  const [isPasting, setIsPasting] = useState(false);

  // --- DELETE REVIEW STATE ---
  const [deleteTarget, setDeleteTarget] = useState<AuditRow | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const intakeEnabled = canSubmitReview(creditStatus, creditBalance);

  const fetchAudits = async (userId: string) => {
    const { data, error } = await supabase
      .from('contract_audits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const normalizedAudits = data.flatMap((audit) => {
        const id = normalizeAuditId(audit.id);
        if (!id) {
          console.error("[DASHBOARD] Rejected an audit row with an unsafe or invalid bigint ID.");
          return [];
        }
        return [{ ...audit, id } as AuditRow];
      });
      setAudits(normalizedAudits);
    }
  };

  const loadCredits = async (accessToken: string) => {
    setCreditStatus("loading");
    setCreditError(null);

    try {
      const response = await fetch("/api/auth/claim", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await response.json() as { credits?: number; error?: string };

      if (typeof data.credits === "number") {
        setCreditBalance(data.credits);
      }

      if (!response.ok) {
        throw new Error(data.error || "Credit balance could not be refreshed.");
      }

      setCreditStatus("ready");
    } catch (error: unknown) {
      setCreditStatus("error");
      setCreditError(getErrorMessage(error, "Credit balance could not be refreshed."));
    }
  };

  const retryCredits = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await loadCredits(session.access_token);
    } else {
      setCreditStatus("error");
      setCreditError("Your session expired. Please sign in again.");
    }
  };

  const cleanupInsufficientCreditIntake = async (auditId: string, accessToken: string) => {
    const response = await fetch('/api/delete-review', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ id: auditId }),
    });
    const data = await response.json() as { error?: string };
    if (!response.ok) {
      throw new Error(data.error || "The unused intake record could not be cleaned up safely.");
    }
  };

  // --- INITIALIZATION ---
  useEffect(() => {
    const getUserAndData = async () => {
      const [{ data: { user } }, { data: { session } }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.auth.getSession(),
      ]);
      if (user && session) {
        setUser(user);
        await Promise.all([
          fetchAudits(user.id),
          loadCredits(session.access_token),
        ]);
      } else {
        // Boot to homepage if not logged in
        window.location.href = "/";
      }
    };
    getUserAndData();
  }, []);

  // --- BILLING PORTAL LOGIC ---
  const handleManageBilling = async () => {
    setLoadingBilling(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session found.");

      const response = await fetch('/api/create-portal', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}` 
        },
      });

      const data = await response.json();
      
      if (data.error) {
        alert(data.error);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: unknown) {
      alert("Billing access failed: " + getErrorMessage(error, "Please try again."));
    } finally {
      setLoadingBilling(false);
    }
  };

  // --- LOGOUT LOGIC ---
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/login");
    } catch (error: unknown) {
      alert("Sign out failed: " + getErrorMessage(error, "Please try again."));
      setLoggingOut(false);
    }
  };

  // --- DELETE REVIEW LOGIC ---
  const openDeleteModal = (audit: AuditRow) => {
    setDeleteTarget(audit);
    setDeleteConfirmText("");
    setDeleteError(null);
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setDeleteTarget(null);
    setDeleteConfirmText("");
    setDeleteError(null);
  };

  const handleDeleteReview = async () => {
    if (!deleteTarget || deleteConfirmText !== "DELETE") return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session found.");

      const response = await fetch('/api/delete-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ id: deleteTarget.id }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to delete review.");

      setAudits((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      setDeleteTarget(null);
      setDeleteConfirmText("");
    } catch (error: unknown) {
      setDeleteError(getErrorMessage(error, "Delete failed. Please try again."));
    } finally {
      setIsDeleting(false);
    }
  };

  // --- UPLOAD LOGIC ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (intakeEnabled) setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processUpload(e.target.files[0]);
    }
  };

  const processUpload = async (file: File) => {
    if (!user) {
      setUploadStatus({ type: 'error', msg: 'You must be logged in to upload contracts.' });
      return;
    }
    if (!intakeEnabled) {
      setUploadStatus({ type: 'error', msg: 'A verified available review credit is required. Purchase credits or refresh your balance before submitting.' });
      return;
    }

    const check = isSupportedFile(file);
    if (!check.ok) {
      setUploadStatus({ type: 'error', msg: check.message });
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Your session expired. Please sign in again.");

      // 1. Upload to Storage
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Create Registry Record
      const { data: insertData, error: dbError } = await supabase
        .from('contract_audits')
        .insert([{ user_id: user.id, file_name: file.name, status: 'Processing', file_path: filePath }])
        .select();

      if (dbError) {
        await supabase.storage.from('contracts').remove([filePath]);
        throw dbError;
      }
      
      const newRecordId = normalizeAuditId(insertData[0]?.id);
      if (!newRecordId) {
        await supabase.storage.from('contracts').remove([filePath]);
        throw new Error("The review was created with an invalid database ID and cannot be processed safely.");
      }
      
      setUploadStatus({ type: 'success', msg: `${file.name} uploaded. Engine is scanning for risks...` });
      await fetchAudits(user.id); 
      
      // 3. Send file to the AI Parsing Route
      const formData = new FormData();
      formData.append("file", file);
      formData.append("auditId", String(newRecordId));

      const aiResponse = await fetch('/api/analyze-contract', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        body: formData
      });

      const aiData = await aiResponse.json();

      if (aiResponse.ok) {
        console.log("AI REVIEW COMPLETE:", aiData.result);

        // The server atomically saved the result and finalized the reservation.
        await fetchAudits(user.id); 
        await loadCredits(session.access_token);
        setUploadStatus({ type: 'success', msg: `${file.name} review complete.` });

      } else {
        if (shouldCleanupInsufficientCreditIntake(aiResponse.status, aiData.code)) {
          await cleanupInsufficientCreditIntake(newRecordId, session.access_token);
          await loadCredits(session.access_token);
        }
        throw new Error(aiData.error || "AI Engine failed to process document.");
      }

    } catch (error: unknown) {
      console.error(error);
      await fetchAudits(user.id);
      setUploadStatus({ type: 'error', msg: getErrorMessage(error, 'Upload or processing failed. Please try again.') });
    } finally {
      setIsUploading(false);
    }
  };

  // --- PASTED TEXT LOGIC ---
  // Same grounded analyzer pipeline as processUpload above - just skips file
  // extraction/Storage and sends the raw text straight to /api/analyze-contract.
  const processPastedText = async () => {
    if (!user) {
      setUploadStatus({ type: 'error', msg: 'You must be logged in to submit contract text.' });
      return;
    }
    if (!intakeEnabled) {
      setUploadStatus({ type: 'error', msg: 'A verified available review credit is required. Purchase credits or refresh your balance before submitting.' });
      return;
    }

    const trimmed = pasteText.trim();
    if (!trimmed) {
      setUploadStatus({ type: 'error', msg: 'Please paste some contract text first.' });
      return;
    }
    if (trimmed.length > MAX_PASTED_TEXT_LENGTH) {
      setUploadStatus({ type: 'error', msg: `Pasted text is too long (max ${MAX_PASTED_TEXT_LENGTH.toLocaleString()} characters). Please split it up or upload a file instead.` });
      return;
    }

    setIsPasting(true);
    setUploadStatus(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Your session expired. Please sign in again.");

      const fileName = "Pasted contract text";

      // 1. Create Registry Record (no Storage file_path - there's no file)
      const { data: insertData, error: dbError } = await supabase
        .from('contract_audits')
        .insert([{ user_id: user.id, file_name: fileName, status: 'Processing' }])
        .select();

      if (dbError) throw dbError;

      const newRecordId = normalizeAuditId(insertData[0]?.id);
      if (!newRecordId) {
        throw new Error("The review was created with an invalid database ID and cannot be processed safely.");
      }

      setUploadStatus({ type: 'success', msg: 'Pasted text submitted. Engine is scanning for risks...' });
      await fetchAudits(user.id);

      // 2. Send raw text to the same AI Parsing Route as file uploads
      const aiResponse = await fetch('/api/analyze-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ text: trimmed, fileName, auditId: String(newRecordId) }),
      });

      const aiData = await aiResponse.json();

      if (aiResponse.ok) {
        // The server atomically saved the result and finalized the reservation.
        await fetchAudits(user.id);
        await loadCredits(session.access_token);
        setUploadStatus({ type: 'success', msg: 'Pasted text review complete.' });
        setPasteText("");
      } else {
        if (shouldCleanupInsufficientCreditIntake(aiResponse.status, aiData.code)) {
          await cleanupInsufficientCreditIntake(newRecordId, session.access_token);
          await loadCredits(session.access_token);
        }
        throw new Error(aiData.error || "AI Engine failed to process pasted text.");
      }

    } catch (error: unknown) {
      console.error(error);
      await fetchAudits(user.id);
      setUploadStatus({ type: 'error', msg: getErrorMessage(error, 'Pasted text processing failed. Please try again.') });
    } finally {
      setIsPasting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-900 antialiased font-sans flex">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col justify-between hidden md:flex shrink-0">
        <div>
          <div className="flex items-center space-x-2 mb-12">
            <Building2 className="h-8 w-8 text-[#FF5F1F]" strokeWidth={2.5} />
            <span className="font-black text-[#1A3668] text-xl tracking-tight uppercase">SUBSHIELD</span>
          </div>
          
          <nav className="space-y-4">
            <Link href="/dashboard" className="flex items-center space-x-3 text-sm font-bold text-[#FF5F1F]">
              <LayoutDashboard className="h-5 w-5" />
              <span>OVERVIEW & INTAKE</span>
            </Link>
          </nav>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleManageBilling}
            disabled={loadingBilling}
            className="flex items-center space-x-3 text-sm font-bold text-slate-500 hover:text-[#1A3668] transition-colors disabled:opacity-50 w-full"
          >
            <CreditCard className="h-5 w-5" />
            <span>{loadingBilling ? "CONNECTING..." : "MANAGE BILLING"}</span>
          </button>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center space-x-3 text-sm font-bold text-slate-500 hover:text-red-600 transition-colors disabled:opacity-50 w-full border-t border-slate-100 pt-4"
          >
            <LogOut className="h-5 w-5" />
            <span>{loggingOut ? "SIGNING OUT..." : "LOG OUT"}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 pb-20">
        
        {/* Header */}
        <div className="bg-white border-b border-slate-200 py-8 px-6 md:px-10">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <h1 className="text-2xl font-black text-[#1A3668] uppercase tracking-tight">Pre-Award Subcontract Intake Hub</h1>
              <p className="text-sm font-medium text-slate-500 mt-1">
                Authenticated as: <span className="font-bold text-slate-700">{user?.email || "Loading..."}</span>
              </p>
            </div>
            <div className="text-left sm:text-right sm:border-l border-slate-200 sm:pl-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Allocation</p>
              <p className="text-lg font-black text-[#FF5F1F]">
                {creditStatus === "loading"
                  ? "CHECKING CREDITS..."
                  : creditBalance === null
                    ? "BALANCE UNAVAILABLE"
                    : `${creditBalance} REVIEW ${creditBalance === 1 ? "CREDIT" : "CREDITS"}`}
              </p>
              {creditStatus === "error" && (
                <div className="mt-1 flex flex-col items-start sm:items-end gap-1">
                  <p className="text-[10px] font-bold text-rose-700">{creditError}</p>
                  <button
                    type="button"
                    onClick={retryCredits}
                    className="text-[10px] font-black text-[#1A3668] underline underline-offset-2"
                  >
                    RETRY BALANCE
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upload & Registry Sections */}
        <div className="max-w-5xl mx-auto px-6 md:px-10 pt-10 space-y-10">
          {!intakeEnabled && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black text-amber-900 uppercase tracking-wide">
                  {creditStatus === 'loading' ? 'Checking Review Credits' : creditStatus === 'error' ? 'Credit Balance Unavailable' : 'Purchase Credits To Start A Review'}
                </p>
                <p className="text-xs font-medium text-amber-800 mt-1">
                  {creditStatus === 'loading'
                    ? 'Intake will unlock after your available balance is verified.'
                    : creditStatus === 'error'
                      ? 'Retry the balance check before submitting a contract.'
                      : 'You can still view completed reports. A new review requires one available credit.'}
                </p>
              </div>
              {creditStatus === 'ready' && creditBalance === 0 && (
                <Link href="/pricing" className="shrink-0 bg-[#1A3668] text-white text-xs font-black uppercase tracking-wider py-2.5 px-5 rounded-lg hover:bg-slate-800 transition">
                  Purchase Credits
                </Link>
              )}
            </div>
          )}
          
          {/* Drag & Drop Upload */}
          <section>
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                !intakeEnabled
                  ? 'border-slate-200 bg-slate-100 opacity-70'
                  : isDragging ? 'border-[#FF5F1F] bg-[#FF5F1F]/5' : 'border-slate-300 bg-white hover:border-slate-400'
              }`}
            >
              {isUploading ? (
                <div className="flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="w-10 h-10 text-[#FF5F1F] animate-spin" />
                  <p className="text-sm font-bold text-[#1A3668] uppercase tracking-wider">Encrypting and Routing to Intake Hub...</p>
                </div>
              ) : (
                <>
                  <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <UploadCloud className={`w-8 h-8 ${isDragging ? 'text-[#FF5F1F]' : 'text-slate-400'}`} />
                  </div>
                  <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide">Drag & Drop Contract File</h3>
                  <p className="text-xs font-medium text-slate-500 mt-2 mb-6">Supported formats: PDF, DOCX, or TXT</p>

                  <input type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" className="hidden" id="file-upload" onChange={handleFileSelect} disabled={!intakeEnabled} />
                  <label htmlFor={intakeEnabled ? "file-upload" : undefined} className={`inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider py-2.5 px-6 rounded-lg transition shadow-sm ${intakeEnabled ? 'cursor-pointer bg-[#FF5F1F] hover:bg-[#E04F1A] text-white' : 'cursor-not-allowed bg-slate-200 text-slate-400'}`}>
                    Browse Local Files
                  </label>
                </>
              )}
            </div>

            {uploadStatus && (
              <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 border ${
                uploadStatus.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {uploadStatus.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <p className="text-xs font-bold">{uploadStatus.msg}</p>
              </div>
            )}
          </section>

          {/* Paste Contract Text */}
          <section>
            <h2 className="text-sm font-black text-[#1A3668] uppercase tracking-widest mb-4">Or Paste Contract Text</h2>
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                disabled={isPasting || !intakeEnabled}
                placeholder="Paste subcontract clauses, solicitation language, or email pushback text here..."
                className="w-full min-h-[160px] p-4 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#FF5F1F] focus:border-[#FF5F1F] disabled:bg-slate-50 disabled:text-slate-400 font-mono resize-none"
              />
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mt-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {pasteText.trim().length.toLocaleString()} / {MAX_PASTED_TEXT_LENGTH.toLocaleString()} characters
                </span>
                <button
                  onClick={processPastedText}
                  disabled={isPasting || !pasteText.trim() || !intakeEnabled}
                  className="bg-[#FF5F1F] hover:bg-[#E04F1A] text-white text-xs font-black uppercase tracking-wider py-2.5 px-6 rounded-lg transition disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  {isPasting ? "Scanning..." : "Run Triage On Pasted Text"}
                </button>
              </div>
            </div>
          </section>

          {/* Registry Table */}
          <section>
            <h2 className="text-sm font-black text-[#1A3668] uppercase tracking-widest mb-4">Audit Operations Registry</h2>
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Project Document Identifier</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {audits.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-xs font-medium text-slate-500">
                        No documents uploaded yet. Drag and drop a contract above to begin.
                      </td>
                    </tr>
                  ) : (
                    audits.map((audit) => (
                      <tr key={audit.id}>
                        <td className="px-6 py-4 flex items-center gap-3">
                          <FileText className="w-4 h-4 text-slate-400" />
                          {audit.file_name}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded border ${
                            audit.status === 'Processing'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                              : audit.status === 'Review Ready'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {audit.status === 'Processing' ? 'Scanning...' : audit.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-4">
                            {audit.status === 'Review Ready' && hasGeneratedReport(audit.ai_results) ? (
                              <Link href={`/report/${audit.id}`} className="text-xs font-bold text-[#FF5F1F] hover:underline uppercase tracking-wide">
                                View Report
                              </Link>
                            ) : audit.status === 'Awaiting Credits' ? (
                              <Link href="/pricing" className="text-xs font-bold text-[#1A3668] hover:underline uppercase tracking-wide">
                                Purchase Credits
                              </Link>
                            ) : (
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                                {audit.status === 'Processing Failed' ? 'Processing Failed' : 'Report Not Ready'}
                              </span>
                            )}
                            <button
                              onClick={() => openDeleteModal(audit)}
                              className="text-slate-400 hover:text-red-600 transition-colors"
                              title="Delete review"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </main>

      {/* Delete Review Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide">Delete Review</h3>
              <button onClick={closeDeleteModal} disabled={isDeleting} className="text-slate-400 hover:text-slate-600 disabled:opacity-50">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 font-medium mb-1">
              This will permanently delete this review, uploaded contract files, and generated report from your SubShield dashboard. This cannot be undone. Payment records may still be retained for billing/accounting purposes.
            </p>
            <p className="text-xs text-slate-500 font-medium mb-4">
              Type <span className="font-black text-slate-700">DELETE</span> below to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              disabled={isDeleting}
              placeholder="DELETE"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 disabled:bg-slate-50 mb-4"
            />
            {deleteError && (
              <p className="text-xs font-bold text-red-600 mb-4">{deleteError}</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-700 px-4 py-2.5 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteReview}
                disabled={deleteConfirmText !== "DELETE" || isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider py-2.5 px-6 rounded-lg transition disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Deleting..." : "Delete Review"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
