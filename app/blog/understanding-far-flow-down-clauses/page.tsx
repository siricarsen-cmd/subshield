"use client";

import React from "react";
import { ShieldAlert, FileText, CheckCircle, ArrowLeft, Network } from "lucide-react";

export default function FarFlowDownClausesArticle() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased pb-20">
      <div className="bg-[#1A3668] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a href="/blog" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF5F1F] hover:text-white transition">
              <ArrowLeft className="w-4 h-4" /> Back to Knowledge Hub
            </a>
            <span className="self-start rounded-full border border-orange-300/60 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#FF5F1F]">
              FAR & DFARS Compliance
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight">
            Understanding FAR Flow-Down Clauses: What Belongs in Your Subcontract
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl font-medium">
            Learn how to distinguish clause requirements that apply to your subcontract from additional prime-drafted obligations that need separate review.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 text-sm text-slate-700 leading-relaxed font-medium">
          <p>
            Federal subcontracts often include a separate FAR or DFARS flowdown exhibit with dozens of clause citations. The important question is not whether federal clauses exist. It is whether each cited requirement actually applies to your subcontract and what it requires your company to do.
          </p>
          <p>
            A subcontractor should also separate federal flowdowns from payment, indemnity, termination, dispute, and other commercial terms the prime drafted for the subcontract itself. Both groups can matter, but they do not have the same source or applicability analysis.
          </p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#FF5F1F]" /> Start With Clause Applicability
          </h3>
          <p>
            There is no single universal FAR flowdown list for every subcontract. Applicability can depend on the prime contract, clause text, subcontract type, dollar value, scope, agency supplement, and whether the subcontract is for commercial products or commercial services.
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-xs text-slate-600 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
            <li>
              <strong className="text-[#1A3668]">Express or required flowdowns:</strong> Some clauses direct the prime to include specified language in qualifying subcontracts, sometimes only when stated thresholds or scope triggers are met.
            </li>
            <li>
              <strong className="text-[#1A3668]">Conditional flowdowns:</strong> Some requirements reach a subcontract only when the work, value, information, place of performance, or other stated condition is present.
            </li>
            <li>
              <strong className="text-[#1A3668]">Additional prime terms:</strong> A prime may also include commercial risk-allocation terms for its own contract-management reasons. Those provisions should be reviewed separately rather than assumed to be federally required.
            </li>
          </ol>
          <p>
            For a deeper breakdown, read <a href="/blog/mandatory-vs-optional-far-flowdowns" className="text-[#FF5F1F] font-bold hover:underline">Mandatory vs. Optional FAR Flowdowns</a>.
          </p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#FF5F1F]" /> Check Each Clause, Not Just the Title
          </h3>
          <p>
            For each cited FAR or DFARS clause, read the current text for subcontract instructions, thresholds, scope triggers, lower-tier requirements, and permitted substitutions. A clause title alone is not enough to establish that it belongs in your subcontract.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-[#1A3668]">FAR 52.222-26:</strong> Check the clause's subcontract requirements and the facts of the transaction.</li>
            <li><strong className="text-[#1A3668]">FAR 52.222-41:</strong> Check whether Service Contract Labor Standards apply to the covered services and workers.</li>
            <li><strong className="text-[#1A3668]">FAR 52.203-13:</strong> Check the current clause text for value, performance-period, commercial-item, and lower-tier conditions.</li>
          </ul>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#FF5F1F]" /> Commercial Products and Services Need Their Own Review
          </h3>
          <p>
            FAR 44.402 and FAR 52.244-6 are especially important when the subcontract is for commercial products or commercial services. The FAR limits which clauses are required to be imposed on qualifying commercial suppliers, subject to the current rule and agency-specific requirements.
          </p>
          <p>
            If that describes your work, see <a href="/blog/far-52-244-6-commercial-subcontracts" className="text-[#FF5F1F] font-bold hover:underline">FAR 52.244-6 Explained for Commercial Product and Service Subcontractors</a>.
          </p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#FF5F1F]" /> Missing Documents Can Block the Analysis
          </h3>
          <p>
            A flowdown clause may refer to a prime-contract section, agency supplement, wage determination, cybersecurity attachment, statement of work, or other document you were never given. Ask for the relevant material before signing rather than trying to infer the requirement from a clause number alone.
          </p>
          <p>
            See <a href="/blog/missing-prime-contract-documents" className="text-[#FF5F1F] font-bold hover:underline">Missing Prime Contract Documents</a> and <a href="/blog/far-flowdown-matrix" className="text-[#FF5F1F] font-bold hover:underline">What a FAR Flowdown Matrix Should Contain</a>.
          </p>

          <div className="bg-slate-100 border-l-4 border-[#1A3668] p-4 rounded-r-xl space-y-2">
            <h4 className="text-xs font-black text-[#1A3668] uppercase tracking-wider">Substitutions and Mutatis Mutandis Language</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              A substitution clause can adapt a prime-contract provision for the prime-subcontract relationship, but it can also create ambiguity if Government references are replaced mechanically. Review which terms are being substituted and how conflicts are resolved.
            </p>
          </div>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#FF5F1F]" /> A Practical Flowdown Review Process
          </h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Identify the source of each cited clause.</li>
            <li>Check the current clause text and applicability trigger.</li>
            <li>Separate federal requirements from prime-drafted commercial terms.</li>
            <li>Request missing prime-contract sections and referenced attachments.</li>
            <li>Record any lower-tier flowdown you will need to administer.</li>
            <li>Send unresolved legal or applicability questions to qualified counsel before signing.</li>
          </ul>

          <div className="bg-slate-50 border-l-4 border-[#FF5F1F] p-4 rounded-r-xl">
            <p className="text-[10px] font-black text-[#1A3668] uppercase tracking-widest">Related guides</p>
            <div className="mt-2 space-y-1 text-xs">
              <p><a href="/blog/incorporation-by-reference-ambush" className="text-[#FF5F1F] font-bold hover:underline">Incorporation by Reference: Review Documents You Are Being Asked to Accept</a></p>
              <p><a href="/blog/mandatory-vs-optional-far-flowdowns" className="text-[#FF5F1F] font-bold hover:underline">Mandatory vs. Optional FAR Flowdowns</a></p>
              <p><a href="/blog/far-52-244-6-commercial-subcontracts" className="text-[#FF5F1F] font-bold hover:underline">FAR 52.244-6 for Commercial Subcontracts</a></p>
              <p><a href="/blog/far-flowdown-matrix" className="text-[#FF5F1F] font-bold hover:underline">What Is a FAR Flowdown Matrix?</a></p>
              <p><a href="/blog/cmmc-requirements-dod-subcontractors-2026" className="text-[#FF5F1F] font-bold hover:underline">CMMC Requirements for DoD Subcontractors in 2026</a></p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border-2 border-[#FF5F1F] rounded-xl p-6 shadow-md space-y-4 sticky top-6">
            <div className="p-2 bg-[#FF5F1F]/10 rounded-lg text-[#FF5F1F] inline-block"><Network className="w-6 h-6" /></div>
            <h4 className="text-sm font-black text-[#1A3668] uppercase tracking-wide">Review Before You Commit</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">Use the article as a checklist for clauses, documents, and questions to resolve before bidding, signing, or committing resources.</p>
            <p className="text-xs text-slate-600 leading-relaxed font-medium"><strong className="text-[#1A3668]">SubPreCheck</strong> can surface the relevant language, organize evidence-grounded issues, and prepare a focused package for discussion with the prime and qualified counsel.</p>
            <hr className="border-slate-100" />
            <a href="/sample-report" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-white bg-[#FF5F1F] hover:bg-[#E04F1A] rounded-lg transition shadow-sm">View Sample Report</a>
            <a href="/pricing" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-[#1A3668] border border-slate-200 hover:border-[#FF5F1F] rounded-lg transition">See Review Plans</a>
          </div>
        </div>
      </div>
    </div>
  );
}
