"use client";

import Link from "next/link";
import { 
  ClipboardPaste, 
  Binary, 
  FileText, 
  FileCheck2, 
  ArrowRight, 
  ChevronRight,
  ShieldCheck
} from "lucide-react";

export default function HowItWorksPage() {
  // Production array driving the streamlined 4-step progression modules
  const workflowSteps = [
    {
      stepNumber: "STEP 1",
      title: "DUAL-TRACK INTAKE",
      body: "Drop in an 80-page formal PDF subcontract, a short pre-award Teaming Agreement, or simply copy-paste the raw text of a project email from a prime contractor's estimator directly into the platform.",
      icon: <ClipboardPaste className="w-5 h-5 text-[#FF5F1F]" />
    },
    {
      stepNumber: "STEP 2",
      title: "RULE-MATRIX PARSING",
      body: "SubShield's processing engine instantly scans the text against our database of fixed Federal Acquisition Regulations (FAR) and DFARS parameters. The system isolates mandatory flow-downs from unfair, custom risk-shifting language.",
      icon: <Binary className="w-5 h-5 text-[#FF5F1F]" />
    },
    {
      stepNumber: "STEP 3",
      title: "PLAIN-ENGLISH TRANSLATION",
      body: "We convert dense federal boilerplate into clear, operational risk alerts. See exactly how a clause impacts your cash flow, protects your mobilization costs under FAR Part 31, or exposes your IT network to predatory cyber liabilities.",
      icon: <FileText className="w-5 h-5 text-[#FF5F1F]" />
    },
    {
      stepNumber: "STEP 4",
      title: "EXPORT YOUR BILLABLE COMPACTOR",
      body: "Export a clean Word document with tracked commercial redlines alongside a copy-pasteable 'PM Talk Track' email memo. Hand this targeted package to your GovCon attorney so they can verify the terms in minutes instead of billing you for hours of manual reading.",
      icon: <FileCheck2 className="w-5 h-5 text-[#FF5F1F]" />
    }
  ];

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-900 antialiased font-sans">
      
      {/* BREADCRUMB HEADER PLATFORM */}
      <div className="bg-white border-b border-slate-200 py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
          <Link href="/" className="text-[#1A3668] hover:text-[#FF5F1F] transition-colors">
            SubShield
          </Link>
          <ChevronRight size={14} className="mx-2" />
          <span className="text-slate-600 font-medium">Platform Workflow</span>
        </div>
      </div>

      {/* COMPONENT 1: THE PAGE HEADER & INTRO BLOCK */}
      <section className="bg-white pt-16 pb-20 px-6 border-b border-slate-200 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-slate-50 rounded-full blur-3xl opacity-50 z-0"></div>
        <div className="max-w-3xl mx-auto relative z-10 space-y-4">
          <span className="text-[10px] font-black text-[#FF5F1F] uppercase tracking-widest bg-orange-50 border border-orange-200/50 px-3 py-1 rounded-full inline-block">
            Operational Mechanics
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#1A3668] tracking-tight uppercase">
            THE SUBSHIELD WORKFLOW
          </h1>
          <p className="text-base sm:text-lg text-[#596A7D] font-medium max-w-2xl mx-auto leading-relaxed">
            How we filter complex federal procurement boilerplates into an organized, attorney-ready action plan in under 60 seconds.
          </p>
        </div>
      </section>

      {/* COMPONENT 2: THE FOUR-STEP PROGRESSION TIMELINE */}
      <section className="py-20 px-6 max-w-5xl mx-auto w-full">
        <div className="space-y-12 relative before:absolute before:inset-0 before:left-8 before:md:left-1/2 before:w-0.5 before:bg-slate-200 before:z-0">
          
          {workflowSteps.map((step, idx) => {
            const isEven = idx % 2 === 0;
            return (
              <div key={idx} className={`flex flex-col md:flex-row items-start relative z-10 ${isEven ? "md:flex-row-reverse" : ""}`}>
                
                {/* Visual Content Block */}
                <div className="w-full md:w-1/2 pl-16 md:pl-0 md:px-8">
                  <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-2xs space-y-3 hover:border-slate-300 transition-all">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <span className="text-[10px] font-black text-[#FF5F1F] uppercase tracking-wider bg-orange-50 px-2.5 py-0.5 rounded border border-orange-100">
                        {step.stepNumber}
                      </span>
                      <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                        {step.icon}
                      </div>
                    </div>
                    <h3 className="text-base font-black text-[#1A3668] uppercase tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#596A7D] font-medium leading-relaxed">
                      {step.body}
                    </p>
                  </div>
                </div>

                {/* Central Timeline Hub Node */}
                <div className="absolute left-4 md:left-1/2 top-6 -translate-x-1/2 w-8 h-8 rounded-full bg-[#1A3668] border-4 border-white flex items-center justify-center text-white text-[10px] font-bold z-20 shadow-sm">
                  {idx + 1}
                </div>

                {/* Invisible Structural Equalizer Grid Column */}
                <div className="hidden md:block w-1/2" />
              </div>
            );
          })}

        </div>
      </section>

      {/* COMPONENT 3: THE BOTTOM CALL-TO-ACTION (CTA) WRAP */}
      <section className="bg-[#1A3668] text-white py-16 px-6 text-center relative overflow-hidden border-t border-slate-800">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-900/20 rounded-full blur-3xl pointer-events-none z-0"></div>
        
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex p-2.5 bg-slate-800/40 border border-slate-700/60 rounded-full text-[#FF5F1F]">
            <ShieldCheck size={18} />
          </div>
          <h3 className="text-xl sm:text-3xl font-black uppercase tracking-tight max-w-3xl mx-auto leading-tight">
            STOP LOSING YOUR WORKING CAPITAL TO PREDATORY GOVERNMENT CONTRACT BOILERPLATE.
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed">
            Isolate mandatory FAR flow-downs, neutralize unfair liabilities, and drastically lower your upcoming legal fees before your team begins performance.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            {/* Primary Action Target */}
            <Link 
              href="/triage" 
              className="w-full sm:w-auto bg-[#FF5F1F] text-white hover:bg-orange-600 px-8 py-4 rounded-xl font-black text-xs sm:text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              START FREE TRIAGE <ArrowRight size={15} />
            </Link>
            
            {/* Secondary High-Contrast Ghost Outline Button */}
            <Link 
              href="/demo" 
              className="w-full sm:w-auto bg-transparent text-white border-2 border-slate-300 hover:border-white hover:bg-white/10 px-8 py-4 rounded-xl font-black text-xs sm:text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-2"
            >
              VIEW SAMPLE GOVCON REPORT <FileText size={15} />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}