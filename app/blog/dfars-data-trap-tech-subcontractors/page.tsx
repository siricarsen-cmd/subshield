"use client";

import React from "react";
import { ShieldAlert, FileText, CheckCircle, ArrowLeft, Binary } from "lucide-react";

export default function DfarsDataTrapArticle() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased pb-20">
      <div className="bg-[#1A3668] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a href="/blog" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF5F1F] hover:text-white transition"><ArrowLeft className="w-4 h-4" /> Back to Knowledge Hub</a>
            <span className="self-start rounded-full border border-orange-300/60 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#FF5F1F]">IT & Professional Services</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight">DFARS Cybersecurity and Data Rights: Risk Points for Technology Subcontractors</h1>
          <p className="text-slate-300 text-sm max-w-2xl font-medium">Review cybersecurity flowdowns, CUI/FCI triggers, system boundaries, data-rights clauses, background IP, and licensing terms before accepting a DoD subcontract.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 text-sm text-slate-700 leading-relaxed font-medium">
          <p>A DoD subcontract can introduce cybersecurity and data-rights requirements that are not part of a typical commercial agreement. Technology companies, MSPs, software firms, engineering businesses, and other service providers should identify those obligations before they price the work or connect government information to their systems.</p>
          <p>The first step is to separate the issues. Cybersecurity requirements such as DFARS 252.204-7012 and CMMC address information and system protections. Technical data and software clauses address rights in deliverables, background technology, markings, assertions, and licenses. Both can appear in the same subcontract, but they require different review questions.</p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-[#FF5F1F]" /> 1. Identify the Cybersecurity Flowdowns</h3>
          <p>Check the subcontract for DFARS cybersecurity clauses, CMMC language, NIST SP 800-171 requirements, SPRS obligations, incident-reporting duties, cloud requirements, and any prime-specific security attachments.</p>
          <p>Applicability is contract- and scope-specific. The important questions are what information your company will process, store, or transmit; which information systems will be used; and what lower-tier requirements apply if you pass information to a supplier.</p>
          <p>For the current 2026 rule and subcontract flowdown requirements, read <a href="/blog/cmmc-requirements-dod-subcontractors-2026" className="text-[#FF5F1F] font-bold hover:underline">CMMC Requirements for DoD Subcontractors in 2026</a>.</p>

          <div className="bg-slate-50 border-l-4 border-[#FF5F1F] p-4 rounded-r-xl">
            <p className="text-xs text-slate-600 leading-relaxed">Cyber requirements are also a flowdown question. See <a href="/blog/understanding-far-flow-down-clauses" className="text-[#FF5F1F] font-bold hover:underline">Understanding FAR Flow-Down Clauses</a> and <a href="/blog/mandatory-vs-optional-far-flowdowns" className="text-[#FF5F1F] font-bold hover:underline">Mandatory vs. Optional FAR Flowdowns</a>.</p>
          </div>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2"><FileText className="w-5 h-5 text-[#FF5F1F]" /> 2. Separate FCI, CUI, and the Systems in Scope</h3>
          <p>Do not assume that every employee, device, or corporate system is automatically in the same compliance boundary. Identify the information that will be handled and the systems that will actually process, store, or transmit it during performance.</p>
          <p>If the prime sends a standard cybersecurity exhibit, ask whether the required level and controls match the information being flowed down. A clear information-flow description makes the technical and contractual review much easier.</p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2"><FileText className="w-5 h-5 text-[#FF5F1F]" /> 3. Review Technical Data and Software Rights Separately</h3>
          <p>Government data and software rights are not a simple ownership rule. Rights can depend on the applicable DFARS clause, the type of technical data or software, development funding, markings, assertions, deliverable requirements, and whether the material existed before the contract.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-[#1A3668]">Background IP:</strong> Identify pre-existing software, methods, tools, data, templates, and know-how before work starts.</li>
            <li><strong className="text-[#1A3668]">Deliverables:</strong> Confirm exactly what technical data, software, source code, documentation, or other material must be delivered.</li>
            <li><strong className="text-[#1A3668]">License rights:</strong> Separate Government rights from any additional rights the prime asks to receive.</li>
            <li><strong className="text-[#1A3668]">Markings and assertions:</strong> Identify any steps required to preserve the intended rights in restricted or proprietary material.</li>
          </ul>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
            <h3 className="text-xs font-black text-[#1A3668] uppercase tracking-wide">Explore the DoD Cyber & Data-Rights Clusters</h3>
            <ul className="space-y-2 text-xs">
              <li><a href="/blog/cmmc-cybersecurity-subcontractor-hub" className="text-[#1A3668] font-black hover:text-[#FF5F1F] hover:underline">CMMC & DoD Cybersecurity Hub for Subcontractors</a></li>
              <li><a href="/blog/dod-data-rights-audit-hub" className="text-[#1A3668] font-black hover:text-[#FF5F1F] hover:underline">DoD Data Rights, IP, Audit & Records Hub</a></li>
              <li><a href="/blog/dod-technical-data-rights-subcontracts" className="text-[#FF5F1F] font-bold hover:underline">Technical Data Rights in DoD Subcontracts: What to Review Before Delivery</a></li>
              <li><a href="/blog/government-purpose-rights-vs-unlimited-rights" className="text-[#FF5F1F] font-bold hover:underline">Government Purpose Rights vs. Unlimited Rights</a></li>
              <li><a href="/blog/background-ip-dod-subcontracts" className="text-[#FF5F1F] font-bold hover:underline">Background IP in DoD Subcontracts</a></li>
              <li><a href="/blog/fci-vs-cui-dod-subcontractors" className="text-[#FF5F1F] font-bold hover:underline">FCI vs. CUI for DoD Subcontractors</a></li>
            </ul>
          </div>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-[#FF5F1F]" /> 4. Build the Questions Before Attorney Review</h3>
          <p>A useful first-pass review should identify the cyber clauses, CMMC level, FCI/CUI references, system obligations, technical-data clauses, software-rights provisions, background-IP language, and missing attachments. Counsel can then focus on applicability, negotiation language, required markings or assertions, and final legal judgment.</p>
        </div>

        <div className="space-y-6">
          <div className="bg-white border-2 border-[#FF5F1F] rounded-xl p-6 shadow-md space-y-4 sticky top-6">
            <div className="p-2 bg-[#FF5F1F]/10 rounded-lg text-[#FF5F1F] inline-block"><Binary className="w-6 h-6" /></div>
            <h4 className="text-sm font-black text-[#1A3668] uppercase tracking-wide">Review Before You Commit</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium"><strong className="text-[#1A3668]">SubPreCheck</strong> can surface cyber, data-rights, background-IP, and missing-document language so the package is organized before discussion with the prime and qualified counsel.</p>
            <a href="/sample-report" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-white bg-[#FF5F1F] hover:bg-[#E04F1A] rounded-lg transition shadow-sm">View Sample Report</a>
            <a href="/pricing" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-[#1A3668] border border-slate-200 hover:border-[#FF5F1F] rounded-lg transition">See Review Plans</a>
          </div>
        </div>
      </div>
    </div>
  );
}
