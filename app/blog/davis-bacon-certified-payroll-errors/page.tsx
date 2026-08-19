"use client";

import React from "react";
import { ShieldAlert, FileText, CheckCircle, ArrowLeft, Construction } from "lucide-react";

export default function DavisBaconPayrollArticle() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased pb-20">
      
      {/* Header Banner */}
      <div className="bg-[#1A3668] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a href="/blog" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF5F1F] hover:text-white transition">
              <ArrowLeft className="w-4 h-4" /> Back to Knowledge Hub
            </a>
            <span className="self-start rounded-full border border-orange-300/60 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#FF5F1F]">
              GovCon Labor Compliance
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight">
            Davis-Bacon Certified Payroll: Classification and Documentation Risks
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl font-medium">
            Review wage determinations, classifications, certified-payroll duties, correction procedures, and withholding language on covered federal construction work.
          </p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Article Body */}
        <div className="lg:col-span-2 space-y-6 text-sm text-slate-700 leading-relaxed font-medium">
          <p>
            When Davis-Bacon Related Acts requirements apply to a federal construction contract, the wage determination and labor clauses establish prevailing-wage, fringe, classification, and payroll obligations for covered workers. Confirm coverage and the actual wage determination before pricing the work.
          </p>
          <p>
            Covered contractors and subcontractors generally must submit weekly payroll information and a statement of compliance. DOL's WH-347 is an optional form for that purpose, not the only permissible format. Classification or payroll errors can require correction and back wages, so the process should be set before mobilization.
          </p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#FF5F1F]" /> The Danger of the "General Laborer" Shortcut
          </h3>
          <p>
            The most common error that penalizes commercial subcontractors is worker misclassification. When estimators or field clerks fill out logs, it is incredibly tempting to classify field hands who don’t hold specific cards as a generic "Laborer" to fit a lower wage tier.
          </p>
          <p>
            However, DOL inspectors do not care what a worker's internal title is. They care strictly about the **tools in their hands**. 
          </p>
          <p>
            Classification depends on the work actually performed, the applicable wage determination, and any recognized apprenticeship or classification rules. Do not assume an internal job title controls the required wage rate; verify mixed duties and apprenticeship status before payroll is submitted.
          </p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#FF5F1F]" /> The GC Cash-Flow Freeze
          </h3>
          <p>
            Because federal prime contract clauses hold the General Contractor jointly liable for any labor compliance deficiencies on the job site, GCs monitor subcontractor submittals with extreme paranoia.
          </p>
          <p>
            Payroll deficiencies can lead to correction requests, investigations, and withholding under applicable labor clauses. Whether a prime may withhold a particular subcontract payment also depends on the subcontract and the circumstances, so review the withholding and cure language before award.
          </p>
          <p>
            A minor administrative error handled by an office clerk can quickly turn into a multi-week cash flow crisis that leaves you struggling to cover field payroll.
          </p>

          <div className="bg-slate-100 border-l-4 border-[#1A3668] p-4 rounded-r-xl space-y-2">
            <h4 className="text-xs font-black text-[#1A3668] uppercase tracking-wider">The Hidden Flow-Down Threat</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              GC master contracts frequently dictate that any administrative expenses, legal compacting hours, or Department of Labor fines incurred due to a subcontractor's paperwork error will be directly back-charged to the sub. You aren't just protecting yourself from Uncle Sam; you are protecting your project ledger from the GC's legal team.
            </p>
          </div>

          {/* Strategic Internal SEO Cross-Link */}
          <div className="bg-slate-50 border-l-4 border-[#FF5F1F] p-4 my-6 rounded-r-xl">
            <p className="text-[10px] font-black text-[#1A3668] uppercase tracking-widest">
              Related Field Intelligence
            </p>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
              Administrative logging delays shouldn't give the general contractor a legal excuse to hold up your progress draws. Read our deep-dive analysis on 
              <a href="/blog/government-contracting-payment-traps" className="text-[#FF5F1F] font-black hover:underline inline-flex items-center gap-0.5 ml-1 uppercase tracking-wide text-[11px]">
                Pay-When-Paid and Pay-If-Paid: What Federal Subcontractors Should Review →
              </a>
            </p>
          </div>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#FF5F1F]" /> Implementing Pre-Award Defense
          </h3>
          <p>
            To stop certified payroll traps from destroying your field morale and project performance, you must proactively manage the contract language before setting foot on the job site:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-[#1A3668]">Verify Wage Determinations Early:</strong> Ensure the exact, current federal wage decision document is attached to your contract files on day one, not a placeholder reference.</li>
            <li><strong className="text-[#1A3668]">Negotiate Reasonable Cure Windows:</strong> Strike out any boilerplate language that allows the GC to quickly withhold payments for minor clerical errors. Insist on a mandatory 5-to-10 day written notice and cure window for payroll discrepancies.</li>
            <li><strong className="text-[#1A3668]">Audit the Flow-Down Framework:</strong> Run every incoming public procurement contract through an analytical check to make sure you aren't signing away your rights to equitable adjustment over audit-induced delays.</li>
          </ul>
        </div>

        {/* Dynamic Sidebar CTA */}
        <div className="space-y-6">
          <div className="bg-white border-2 border-[#FF5F1F] rounded-xl p-6 shadow-md space-y-4 sticky top-6">
            <div className="p-2 bg-[#FF5F1F]/10 rounded-lg text-[#FF5F1F] inline-block">
              <Construction className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-[#1A3668] uppercase tracking-wide">
              Review Before You Commit
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Use the article as a checklist for terms, documents, and questions to resolve before bidding, signing, or committing resources.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              <strong className="text-[#1A3668]">SubPreCheck</strong> can surface the relevant language, organize evidence-grounded issues, and prepare a focused package for discussion with the prime and qualified counsel.
            </p>
            <hr className="border-slate-100" />
            <a 
              href="/pricing"
              className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-white bg-[#FF5F1F] hover:bg-[#E04F1A] rounded-lg transition shadow-sm"
            >
              See Review Plans
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
