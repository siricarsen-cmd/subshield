"use client";

import React, { useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setMessage({
        type: "success",
        text: "If an account exists for that email, a password reset link is on its way. Check your inbox (and spam folder).",
      });
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err?.message || "Something went wrong sending the reset email. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F5F7] font-sans">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 w-full max-w-md">
        <h1 className="text-2xl font-black text-[#1A3668] uppercase tracking-tight mb-2">Reset Password</h1>
        <p className="text-sm text-slate-500 mb-6">
          Enter the email address associated with your account and we&apos;ll send you a link to reset your password.
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-300 p-3 rounded bg-slate-50 text-sm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FF5F1F] hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded text-xs uppercase tracking-widest transition-all shadow-sm"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-xs font-bold text-slate-500 hover:text-[#FF5F1F] transition-colors">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
