"use client";

import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

// --- TEMPORARY HARDCODED KEYS ---
const supabaseUrl = "https://fqwkvyypjnxkiojbubdf.supabase.co";
const supabaseAnonKey = "sb_publishable_o4tvWZUZF3eLv6nfjRs95A_KdNMAvHA";
// --------------------------------

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F5F7] font-sans">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 w-full max-w-md">
        <h1 className="text-2xl font-black text-[#1A3668] uppercase tracking-tight mb-6">Contractor Login</h1>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 text-xs font-bold rounded">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-5">
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
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full border border-slate-300 p-3 rounded bg-slate-50 text-sm" 
              required 
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-[#FF5F1F] hover:bg-orange-600 text-white font-bold py-3.5 rounded text-xs uppercase tracking-widest transition-all shadow-sm"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}