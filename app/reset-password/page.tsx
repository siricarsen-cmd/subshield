"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ResetPasswordPage() {
  const router = useRouter();
  const [sessionReady, setSessionReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Supabase parses the recovery token out of the URL hash on load and
    // fires PASSWORD_RECOVERY once the temporary session is established.
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
      }
    });

    // Handles the case where the session was already established before
    // this listener was attached.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (password.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters long." });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setSuccess(true);
      setMessage({ type: "success", text: "Your password has been updated. Redirecting to sign in..." });
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err?.message || "Something went wrong updating your password. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F5F7] font-sans">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 w-full max-w-md">
        <h1 className="text-2xl font-black text-[#1A3668] uppercase tracking-tight mb-2">Set New Password</h1>
        <p className="text-sm text-slate-500 mb-6">
          Choose a new password for your account.
        </p>

        {message && (
          <div
            className={`mb-4 p-3 border text-xs font-bold rounded ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {!sessionReady && !message && (
          <div className="mb-4 p-3 bg-slate-50 text-slate-500 border border-slate-200 text-xs font-bold rounded">
            Verifying your reset link...
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-slate-300 p-3 rounded bg-slate-50 text-sm"
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-slate-300 p-3 rounded bg-slate-50 text-sm"
                required
                minLength={8}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !sessionReady}
              className="w-full bg-[#FF5F1F] hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded text-xs uppercase tracking-widest transition-all shadow-sm"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link href="/login" className="text-xs font-bold text-slate-500 hover:text-[#FF5F1F] transition-colors">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
