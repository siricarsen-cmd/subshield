"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldAlert, Copy, AlertTriangle, FileText } from "lucide-react";

export default function SampleReportPage() {
  const handleCopyEmail = () => {
    // In production, this will copy the textarea content to the clipboard
    alert("Negotiation email copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] font-sans text-slate-900 pb-24">
      
      {/* Top Navigation */}
      <div className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="inline-flex items-center text-xs font-bold text-[#FF5F1F] hover:text-orange-600 uppercase tracking-widest transition-colors">
            <ArrowLeft size={14} className="mr-2" /> Return to Dashboard
          </Link>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Sample Report Environment
          </div>
        </div>
      </div>

      {/* Report Header */}
      <div className="max-w-7xl mx-auto px-6 pt-10 pb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-[#1A3668] uppercase tracking-tight">
              Attorney Prep Toolkit & Briefing Summary
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-2">
              Illustrative risk-review summary for: <strong className="text-slate-700">Fort_Meade_HVAC_Subcontract.pdf</strong>
            </p>
          </div>
          <div className="bg-red-50 border border-red-200 px-4 py-3 rounded-lg flex items-center gap-3 shadow-sm">
            <ShieldAlert className="w-6 h-6 text-red-600" />
            <div>
              <div className="text-sm font-black text-red-700 uppercase tracking-tight">8 Illustrative Risk Flags</div>
              <div className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Attorney Review Recommended Before Signing</div>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Email Builder */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-sm font-black text-[#1A3668] uppercase tracking-widest flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#FF5F1F]" /> Consolidated Prime Question Draft
          </h2>
          
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-280px)] min-h-[600px]">
            <div className="bg-slate-50 border-b border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500">
                Use this illustrative briefing as a starting point for document clarifications, prime-contractor questions, and discussion with qualified counsel.
              </p>
            </div>
            <textarea 
              readOnly
              className="flex-grow p-6 text-sm text-slate-700 font-medium leading-relaxed resize-none focus:outline-none"
              defaultValue={`Hi [PM Name],

We've reviewed the draft subcontract for the upcoming project. Before we execute and begin mobilization, we would like to clarify several terms in the draft that may affect liability, payment, and schedule risk. 

Specifically, we are requesting to amend the following:

1. Article 3 (Indemnification): The current language appears broad enough to reach losses outside our own acts or omissions. Please clarify the intended allocation of responsibility and consider narrowing the clause to losses caused by our work.

2. Article 5.2 (Contingent Payment): The current draft appears to condition payment on the Prime Contractor's receipt of funds. Please clarify whether this is intended as a condition precedent and whether the parties can use a defined payment deadline instead.

3. Schedule B (Delay Waivers): We cannot accept a blanket waiver for schedule extensions if the critical path is interrupted by preceding trades.

Let me know when you have 10 minutes to jump on a quick call so we can align these terms and move forward.

Best regards,
[Your Name]`}
            />
            <div className="p-4 bg-slate-50 border-t border-slate-200">
              <button 
                onClick={handleCopyEmail}
                className="w-full flex justify-center items-center gap-2 bg-[#FF5F1F] text-white hover:bg-[#E04F1A] py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm"
              >
                <Copy className="w-4 h-4" /> Copy Complete Email
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Liability Flags */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-sm font-black text-[#1A3668] uppercase tracking-widest flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#FF5F1F]" /> Illustrative Contract Issues
          </h2>

          <div className="space-y-4 overflow-y-auto pr-2" style={{ maxHeight: 'calc(100vh - 280px)' }}>
            
            {/* Flag 1 */}
            <div className="bg-white border-l-4 border-red-500 border-y border-r border-y-slate-200 border-r-slate-200 rounded-r-2xl p-6 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className="bg-red-100 text-red-700 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded">Critical</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">General Liability Risk</span>
                </div>
              </div>
              <h3 className="text-base font-black text-[#1A3668] uppercase tracking-tight mb-2">Broad-Form Duty to Defend and Indemnify</h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed mb-4">
                Article 3 appears broad enough to require indemnification for some losses that may not be caused by the subcontractor. The scope should be confirmed before signing.
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-[10px] font-black text-[#FF5F1F] uppercase tracking-widest mb-1.5">Discussion Point:</p>
                <p className="text-xs text-slate-700 font-medium leading-relaxed">A discussion point for counsel is whether the clause should be narrowed with language such as: <em className="text-[#1A3668]">"Subcontractor's indemnification obligations under this Article shall apply only to the extent caused by the negligent acts, errors, or omissions of the subcontractor..."</em></p>
              </div>
            </div>

            {/* Flag 2 */}
            <div className="bg-white border-l-4 border-red-500 border-y border-r border-y-slate-200 border-r-slate-200 rounded-r-2xl p-6 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className="bg-red-100 text-red-700 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded">Critical</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cash Flow Threat</span>
                </div>
              </div>
              <h3 className="text-base font-black text-[#1A3668] uppercase tracking-tight mb-2">Contingent Pay-If-Paid Condition Precedent</h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed mb-4">
                Section 5 appears to shift substantial non-payment risk to the subcontractor by conditioning payment on the Prime Contractor's receipt of funds. Confirm the clause's legal effect and available payment protections with qualified counsel.
              </p>
            </div>

            {/* Flag 3 */}
            <div className="bg-white border-l-4 border-orange-500 border-y border-r border-y-slate-200 border-r-slate-200 rounded-r-2xl p-6 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className="bg-orange-100 text-orange-700 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded">High Risk</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Regulatory Mandate</span>
                </div>
              </div>
              <h3 className="text-base font-black text-[#1A3668] uppercase tracking-tight mb-2">DFARS 252.204-7012 Cybersecurity Protocol</h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed mb-4">
                The draft flows down DoD cybersecurity requirements. Confirm whether the clause applies to the subcontract scope, what covered information is involved, and what compliance cost should be reflected in pricing before accepting the obligation.
              </p>
            </div>

            {/* Flag 4 */}
            <div className="bg-white border-l-4 border-red-500 border-y border-r border-y-slate-200 border-r-slate-200 rounded-r-2xl p-6 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className="bg-red-100 text-red-700 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded">Critical</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Schedule Protection</span>
                </div>
              </div>
              <h3 className="text-base font-black text-[#1A3668] uppercase tracking-tight mb-2">No Damages for Delay Waiver</h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed mb-4">
                This clause may limit recovery of delay-related costs, including some overhead, even when the subcontractor did not cause the delay. Review the exceptions, notice rules, and governing law with counsel.
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}