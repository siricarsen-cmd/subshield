"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  FileText, ShieldAlert, ArrowRight, CheckCircle, Download, 
  Mail, Layers, HelpCircle as GavelIcon 
} from "lucide-react";
import FinalCTA from "../components/FinalCTA"; 

export default function Home() {
  // Local state manager for the Dual-Track Intake Selector (Component 2)
  const [activeTab, setActiveTab] = useState<"triage" | "scan">("triage");

  // Lead capture email and submission state
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Grid elements mapping variables (Component 3)
  const govConThreats = [
    {
      title: "FAR 52.232-27 Prompt Pay Traps",
      desc: "Stop primes from using 'Pay-If-Paid' boilerplate to stall your progress draws when federal funds delay."
    },
    {
      title: "Predatory DFARS Cyber/CMMC Flows",
      desc: "Isolate overreached security flow-downs that dump enterprise compliance costs onto small trade shops."
    },
    {
      title: "Commercial Item Exemptions (FAR 52.212-5)",
      desc: "Assert your right to reject dense federal cost tracking rules if your materials qualify as standard catalog supply."
    },
    {
      title: "Unauthorized PM Change Orders",
      desc: "Stop performing field adjustments on verbal handshakes. Force written directives backed by CO authority."
    },
    {
      title: "Unenforceable Post-Award Workshares",
      desc: "Prevent primes from shopping your specialized parameters or cutting your scope after using your past performance to win."
    },
    {
      title: "Broad-Form Indemnity Shields",
      desc: "Strike lopsided boilerplate that forces your enterprise to insure or legally defend a prime contractor's field mistakes."
    },
    {
      title: "Liquidated Damages & Sequencing Traps",
      desc: "Defend lower-tier subcontractors from absorbing daily performance penalties caused entirely by early-stage timeline slips."
    },
    {
      title: "FAR Part 31 Mobilization Cost Recovery",
      desc: "Secure your audit-proof settlement package covering pre-purchased custom inventory if a project faces sudden cancellation."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-900 antialiased font-sans">
      
      {/* COMPONENT 1: THE HERO COMPONENT WITH REACTIVE LEAD CAPTURE */}
      <section className="max-w-6xl mx-auto px-6 pt-16 md:pt-24 pb-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* LEFT COLUMN: BRAND TYPOGRAPHY */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <span className="text-[10px] font-black text-[#FF5F1F] uppercase tracking-widest bg-orange-50 border border-orange-200/50 px-3 py-1 rounded-full inline-block">
            Attorney Prep Toolkit
          </span>
          
          <h1 className="text-3xl md:text-5xl font-black text-[#1A3668] tracking-tight uppercase leading-tight">
            Stop Paying Your Attorney $500/Hour to Read Federal Boilerplate.
          </h1>
          
          <p className="text-base md:text-lg text-[#596A7D] font-medium leading-relaxed max-w-2xl">
            Whether it's a casual email offer or a 100-page formal prime contract, SubShield isolates GovCon risk factors in 60 seconds—compressing your lawyer's billable hours from days to minutes.
          </p>
          
          <div className="pt-2">
            <button 
              onClick={() => {
                const element = document.getElementById("intake-selector");
                element?.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-[#FF5F1F] text-white px-8 py-4 rounded-xl hover:bg-[#1A3668] transition-all font-black text-xs sm:text-sm tracking-widest uppercase inline-flex items-center gap-2 group shadow-sm"
            >
              START FREE TRIAGE <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: PRE-BID TRIAGE CHECKLIST LEAD CAPTURE CARD */}
        <div className="lg:col-span-5 w-full flex justify-center lg:justify-end">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-md p-6 md:p-8 flex flex-col justify-between h-[460px] relative overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-[#1A3668]"></div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-slate-100 text-[#1A3668] rounded-lg">
                    <FileText size={18} className="text-[#FF5F1F]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-[#1A3668] uppercase tracking-wide">Pre-Bid Triage Checklist</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Free Blueprint Download</p>
                  </div>
                </div>
                <span className="text-[9px] font-black text-orange-700 bg-orange-50 border border-orange-200/60 px-2 py-0.5 rounded uppercase tracking-wider">
                  PDF Available
                </span>
              </div>

              {!isSubmitted ? (
                <>
                  <p className="text-xs text-[#596A7D] font-medium leading-relaxed">
                    Don't bid blind. Arm your estimating team with the exact single-page defense checklist used to isolate and eliminate predatory boilerplate terms before signing.
                  </p>

                  <div className="space-y-3 pt-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Inside the Guide:</span>
                    
                    <div className="flex items-start gap-2.5 text-xs font-bold text-slate-700 uppercase tracking-wide">
                      <CheckCircle size={14} className="text-[#FF5F1F] shrink-0 mt-0.5" />
                      <span>The "Pay-If-Paid" 60-day stop-gap script</span>
                    </div>
                    
                    <div className="flex items-start gap-2.5 text-xs font-bold text-slate-700 uppercase tracking-wide">
                      <CheckCircle size={14} className="text-[#FF5F1F] shrink-0 mt-0.5" />
                      <span>Broad-form indemnity alternate text</span>
                    </div>
                    
                    <div className="flex items-start gap-2.5 text-xs font-bold text-slate-700 uppercase tracking-wide">
                      <CheckCircle size={14} className="text-[#FF5F1F] shrink-0 mt-0.5" />
                      <span>Uncapped liquid damages ceiling limits</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center pt-8 text-center space-y-3">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-200">
                    <CheckCircle size={28} />
                  </div>
                  <h4 className="text-sm font-black text-[#1A3668] uppercase tracking-wide">Blueprint Secured!</h4>
                  <p className="text-xs text-[#596A7D] font-medium leading-relaxed max-w-[240px]">
                    We just sent the 5-Step Triage Checklist to <span className="font-bold text-[#1A3668]">{email}</span>. Check your inbox!
                  </p>
                </div>
              )}
            </div>

            {/* Inline Lead Capture Submission Form Container */}
            {!isSubmitted && (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (email.trim() !== "") {
                    setIsSubmitted(true);
                  }
                }}
                className="space-y-3 pt-4 border-t border-slate-100"
              >
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your professional email" 
                  required
                  className="w-full px-3 py-2.5 text-xs font-bold border border-slate-300 rounded-lg bg-slate-50 focus:outline-none focus:border-[#FF5F1F] text-slate-700 placeholder-slate-400 shadow-2xs"
                />
                <button 
                  type="submit"
                  className="w-full py-3 text-center text-xs font-black uppercase tracking-wider text-white bg-[#FF5F1F] hover:bg-[#1A3668] rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  Get the 5-Step Checklist <Download size={14} />
                </button>
              </form>
            )}
            
          </div>
        </div>
      </section>

      {/* COMPONENT 2: SECTION 2 TAB/COLUMN LAYOUT (THE DUAL-TRACK GATEWAY) */}
      <section id="intake-selector" className="max-w-6xl mx-auto px-6 py-12 scroll-mt-6">
        <div className="text-center mb-8">
          <h2 className="text-xs font-black text-[#FF5F1F] uppercase tracking-widest">Select Entry Gate</h2>
          <h3 className="text-xl sm:text-2xl font-extrabold text-[#1A3668] uppercase tracking-tight mt-1">
            Choose Your Contract Processing Channel
          </h3>
        </div>

        {/* Dynamic Navigation Toggles */}
        <div className="flex justify-center border-b border-slate-200 max-w-lg mx-auto mb-8">
          <button 
            onClick={() => setActiveTab("triage")}
            className={`w-1/2 py-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 ${activeTab === "triage" ? "border-[#FF5F1F] text-[#1A3668]" : "border-transparent text-slate-400"}`}
          >
            Pre-Award Triage
          </button>
          <button 
            onClick={() => setActiveTab("scan")}
            className={`w-1/2 py-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 ${activeTab === "scan" ? "border-[#FF5F1F] text-[#1A3668]" : "border-transparent text-slate-400"}`}
          >
            Post-Award Deep Scan
          </button>
        </div>

        {/* Tab Selection Canvas Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* TRACK 1 CONTAINER: PRE-AWARD TRIAGE */}
          <div 
            onClick={() => setActiveTab("triage")}
            className={`p-6 rounded-2xl cursor-pointer transition-all flex flex-col justify-between border ${
              activeTab === "triage" 
                ? "bg-[#1A3668] text-white border-2 border-[#FF5F1F] shadow-sm" 
                : "bg-white text-slate-900 border-slate-200 shadow-xs hover:border-slate-300"
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${activeTab === "triage" ? "bg-orange-500/20 text-orange-300" : "bg-slate-100 text-slate-500"}`}>
                  Bidding Phase
                </span>
                <Mail size={16} className={activeTab === "triage" ? "text-[#FF5F1F]" : "text-slate-400"} />
              </div>
              <div>
                <h4 className={`text-base font-bold uppercase tracking-tight ${activeTab === "triage" ? "text-white" : "text-[#1A3668]"}`}>
                  Bidding & Teaming Analysis
                </h4>
                <p className={`text-xs mt-1 leading-relaxed ${activeTab === "triage" ? "text-slate-300" : "text-[#596A7D]"}`}>
                  Paste project email text or upload loose Teaming Agreements/LOIs.
                </p>
              </div>

              {/* Interactive Input Form Block */}
              <div className="space-y-3 pt-2">
                <textarea 
                  placeholder="Paste informal solicitation email copy or agreement parameters here..." 
                  disabled={activeTab !== "triage"}
                  className={`w-full h-24 p-3 text-xs rounded-xl border font-mono resize-none focus:outline-none ${
                    activeTab === "triage" 
                      ? "bg-[#142a52] border-slate-600 text-slate-100 placeholder-slate-400 focus:border-[#FF5F1F]" 
                      : "bg-slate-50 border-slate-200 text-slate-400 placeholder-slate-300"
                  }`}
                />
                <div className={`w-full border border-dashed rounded-xl p-3 text-center text-xs font-bold uppercase tracking-wide ${
                  activeTab === "triage" ? "border-slate-500 text-slate-300" : "border-slate-200 text-slate-400"
                }`}>
                  Upload LOI File
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Link 
                href="/report/triage"
                onClick={(e) => activeTab !== "triage" && e.preventDefault()}
                className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest text-center flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === "triage" 
                    ? "bg-[#FF5F1F] text-white hover:bg-orange-600" 
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                Execute Informal Triage <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* TRACK 2 CONTAINER: POST-AWARD DEEP SCAN */}
          <div 
            onClick={() => setActiveTab("scan")}
            className={`p-6 rounded-2xl cursor-pointer transition-all flex flex-col justify-between border ${
              activeTab === "scan" 
                ? "bg-[#1A3668] text-white border-2 border-[#FF5F1F] shadow-sm" 
                : "bg-white text-slate-900 border-slate-200 shadow-xs hover:border-slate-300"
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${activeTab === "scan" ? "bg-orange-500/20 text-orange-300" : "bg-slate-100 text-slate-500"}`}>
                  Execution Phase
                </span>
                <Layers size={16} className={activeTab === "scan" ? "text-[#FF5F1F]" : "text-slate-400"} />
              </div>
              <div>
                <h4 className={`text-base font-bold uppercase tracking-tight ${activeTab === "scan" ? "text-white" : "text-[#1A3668]"}`}>
                  Formal Contract Deep Scan
                </h4>
                <p className={`text-xs mt-1 leading-relaxed ${activeTab === "scan" ? "text-slate-300" : "text-[#596A7D]"}`}>
                  Upload full multi-page PDF or Word prime agreements.
                </p>
              </div>

              {/* Standard File Upload Box Dropzone */}
              <div className="pt-2">
                <div className={`w-full border-2 border-dashed rounded-xl h-36 flex flex-col items-center justify-center text-center p-4 transition-all ${
                  activeTab === "scan" 
                    ? "border-slate-500 bg-[#142a52] text-slate-300" 
                    : "border-slate-200 bg-slate-50 text-slate-400"
                }`}>
                  <FileText size={24} className={activeTab === "scan" ? "text-[#FF5F1F] mb-2" : "text-slate-300 mb-2"} />
                  <span className="text-xs font-bold uppercase tracking-wider">Drag & Drop Prime Agreement</span>
                  <span className="text-[10px] uppercase text-slate-400 mt-1">PDF or DOCX up to 50MB</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Link 
                href="/report/scan"
                onClick={(e) => activeTab !== "scan" && e.preventDefault()}
                className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest text-center flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === "scan" 
                    ? "bg-[#FF5F1F] text-white hover:bg-orange-600" 
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                Execute Deep Scan <ArrowRight size={14} />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* COMPONENT 4: THE VALUE PIVOT */}
      <section className="bg-white border-t border-b border-slate-200 py-16 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex p-3 bg-slate-50 text-[#1A3668] border border-slate-200 rounded-full">
            <GavelIcon size={20} />
          </div>
          <h2 className="text-xs font-black text-[#FF5F1F] uppercase tracking-widest">Operational Efficiency</h2>
          <h3 className="text-xl sm:text-2xl font-extrabold text-[#1A3668] uppercase tracking-tight">
            An Intake Pipeline Built Around Your Billable Hour
          </h3>
          <p className="text-sm md:text-base text-[#596A7D] font-medium max-w-2xl mx-auto leading-relaxed">
            SubShield is an educational toolkit and a billable hour compactor, not a law firm. We do not replace your attorney—we protect your wallet. By isolating predatory boilerplates and mapping out compliant redlines beforehand, your lawyer can focus instantly on high-level strategy instead of spending billable days manually reading standard federal acquisition rules.
          </p>
        </div>
      </section>

      {/* COMPONENT 3: SECTION 3 GRID (RISK COVERAGE MATRIX) */}
      <section className="py-20 px-6 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[10px] font-black text-[#FF5F1F] uppercase tracking-widest bg-orange-50 border border-orange-200/50 px-3 py-1 rounded-full">
            Risk Coverage Matrix
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A3668] uppercase tracking-tight mt-4">
            Isolating Targeted Government Procurement Risks
          </h2>
          <p className="text-sm text-[#596A7D] font-medium mt-2 leading-relaxed">
            Standard contract scrapers check for high-level commercial clauses. SubShield monitors the specific acquisition paths that target lower-tier subcontractor revenue.
          </p>
        </div>

        {/* Technical Matrix Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {govConThreats.map((threat, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-3 flex flex-col justify-between hover:border-slate-300 transition-all">
              <div className="space-y-2">
                <div className="w-2 h-2 rounded-full bg-[#FF5F1F]" />
                <h4 className="text-xs font-black text-[#1A3668] uppercase tracking-wide leading-tight min-h-[32px]">
                  {threat.title}
                </h4>
                <p className="text-[11px] text-[#596A7D] font-medium leading-relaxed">
                  {threat.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <FinalCTA />
    </div>
  );
}