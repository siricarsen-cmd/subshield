"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { CheckCircle, Mail, ArrowRight } from "lucide-react";

// Initialize Supabase directly (bypassing the deprecated helpers)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function SuccessPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!email) {
      setMessage({ type: "error", text: "Please enter your email address." });
      setLoading(false);
      return;
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
      
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          // Redirects them directly into the working dashboard folder once clicked
          emailRedirectTo: `${baseUrl}/dashboard`,
        },
      });

      if (error) throw error;

      setMessage({
        type: "success",
        text: "Secure link sent! Check your email inbox to access your dashboard instantly.",
      });
    } catch (error: any) {
      console.error("Magic Link Error:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to send link. Please verify your email and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-900 antialiased font-sans flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 p-8 shadow-sm text-center">
        
        <div className="flex justify-center mb-6">
          <CheckCircle className="h-16 w-16 text-[#FF5F1F]" strokeWidth={2} />
        </div>

        <h1 className="text-3xl font-black text-[#1A3668] tracking-tight uppercase mb-2">
          TRANSACTION COMPLETED
        </h1>
        <p className="text-sm font-medium text-slate-500 mb-8">
          Your project processing credits have been securely provisioned.
        </p>

        <div className="border-t border-slate-100 pt-6 text-left">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
            Enter Checkout Email to Access Dashboard
          </p>

          <form onSubmit={handleMagicLink} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
              <input
                type="email"
                placeholder="estimator@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full bg-[#F4F5F7] border border-slate-200 rounded-lg py-3 pl-11 pr-4 text-sm font-medium focus:outline-none focus:border-[#1A3668] transition-colors disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1A3668] text-white hover:bg-[#152A50] py-4 rounded-lg font-black text-xs uppercase tracking-wider transition-colors flex items-center justify-center space-x-2 disabled:opacity-60"
            >
              <span>{loading ? "SENDING..." : "REQUEST SECURE ENTRY LINK"}</span>
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          {message && (
            <div
              className={`mt-6 p-4 rounded-lg text-xs font-bold uppercase tracking-wide border ${
                message.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}