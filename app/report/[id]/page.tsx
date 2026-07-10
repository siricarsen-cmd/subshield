"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ShieldAlert, AlertTriangle, CheckCircle, Copy, CreditCard, Activity, Info, Download } from 'lucide-react';
import type { AnalyzerResult, Finding } from '@/lib/analyzer/types';

// --- KEYS ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fqwkvyypjnxkiojbubdf.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_o4tvWZUZF3eLv6nfjRs95A_KdNMAvHA";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// The report row's ai_results can be an older shape (criticalTraps) or the
// current AnalyzerResult shape (primaryTraps) - see the fallback in
// runAnalyzer usage below. Partial<> because a Limited Scan / not-yet-set
// row may omit fields entirely.
interface ReportAiResults extends Partial<AnalyzerResult> {
  criticalTraps?: Finding[];
}

interface ReportRow {
  file_name: string;
  ai_results?: ReportAiResults;
}

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<ReportRow | null>(null);
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

        // 3. Fetch Report (scoped to the authenticated owner)
        const { data: reportData, error: reportError } = await supabase
          .from('contract_audits')
          .select('*')
          .eq('id', documentId)
          .eq('user_id', user.id)
          .single();

        if (reportError) throw new Error(reportError.message);
        setData(reportData);

      } catch (err) {
        setErrorDetails(err instanceof Error ? err.message : "An unknown error occurred.");
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
            <p className="text-slate-600 mb-6 font-medium">We couldn&apos;t locate this document in the registry.</p>
            <Link href="/dashboard" className="text-[#FF5F1F] font-black hover:underline tracking-wider uppercase text-sm flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
          </>
        )}
      </div>
    );
  }

  const aiResults = data!.ai_results || {};
  const primaryTraps = aiResults.primaryTraps || aiResults.criticalTraps || [];
  const secondaryConcerns = aiResults.secondaryConcerns || [];
  const emailDraft = aiResults.emailDraft || "";
  const overallRisk = aiResults.riskLevel || "Low";
  const industry = aiResults.industryDetected || "Professional Services";
  const hasRegulatory = primaryTraps.some((t: Finding) => t.triggerType === "Regulatory Trigger");
  const documentAnchors = aiResults.documentAnchors || {};
  const isLimitedScan = Boolean(aiResults.limitedScan);
  const isPartialOcrScan = Boolean(aiResults.partialOcrScan);
  // A Limited Scan (extraction failed / confidence too low) always has zero
  // primaryTraps by construction (see runAnalyzer in lib/analyzer/report.ts),
  // and Partial OCR can legitimately have zero if nothing was found on the
  // pages that were reviewed. Either way, zero findings here must never be
  // presented as a clean/low-risk result - the document text wasn't reliably
  // verified, so absence of findings proves nothing.
  const showUnreliableScanNotice = primaryTraps.length === 0 && (isLimitedScan || isPartialOcrScan);
  const anchorEntries = [
    ["Parties", documentAnchors.parties],
    ["Subcontract #", documentAnchors.subcontractNumber],
    ["Subcontract Type", documentAnchors.subcontractType],
    ["Prime Contract #", documentAnchors.primeContractNumber],
    ["Price / Estimated Value", documentAnchors.priceOrEstimatedValue],
    ["Funding Limit", documentAnchors.fundingLimit],
    ["Retainage", documentAnchors.retainage],
    ["Sector Evidence", documentAnchors.sectorEvidence],
  ].filter(([, value]) => Boolean(value));

  return (
    <div className="min-h-screen bg-[#F4F5F7] font-sans pb-20 print:pb-0 print:bg-white">
      <div className="bg-white border-b border-slate-200 py-6 px-6 sticky top-0 z-10 shadow-sm print:relative print:shadow-none print:border-b-2">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between md:items-end gap-4">
          <div>
            <Link href="/dashboard" className="text-slate-400 hover:text-[#FF5F1F] font-bold uppercase tracking-wider text-[10px] flex items-center gap-1 mb-2 transition-colors print:hidden">
              <ArrowLeft className="w-3 h-3" /> Return to Intake Hub
            </Link>
            <h1 className="text-2xl font-black text-[#1A3668] uppercase tracking-tight">Attorney Prep Toolkit & Briefing</h1>
            
            <div className="flex flex-col md:flex-row gap-x-3 gap-y-1 mt-3 flex-wrap">
                <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                  <span className="text-[#FF5F1F] font-bold">Document Reviewed:</span> {data!.file_name}
                </p>
                <p className="text-sm font-medium text-slate-300 hidden md:flex items-center">|</p>
                <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                  <span className="text-[#1A3668] font-bold">Sector Detected:</span> {industry}
                </p>
                <p className="text-sm font-medium text-slate-300 hidden md:flex items-center">|</p>
                <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                  <span className="text-[#1A3668] font-bold">Risk Focus:</span> 
                  {hasRegulatory ? "Federal Regulatory & Commercial Risk" : "Government Subcontractor Commercial Risk"}
                </p>
            </div>
          </div>

          <button
            onClick={() => window.print()}
            className="print:hidden flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider py-3 px-6 rounded-lg transition whitespace-nowrap"
          >
            <Download className="w-4 h-4" /> Download Attorney Prep Briefing
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">

          {isLimitedScan && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex items-start gap-3 break-inside-avoid">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-black text-amber-800 uppercase tracking-wide">Limited Scan</h3>
                <p className="text-sm text-amber-700 font-medium mt-1">
                  {aiResults.limitedScanReason || "Extraction confidence was too low to reliably scan this document."}
                </p>
              </div>
            </div>
          )}

          {isPartialOcrScan && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex items-start gap-3 break-inside-avoid">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-black text-amber-800 uppercase tracking-wide">Limited Scan — Partial OCR Scan</h3>
                <p className="text-sm text-amber-700 font-medium mt-1">
                  {aiResults.partialOcrReason || "This PDF appears scanned/image-based and could only be partially OCR-processed."}
                </p>
                <ul className="text-sm text-amber-700 font-medium mt-3 space-y-1 list-disc list-inside">
                  <li>This PDF appears scanned or image-based, not a native text document.</li>
                  <li>Total pages detected: {aiResults.ocrTotalPages ?? "unknown"}</li>
                  <li>Pages OCR-processed: {aiResults.ocrPagesProcessed ?? "unknown"}</li>
                  <li>Clauses on pages after the OCR cap may not have been reviewed and are not reflected below.</li>
                  <li>For a complete analysis, upload a text-based PDF, a DOCX/TXT file, or paste the full contract text.</li>
                </ul>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-2 border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#1A3668]" />
                <h2 className="text-sm font-black text-[#1A3668] uppercase tracking-widest">Top Active Liability Flags</h2>
            </div>
             <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-sm print:border print:text-black ${
                overallRisk === 'High' ? 'bg-red-100 text-red-700 border border-red-200' : 
                overallRisk === 'Medium-High' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                overallRisk === 'Medium' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 
                'bg-emerald-100 text-emerald-700 border border-emerald-200'
              }`}>
                SYSTEM RISK LEVEL: {overallRisk}
              </span>
          </div>

          {showUnreliableScanNotice ? (
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-10 text-center shadow-sm break-inside-avoid">
              <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto mb-3" />
              <h3 className="text-lg font-black text-amber-800 uppercase">Unable To Complete Reliable Risk Review</h3>
              <p className="text-sm text-amber-700 font-medium mt-2 max-w-xl mx-auto">
                Critical risks may be present, but SubShield could not verify the document text well enough to issue a clean finding.
                {" "}See the {isPartialOcrScan ? "Partial OCR Scan" : "Limited Scan"} notice above — this is not a clean or low-risk result.
              </p>
            </div>
          ) : primaryTraps.length === 0 ? (
            <div className="bg-white rounded-xl border border-emerald-200 p-10 text-center shadow-sm break-inside-avoid">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-lg font-black text-[#1A3668] uppercase">No Critical Flags Detected</h3>
              <p className="text-sm text-slate-500 font-medium mt-2">
                The system did not detect any of the targeted primary liabilities in this document.
              </p>
            </div>
          ) : (
            primaryTraps.map((trap: Finding, index: number) => (
              <div key={index} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden break-inside-avoid">
                <div className="px-6 py-3 border-b bg-slate-50 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#FF5F1F]" />
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                        {trap.triggerType ? trap.triggerType.toUpperCase() : "CONTRACT RISK TRIGGER"}: {trap.regulation}
                    </span>
                </div>
                <div className="p-6">
                  
                  <div className="mb-6 pl-4 border-l-2 border-slate-300">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Contract Text Extracted</p>
                    <p className="text-sm text-slate-600 font-serif italic">&quot;{trap.foundText}&quot;</p>
                  </div>

                  <div className="mb-6">
                    <p className="text-[10px] font-black text-[#1A3668] uppercase tracking-widest mb-1">Operational Liability</p>
                    <p className="text-sm text-slate-800 font-medium leading-relaxed">{trap.riskAnalysis}</p>
                  </div>

                  <div className="bg-slate-900 rounded-lg p-5 print:bg-slate-50 print:border print:border-slate-300">
                    <p className="text-[10px] font-black text-[#FF5F1F] uppercase tracking-widest mb-2">Suggested Safer Language</p>
                    <p className="text-sm text-slate-100 font-mono leading-relaxed print:text-slate-800">{trap.redlineFix}</p>
                  </div>
                </div>
              </div>
            ))
          )}

          {secondaryConcerns.length > 0 && (
            <div className="pt-8">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
                  <Info className="w-5 h-5 text-slate-500" />
                  <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest">Additional Contract Concerns</h2>
              </div>
              
              <div className="space-y-4">
                {secondaryConcerns.map((concern: Finding, index: number) => (
                  <div key={index} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden break-inside-avoid">
                    <div className="px-6 py-3 border-b bg-slate-50 flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            SECONDARY CONCERN: {concern.regulation}
                        </span>
                    </div>
                    <div className="p-6">
                      <div className="mb-4 pl-4 border-l-2 border-slate-200">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Contract Text Extracted</p>
                        <p className="text-sm text-slate-500 font-serif italic">&quot;{concern.foundText}&quot;</p>
                      </div>
                      <div className="mb-4">
                        <p className="text-sm text-slate-700 font-medium leading-relaxed">{concern.riskAnalysis}</p>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Suggested Safer Language</p>
                        <p className="text-sm text-slate-700 font-mono">{concern.redlineFix}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {anchorEntries.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm break-inside-avoid">
              <div className="px-6 py-3 border-b border-slate-100">
                <h2 className="text-sm font-black text-[#1A3668] uppercase tracking-widest">Document Anchors</h2>
              </div>
              <dl className="p-6 space-y-3">
                {anchorEntries.map(([label, value]) => (
                  <div key={label as string}>
                    <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</dt>
                    <dd className="text-sm text-slate-700 font-medium mt-0.5">{value as string}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

            <div className="flex items-center gap-2 mb-2 border-b border-slate-200 pb-2">
                <h2 className="text-sm font-black text-[#1A3668] uppercase tracking-widest">Consolidated PM Pushback Memo</h2>
            </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm sticky top-28 break-inside-avoid">
            <div className="p-6 bg-[#F8F9FA]">
              <div className="text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed mb-6">
                {emailDraft || "No email drafted for this clean contract."}
              </div>
              <button 
                onClick={handleCopyEmail}
                disabled={!emailDraft}
                className="w-full flex items-center justify-center gap-2 bg-[#FF5F1F] hover:bg-[#E04F1A] text-white text-xs font-black uppercase tracking-wider py-3.5 px-6 rounded-lg transition print:hidden"
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