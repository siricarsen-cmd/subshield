"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ShieldAlert, AlertTriangle, CheckCircle, Copy, CreditCard, Activity } from 'lucide-react';

// --- KEYS ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fqwkvyypjnxkiojbubdf.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_o4tvWZUZF3eLv6nfjRs95A_KdNMAvHA";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchDataAndVerifyCredits = async () => {
      try {
        const documentId = params?.id;
        if (!documentId) return;

        // 1. Get Auth User
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        // 2. Check Credits
        const { data: creditData, error: creditError } = await supabase
          .from('user_credits')
          .select('credits')
          .eq('user_id', user.id)
          .single();

        if (creditError || !creditData || creditData.credits <= 0) {
          setErrorDetails("INSUFFICIENT_CREDITS");
          return;
        }

        // 3. Fetch Report
        const { data: reportData, error: reportError } = await supabase
          .from('contract_audits')
          .select('*')
          .eq('id', documentId)
          .single();

        if (reportError) throw new Error(reportError.message);
        setData(reportData);

      } catch (err: any) {
        setErrorDetails(err.message || "An unknown error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchDataAndVerifyCredits();
  }, [params, router]);

  const handleCopyEmail = () => {
    if (data?.ai_results?.emailDraft) {
      navigator.clipboard.writeText(data.ai_results.emailDraft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F5F7] flex flex-col items-center justify-center p-10">
        <div className="w-12 h-12 border-4 border-[#1A3668] border-t-[#FF5F1F] rounded-full animate-spin mb-4"></div>
        <p className="text-[#1A3668] font-bold tracking-widest uppercase animate-pulse text-sm">
          Compiling Briefing Summary...
        </p>
      </div>
    );
  }

  if (errorDetails) {
    return (
      <div className="min-h-screen bg-[#F4F5F7] flex flex-col items-center justify-center p-10 text-center">
        {errorDetails === "INSUFFICIENT_CREDITS" ? (
          <>
            <CreditCard className="w-16 h-16 text-[#FF5F1F] mb-4" />
            <h1 className="text-2xl font-black text-[#1A3668] mb-2 uppercase tracking-tight">Credits Required</h1>
            <p className="text-slate-600 mb-6 font-medium max-w-sm">You have no remaining credits to view this report. Please purchase a plan to continue.</p>
            <Link href="/pricing" className="bg-[#1A3668] text-white font-black px-6 py-3 rounded-lg hover:bg-slate-800 transition uppercase text-sm tracking-wider">
              View Pricing Plans
            </Link>
          </>
        ) : (
          <>
            <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
            <h1 className="text-2xl font-black text-[#1A3668] mb-2 uppercase tracking-tight">Report Not Found</h1>
            <p className="text-slate-600 mb-6 font-medium">We couldn't locate this document in the registry.</p>
            <Link href="/dashboard" className="text-[#FF5F1F] font-black hover:underline tracking-wider uppercase text-sm flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
          </>
        )}
      </div>
    );
  }

  const aiResults = data.ai_results || {};
  const traps = aiResults.criticalTraps || [];
  const emailDraft = aiResults.emailDraft || "";
  const overallRisk = aiResults.riskLevel || "Low";
  const industry = aiResults.industryDetected || "General Subcontracting";

  return (
    <div className="min-h-screen bg-[#F4F5F7] font-sans pb-20">
      <div className="bg-white border-b border-slate-200 py-6 px-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between md:items-end gap-4">
          <div>
            <Link href="/dashboard" className="text-slate-400 hover:text-[#FF5F1F] font-bold uppercase tracking-wider text-[10px] flex items-center gap-1 mb-2 transition-colors">
              <ArrowLeft className="w-3 h-3" /> Return to Intake Hub
            </Link>
            <h1 className="text-2xl font-black text-[#1A3668] uppercase tracking-tight">Attorney Prep Toolkit & Briefing</h1>
            <div className="flex flex-col md:flex-row gap-2 mt-2">
                <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <span className="text-[#FF5F1F] font-bold">Targeted Regulatory Exposure:</span> {data.file_name}
                </p>
                <p className="text-sm font-medium text-slate-500 hidden md:flex items-center gap-2">|</p>
                <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <span className="text-[#1A3668] font-bold">Sector Detected:</span> {industry}
                </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-2 border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#1A3668]" />
                <h2 className="text-sm font-black text-[#1A3668] uppercase tracking-widest">Active Liability Flags Isolated</h2>
            </div>
             <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-sm ${
                overallRisk === 'High' ? 'bg-red-100 text-red-700 border border-red-200' : 
                overallRisk === 'Medium' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 
                'bg-emerald-100 text-emerald-700 border border-emerald-200'
              }`}>
                SYSTEM RISK LEVEL: {overallRisk}
              </span>
          </div>

          {traps.length === 0 ? (
            <div className="bg-white rounded-xl border border-emerald-200 p-10 text-center shadow-sm">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-lg font-black text-[#1A3668] uppercase">No Critical Flags Detected</h3>
              <p className="text-sm text-slate-500 font-medium mt-2">The system did not detect any of the targeted regulatory liabilities in this document.</p>
            </div>
          ) : (
            traps.map((trap: any, index: number) => (
              <div key={index} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-3 border-b bg-slate-50 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#FF5F1F]" />
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                        REGULATORY TRIGGER: {trap.regulation}
                    </span>
                </div>
                <div className="p-6">
                  
                  {/* Found Text Section */}
                  <div className="mb-6 pl-4 border-l-2 border-slate-300">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Contract Text Extracted</p>
                    <p className="text-sm text-slate-600 font-serif italic">"{trap.foundText}"</p>
                  </div>

                  {/* Risk Analysis Section */}
                  <div className="mb-6">
                    <p className="text-[10px] font-black text-[#1A3668] uppercase tracking-widest mb-1">Operational Liability</p>
                    <p className="text-sm text-slate-800 font-medium leading-relaxed">{trap.riskAnalysis}</p>
                  </div>

                  {/* Redline Section */}
                  <div className="bg-slate-900 rounded-lg p-5">
                    <p className="text-[10px] font-black text-[#FF5F1F] uppercase tracking-widest mb-2">Liability Redline Alternative</p>
                    <p className="text-sm text-slate-100 font-mono leading-relaxed">{trap.redlineFix}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2 border-b border-slate-200 pb-2">
                <h2 className="text-sm font-black text-[#1A3668] uppercase tracking-widest">Consolidated PM Pushback Memo</h2>
            </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm sticky top-28">
            <div className="p-6 bg-[#F8F9FA]">
              <div className="text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed mb-6">
                {emailDraft || "No email drafted for this clean contract."}
              </div>
              <button 
                onClick={handleCopyEmail}
                disabled={!emailDraft}
                className="w-full flex items-center justify-center gap-2 bg-[#FF5F1F] hover:bg-[#E04F1A] text-white text-xs font-black uppercase tracking-wider py-3.5 px-6 rounded-lg transition"
              >
                {copied ? <><CheckCircle className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy Complete Email</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}