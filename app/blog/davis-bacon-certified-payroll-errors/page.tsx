"use client";

import React from "react";
import { ShieldAlert, FileText, CheckCircle, ArrowLeft, Construction } from "lucide-react";

export default function DavisBaconPayrollArticle() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased pb-20">
      <div className="bg-[#1A3668] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a href="/blog" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF5F1F] hover:text-white transition"><ArrowLeft className="w-4 h-4" /> Back to Knowledge Hub</a>
            <span className="self-start rounded-full border border-orange-300/60 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#FF5F1F]">GovCon Labor Compliance</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight">Davis-Bacon Certified Payroll: Classification and Documentation Risks</h1>
          <p className="text-slate-300 text-sm max-w-2xl font-medium">Review wage determinations, classifications, certified-payroll duties, correction procedures, and withholding language on covered federal construction work.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 text-sm text-slate-700 leading-relaxed font-medium">
          <p>When Davis-Bacon Related Acts requirements apply to a federal construction contract, the wage determination and labor clauses establish prevailing-wage, fringe, classification, and payroll obligations for covered workers. Confirm coverage and the actual wage determination before pricing the work.</p>
          <p>Covered contractors and subcontractors generally must submit weekly payroll information and a statement of compliance. DOL's WH-347 is an optional form for that purpose, not the only permissible format. Classification or payroll errors can require correction and back wages, so the process should be set before mobilization.</p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-[#FF5F1F]" /> Worker Classification Is a Core Risk</h3>
          <p>One recurring problem is assigning workers to a convenient internal title instead of the classification that matches the actual work and the applicable wage determination.</p>
          <p>Classification depends on the work actually performed, the applicable wage determination, and any recognized apprenticeship or classification rules. Do not assume an internal job title controls the required wage rate; verify mixed duties and apprenticeship status before payroll is submitted.</p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2"><FileText className="w-5 h-5 text-[#FF5F1F]" /> Payroll Errors Can Affect Cash Flow</h3>
          <p>Payroll deficiencies can lead to correction requests, investigations, and withholding under applicable labor clauses. Whether a prime may withhold a particular subcontract payment also depends on the subcontract and the circumstances, so review the withholding and cure language before award.</p>
          <p>A correctable administrative error can still become a cash-flow issue if the subcontract gives the prime broad withholding or backcharge rights without a clear notice-and-cure process.</p>

          <div className="bg-slate-100 border-l-4 border-[#1A3668] p-4 rounded-r-xl space-y-2">
            <h4 className="text-xs font-black text-[#1A3668] uppercase tracking-wider">Review the Flowdown, Not Just the Payroll Form</h4>
            <p className="text-xs text-slate-600 leading-relaxed">The labor obligation comes from the governing contract clauses and wage determination, not from a payroll template by itself. Review any prime-drafted backcharge, indemnity, cure, and withholding terms alongside the federal labor requirements.</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
            <h3 className="text-xs font-black text-[#1A3668] uppercase tracking-wide">Explore the Federal Labor Cluster</h3>
            <ul className="space-y-2 text-xs">
              <li><a href="/blog/federal-subcontract-labor-wage-hub" className="text-[#1A3668] font-black hover:text-[#FF5F1F] hover:underline">Federal Subcontract Labor & Wage Determination Hub</a></li>
              <li><a href="/blog/davis-bacon-worker-classification" className="text-[#FF5F1F] font-bold hover:underline">Davis-Bacon Worker Classifications: How Misclassification Creates Payroll Risk</a></li>
              <li><a href="/blog/how-to-read-federal-wage-determination" className="text-[#FF5F1F] font-bold hover:underline">How to Read a Federal Wage Determination Before Pricing</a></li>
              <li><a href="/blog/missing-wage-determination-federal-subcontract" className="text-[#FF5F1F] font-bold hover:underline">Missing Wage Determination in a Federal Subcontract</a></li>
              <li><a href="/blog/davis-bacon-vs-service-contract-labor-standards" className="text-[#FF5F1F] font-bold hover:underline">Davis-Bacon vs. Service Contract Labor Standards</a></li>
              <li><a href="/blog/service-contract-labor-standards-subcontractors" className="text-[#FF5F1F] font-bold hover:underline">Service Contract Labor Standards for Federal Subcontractors</a></li>
            </ul>
          </div>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-[#FF5F1F]" /> Pre-Award Review Steps</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-[#1A3668]">Verify the Wage Determination:</strong> Confirm the exact wage decision and revision that applies to the work before finalizing labor pricing.</li>
            <li><strong className="text-[#1A3668]">Map Worker Classifications:</strong> Match planned duties to the classifications and fringe obligations in the wage determination.</li>
            <li><strong className="text-[#1A3668]">Review Cure and Withholding Language:</strong> Understand what happens if payroll needs correction and how long you have to cure an issue.</li>
            <li><strong className="text-[#1A3668]">Check the Flowdown Package:</strong> Make sure the labor clauses, wage determination, and related attachments are actually included or available.</li>
          </ul>
        </div>

        <div className="space-y-6">
          <div className="bg-white border-2 border-[#FF5F1F] rounded-xl p-6 shadow-md space-y-4 sticky top-6">
            <div className="p-2 bg-[#FF5F1F]/10 rounded-lg text-[#FF5F1F] inline-block"><Construction className="w-6 h-6" /></div>
            <h4 className="text-sm font-black text-[#1A3668] uppercase tracking-wide">Review Before You Commit</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium"><strong className="text-[#1A3668]">SubPreCheck</strong> can surface wage-determination references, labor flowdowns, classification issues, and missing attachments before you price or sign.</p>
            <a href="/sample-report" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-white bg-[#FF5F1F] hover:bg-[#E04F1A] rounded-lg transition shadow-sm">View Sample Report</a>
            <a href="/pricing" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-[#1A3668] border border-slate-200 hover:border-[#FF5F1F] rounded-lg transition">See Review Plans</a>
          </div>
        </div>
      </div>
    </div>
  );
}
