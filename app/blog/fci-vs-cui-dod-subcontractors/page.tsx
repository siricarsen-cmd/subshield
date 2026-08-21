"use client";

import React from "react";
import { ArrowLeft, Database, FileLock2, Network, ShieldCheck } from "lucide-react";

export default function FciVsCuiArticle() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased pb-20">
      <div className="bg-[#1A3668] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a href="/blog" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF5F1F] hover:text-white transition">
              <ArrowLeft className="w-4 h-4" /> Back to Knowledge Hub
            </a>
            <span className="self-start rounded-full border border-orange-300/60 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#FF5F1F]">
              CMMC &amp; CUI
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight">
            FCI vs. CUI: What DoD Subcontractors Need to Know Before CMMC
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl font-medium">
            The information your systems process, store, or transmit can change the CMMC level and assessment path that applies to a DoD subcontract.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 text-sm text-slate-700 leading-relaxed font-medium">
          <p>
            “Do we have CUI?” is one of the most important pre-award questions in a DoD subcontract. But it helps to start one step earlier: determine what Federal Contract Information (FCI) and Controlled Unclassified Information (CUI) will actually move through your company’s systems during performance.
          </p>
          <p>
            The difference matters because the CMMC program ties subcontractor requirements to the information handled on contractor information systems, not simply to the fact that the customer is the Department of Defense.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3 flex items-center gap-2">
            <Database className="w-5 h-5 text-[#FF5F1F]" /> What is Federal Contract Information?
          </h2>
          <p>
            FAR 4.1901 defines FCI as information not intended for public release that is provided by or generated for the Government under a contract to develop or deliver a product or service. The definition excludes information the Government has made public and simple transactional information such as information necessary to process payments.
          </p>
          <p>
            FAR Subpart 4.19 applies when a contractor information system may contain FCI, and FAR 52.204-21 provides the basic safeguarding requirements used by CMMC Level 1.
          </p>
          <p className="text-xs text-slate-500">
            Official source: <a href="https://www.acquisition.gov/far/4.1901" className="text-[#1A3668] font-bold hover:underline">FAR 4.1901, Definitions</a>.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3 flex items-center gap-2">
            <FileLock2 className="w-5 h-5 text-[#FF5F1F]" /> What is Controlled Unclassified Information?
          </h2>
          <p>
            CUI is unclassified information that a law, regulation, or Government-wide policy requires or permits an agency to protect with safeguarding or dissemination controls. In the CMMC context, the current DFARS clause uses the 32 CFR definition and ties system requirements to whether FCI or CUI will be processed, stored, or transmitted during contract performance.
          </p>
          <p>
            CUI is not simply “anything sensitive.” The underlying information category, contract requirement, marking, distribution controls, and guidance from the Government or prime all matter. If the package is unclear about what information you will receive or create, treat that as a pre-award clarification issue.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#FF5F1F]" /> Why the distinction changes CMMC
          </h2>
          <p>
            32 CFR 170.23 sets the subcontractor flowdown framework. If a subcontractor will process, store, or transmit FCI but not CUI, Level 1 (Self) is required. If the subcontractor will handle CUI, Level 2 (Self) is the minimum, with a Level 2 C3PAO assessment required when the associated prime contract requires Level 2 (C3PAO). A Level 3 prime contract generally flows a minimum Level 2 (C3PAO) requirement to a subcontractor handling CUI unless specific guidance changes the result.
          </p>
          <p>
            That is why asking only “What CMMC level does the prime have?” can produce the wrong answer. The subcontractor’s information flow and the associated contract requirement both matter.
          </p>
          <p className="text-xs text-slate-500">
            Regulatory source: <a href="https://www.ecfr.gov/current/title-32/subtitle-A/chapter-I/subchapter-D/part-170/section-170.23" className="text-[#1A3668] font-bold hover:underline">32 CFR 170.23, Application to subcontractors</a>.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3 flex items-center gap-2">
            <Network className="w-5 h-5 text-[#FF5F1F]" /> Map the information before mapping the systems
          </h2>
          <p>Before buying tools or assuming every corporate system is in scope, map the expected information path:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>What nonpublic federal information will the prime send you?</li>
            <li>What information will your team generate for the Government or prime?</li>
            <li>Which items are FCI, which are CUI, and which are neither?</li>
            <li>Which email, file-storage, endpoint, cloud, engineering, accounting, and collaboration systems will touch that information?</li>
            <li>Will any lower-tier supplier need the same information to perform its scope?</li>
          </ol>
          <p>
            A narrow, accurate information map can prevent both under-scoping and over-scoping. It also gives you a better basis for asking the prime what will actually be shared.
          </p>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
            <h3 className="text-xs font-black text-[#1A3668] uppercase tracking-wide">Pre-award questions for the prime</h3>
            <ul className="list-disc pl-5 space-y-2 text-xs text-slate-600">
              <li>Will our scope require us to process, store, or transmit FCI?</li>
              <li>Will our scope require CUI? If yes, what categories and markings should we expect?</li>
              <li>What CMMC level and assessment type is assigned to our subcontract?</li>
              <li>Which systems or interfaces will exchange controlled information with us?</li>
              <li>What must flow to our lower-tier suppliers?</li>
            </ul>
          </div>

          <p>
            Next: compare <a href="/blog/cmmc-level-1-vs-level-2" className="text-[#FF5F1F] font-bold hover:underline">CMMC Level 1 vs. Level 2</a>, then review <a href="/blog/cmmc-flowdown-lower-tier-subcontractors" className="text-[#FF5F1F] font-bold hover:underline">how CMMC flows to lower tiers</a>. For the broader 2026 framework, see our <a href="/blog/cmmc-requirements-dod-subcontractors-2026" className="text-[#FF5F1F] font-bold hover:underline">CMMC requirements guide</a>.
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-white border-2 border-[#FF5F1F] rounded-xl p-6 shadow-md space-y-4 sticky top-6">
            <h3 className="text-sm font-black text-[#1A3668] uppercase tracking-wide">Find the Cyber Triggers in the Package</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              SubPreCheck can surface DFARS and CMMC clauses, CUI references, incorporated cyber attachments, flowdown language, and missing documents before you commit.
            </p>
            <a href="/sample-report" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-white bg-[#FF5F1F] hover:bg-[#E04F1A] rounded-lg transition shadow-sm">View Sample Report</a>
            <a href="/pricing" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-[#1A3668] border border-slate-200 hover:border-[#FF5F1F] rounded-lg transition">See Review Plans</a>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              General educational information only. Information classification, CMMC scope, assessment type, and contract requirements should be confirmed against the actual solicitation, subcontract, and current DoD rules.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
