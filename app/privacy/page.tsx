"use client";

import React from "react";
import Link from "next/link";
import { 
  Lock, 
  UserCheck, 
  Eye, 
  ShieldCheck, 
  Globe, 
  Database, 
  CreditCard 
} from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-900 pb-16">
      
      {/* Page Header Segment */}
      <div className="bg-[#0A192F] text-white py-14 px-6 border-b border-slate-800 text-center">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-[#FF6B00] mb-2">
            <Lock className="w-6 h-6 stroke-[2]" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Corporate Profile & System Interaction Data Policies
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-8">
        
        {/* Core Introductory Context Block */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            While our Document Terms page specifically governs how raw contract text files are analyzed, this Privacy Policy details how SubShield handles your corporate profile credentials, payment processing pathways, and basic website interaction data. We treat your operational business data with the highest standard of corporate confidentiality.
          </p>
        </div>

        {/* Section: Information We Collect */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm space-y-6">
          <h3 className="text-xs font-black text-[#0A192F] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <UserCheck className="w-4 h-4 text-[#FF6B00]" />
            Information Collected and Processed
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed font-medium text-slate-600">
            <div className="space-y-1.5">
              <h4 className="font-black text-slate-800 uppercase tracking-tight">Firm Registration Data</h4>
              <p>When establishing your profile workspace, we collect your corporate email address, registered company name, and your primary trade or scope specialty (such as Electrical, HVAC, Plumbing, Structural Metals, Finishes, or Material Distribution). This data is used solely to configure your local account architecture.</p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-black text-slate-800 uppercase tracking-tight">System Operational Tracking</h4>
              <p>We log high-level metadata regarding your active evaluations, such as file sizes, date checked timestamps, tracking IDs, and the number of flagged risk criteria found[cite: 1]. This keeps your workflow dashboard logs accurate and helps track your available review credits[cite: 1].</p>
            </div>
          </div>
        </div>

        {/* Section: Data Protection Guardrails */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm space-y-6">
          <h3 className="text-xs font-black text-[#0A192F] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Data Protection Rules & Third-Party Gateways
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed font-medium text-slate-600">
            <div className="space-y-1.5">
              <h4 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                Financial Data Isolation
              </h4>
              <p>All single contract review purchases ($149.99 per-cycle) or ongoing corporate subscriptions ($199.00 monthly) are executed exclusively through Stripe[cite: 1]. SubShield does not direct, witness, or store full credit card numbers or billing authentication details on our servers.</p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                Zero Commercial Data Selling
              </h4>
              <p>SubShield does not trade, rent, sell, or commercially distribute corporate profile emails, trade parameters, or operational audit history metrics to outside market entities or public lead generators.</p>
            </div>

            <div className="space-y-1.5 border-t border-slate-100 pt-4 md:pt-0 md:border-t-0">
              <h4 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                Basic Web Logs & Analytical Cookies
              </h4>
              <p>We log basic network connection details, browser types, and localized page navigation metrics. This is standard infrastructure tracking used purely to ensure that dashboard assets and public text frameworks scale appropriately across mobile devices and field tablet screens.</p>
            </div>

            <div className="space-y-1.5 border-t border-slate-100 pt-4 md:pt-0 md:border-t-0">
              <h4 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                Infrastructure Security Measures
              </h4>
              <p>Your profile access credentials and system operation trackers are protected using standard web token authentication guards and database security boundaries designed to block unauthorized cross-account visibility.</p>
            </div>
          </div>
        </div>

        {/* Mandatory Legal Disclaimer Reference Link */}
        <div className="bg-slate-900 text-slate-400 p-5 rounded-xl shadow-sm space-y-2">
          <span className="text-[10px] font-black tracking-widest text-[#FF6B00] uppercase block">
            Regulatory Compliance Reminder
          </span>
          <p className="text-xs leading-relaxed text-slate-400 font-medium text-justify">
            SubShield functions as an interactive educational evaluation toolkit and an architectural billable hour compactor—it is not a law firm and does not supply formal legal representation or legal opinions. All account data processing is tailored around pre-lawyer document preparation protocols[cite: 1].
          </p>
        </div>

        {/* Bottom Closing CTA Block */}
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4 shadow-sm">
          <div className="space-y-1">
            <h3 className="text-base font-black text-[#0A192F] uppercase tracking-tight">
              Protect Your Trade Margins
            </h3>
            <p className="text-xs text-slate-500 font-medium max-w-xl mx-auto leading-relaxed">
              Ready to isolate predatory boilerplate lines, flow-down liabilities, and contingent payment traps before signing your next project agreement?[cite: 1]
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/dashboard" 
              className="w-full sm:w-auto bg-[#FF6B00] text-white text-xs font-black uppercase tracking-wider px-8 py-3.5 rounded-xl hover:bg-[#0A192F] transition-all shadow-sm text-center"
            >
              Start Free Triage
            </Link>
            <Link 
              href="/terms" 
              className="w-full sm:w-auto border border-slate-200 bg-white text-slate-700 text-xs font-black uppercase tracking-wider px-8 py-3.5 rounded-xl hover:border-[#0A192F] transition-all text-center"
            >
              View Document Terms
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}