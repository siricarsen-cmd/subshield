"use client";

import React from "react";
import { ShieldAlert, FileText, CheckCircle, ArrowLeft, UserCheck } from "lucide-react";

export default function UnauthorizedChangeOrdersArticle() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased pb-20">
      
      {/* Article Header Banner */}
      <div className="bg-[#1A3668] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a href="/blog" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF5F1F] hover:text-white transition">
              <ArrowLeft className="w-4 h-4" /> Back to Knowledge Hub
            </a>
            <span className="self-start rounded-full border border-orange-300/60 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#FF5F1F]">
              FAR Authority & Liability
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight">
            Dealing with Unauthorized Change Orders: PM Directions vs. Contracting Officer Authority
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl font-medium">
            Review who has authority to direct changes, what written notice is required, and how extra work must be documented before field instructions become disputed cost.
          </p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Article Body */}
        <div className="lg:col-span-2 space-y-6 text-sm text-slate-700 leading-relaxed font-medium">
          <p>
            The field environment on a commercial or federal project moves fast. Deadlines are tight, material delivery windows are narrow, and unexpected structural conflicts occur daily. When a crisis hits the field, a General Contractor's Project Manager or a government agency’s technical representative will walk up to your foreman and give a direct order: <strong className="text-[#1A3668]">"We need to alter this routing pattern immediately. Do it now to keep the schedule on track, and we will catch up on the paperwork during the next billing cycle."</strong>
          </p>
          <p>
            Your crew acts in good faith. You reroute materials, authorize overtime, and deploy equipment to handle the emergency. 
          </p>
          <p>
            But weeks later, your formal change order request gets completely rejected. The project owner states that the field modification was completely unauthorized, and they owe you exactly $0. You have just fallen victim to the **Unauthorized Change Order Trap**.
          </p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#FF5F1F]" /> The Law of Implied vs. Actual Authority
          </h3>
          <p>
            Public contracting places substantial weight on **actual authority** and on following the written change procedure. Good-faith field direction does not automatically create authority to change price, scope, or schedule.
          </p>
          <p>
            Under federal acquisition rules, only contracting officers may enter into or modify Government contracts within the limits of their delegated authority. CORs and technical personnel may have delegated administrative duties, but their appointment normally does not authorize them to change contract price, scope, delivery, or other terms unless specific authority exists.
          </p>
          <p>
            For a subcontractor, the immediate question is also contractual privity: who at the prime may direct your work and what procedure preserves a request for additional time or money. A Government field instruction does not by itself guarantee a direct payment right for a subcontractor.
          </p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#FF5F1F]" /> The "Constructive Change" Catch-22
          </h3>
          <p>
            General contractors capitalize on this framework by inserting aggressive boilerplate text into subcontracts that forces you to choose between two catastrophic options:
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-xs text-slate-600 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
            <li>
              If you refuse to perform the extra work until a formal, written modification is signed by the CO, the GC will threaten to declare you in default for **disrupting the project schedule**.
            </li>
            <li>
              If you perform the work to keep the peace, you assume the entire financial risk of the modification being rejected during the final closeout audit.
            </li>
          </ol>
          <p>
            To survive this system, you must understand how to safely convert an unauthorized verbal order into a legally recognized **Constructive Change** before your crews deploy their tools.
          </p>

          <div className="bg-slate-100 border-l-4 border-[#1A3668] p-4 rounded-r-xl space-y-2">
            <h4 className="text-xs font-black text-[#1A3668] uppercase tracking-wider">The Ratification Roadblock</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              While a Contracting Officer technically has the power to retroactively validate an unauthorized field order through a process called "ratification," this cycle requires high-level administrative reviews and months of accounting evaluation. Ratification of an unauthorized commitment is a formal Government process with specific conditions. It should not be treated as a routine fallback for a subcontractor that performed work without the required authorization.
            </p>
          </div>

          {/* Strategic Internal SEO Cross-Link */}
          <div className="bg-slate-50 border-l-4 border-[#FF5F1F] p-4 my-6 rounded-r-xl">
            <p className="text-[10px] font-black text-[#1A3668] uppercase tracking-widest">
              Related Field Intelligence
            </p>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
              If extra work has already been performed, document the direction, costs, schedule effect, and notices immediately, then follow the subcontract's change and dispute procedures and any prime-sponsored pass-through process that may apply. Read our full blueprint on
              <a href="/blog/request-for-equitable-adjustment-under-far" className="text-[#FF5F1F] font-black hover:underline inline-flex items-center gap-0.5 ml-1 uppercase tracking-wide text-[11px]">
                Navigating Requests for Equitable Adjustment (REA): Recovering Costs Under FAR Rules →
              </a>
            </p>
          </div>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#FF5F1F]" /> Establishing an Unshakeable Field Routine
          </h3>
          <p>
            Use a disciplined change-management process so field direction, cost, schedule impact, and contractual notice are documented consistently:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-[#1A3668]">Issue an Immediate Written Directive Notice:</strong> When a verbal change is requested, send prompt written notice consistent with the subcontract before proceeding when practicable: *"Pursuant to your field direction on June 2, we are proceeding with the re-routing modification under protest. We estimate the impact to be $12,500 and 3 working days, and expect a formal written modification from the Contracting Officer within 48 hours."*</li>
            <li><strong className="text-[#1A3668]">Segregate All Tracking Codes:</strong> Instruct your field foreman to track every single hour of labor and every line item of material used for that specific modification on a separate, dedicated timecard stamped "Disputed Field Directive." Never blend change-order labor with your base scope logs.</li>
            <li><strong className="text-[#1A3668]">Strike Out "Work First, Settle Later" Boilerplate:</strong> Review any continue-performance or work-first-settle-later clause with counsel so the team understands when it must proceed, when it may pause, and how disputed changes are preserved.</li>
          </ul>
        </div>

        {/* Strategic Call-to-Action Sidebar */}
        <div className="space-y-6">
          <div className="bg-white border-2 border-[#FF5F1F] rounded-xl p-6 shadow-md space-y-4 sticky top-6">
            <div className="p-2 bg-[#FF5F1F]/10 rounded-lg text-[#FF5F1F] inline-block">
              <UserCheck className="w-6 h-6" />
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
