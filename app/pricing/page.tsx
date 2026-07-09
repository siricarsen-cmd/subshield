"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Lock, ShieldCheck } from "lucide-react";
import {
  STRIPE_PRICE_SINGLE_REVIEW_CYCLE,
  STRIPE_PRICE_ACTIVE_BIDDER_PLAN,
  STRIPE_PRICE_ENTERPRISE_PLAN,
} from "@/lib/stripe-plans";

export default function PricingPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setExpandedFaq(expandedFaq === idx ? null : idx);
  };

  const handleCheckout = async (priceId: string) => {
    try {
      // 1. Tell us the button actually registered the click
      console.log("Attempting checkout for:", priceId);

      // 2. Send the request to your backend
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });

      // 3. Check if the server crashed before trying to read the data
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }

      // 4. Read the Stripe link from the server
      const data = await response.json();
      
      if (data.error) {
        alert("Stripe rejected the request: " + data.error);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No Stripe URL was returned.");
      }

    } catch (error: unknown) {
      // 5. If ANYTHING fails, trigger a massive pop-up alert
      const message = error instanceof Error ? error.message : "Unknown error.";
      alert("THE BUTTON CRASHED: " + message);
      console.error(error);
    }
  };

  const faqData = [
    {
      q: "Does this replace my attorney?",
      a: "No. SubShield is a specialized GovCon document organization and compliance utility. We isolate mandatory federal flow-downs, flag missing documents, and organize contract risks beforehand. This allows your attorney to focus efficiently on high-level strategy and final sign-off rather than spending hours manually reviewing standard federal boilerplate."
    },
    {
      q: "How do the credits and packages work?",
      a: "A Single Review Cycle credit covers one complete document ingestion and analysis cycle. The Active Bidder Plan provides 3 processing credits per month, while the Enterprise Plan provides 30 processing credits per year. Unused credits never expire and roll over continuously, letting your team pull a report on project emails, Teaming Agreements, or formal prime subcontracts whenever a new opportunity arises."
    },
    {
      q: "What types of documents do you analyze?",
      a: "We focus exclusively on the procurement documents government subcontractors across all service sectors encounter when working with Tier-1 Prime Contractors. This includes Pre-Award Teaming Agreements, Letters of Intent (LOIs), project proposal emails, Statements of Work (SOWs), and formal Post-Award Prime Subcontract Agreements."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-900 antialiased font-sans">
      
      {/* HEADER SECTION */}
      <section className="pt-24 pb-12 px-6 max-w-4xl mx-auto text-center space-y-6">
        <span className="text-[10px] font-black text-[#FF5F1F] uppercase tracking-widest bg-orange-50 border border-orange-200/50 px-3 py-1 rounded-full inline-block">
          Select Your Plan
        </span>
        <h1 className="text-4xl md:text-5xl font-black text-[#1A3668] tracking-tight uppercase">
          Simple, Transparent Pricing
        </h1>
        <p className="text-lg text-[#596A7D] font-medium leading-relaxed max-w-3xl mx-auto">
          Protect your profit boundaries with direct, predictable transaction pricing. No surprise fees, no complex usage metrics. Organize contract risks upfront to streamline your formal legal review.
        </p>
      </section>

      {/* PRICING CARDS */}
      <section className="pb-20 px-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          
          {/* TIER 1: SINGLE SCAN */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col justify-between hover:border-slate-300 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-black text-[#1A3668] uppercase">Single Review Cycle</h3>
                <p className="text-sm text-slate-500 mt-2 font-medium">Perfect for spot-checking compliance health.</p>
              </div>
              <div className="border-t border-b border-slate-100 py-6">
                <span className="text-4xl font-black text-[#1A3668]">$149.99</span>
                <span className="text-sm text-slate-500 font-bold ml-2 uppercase">/ Scan</span>
              </div>
              <ul className="space-y-4 pt-2">
                {[
                  '1 Full Package Review Credit',
                  'Plain-English Risk Summary',
                  'Missing Document Checklist',
                  'Prime Questions & Requested-Change Memo',
                  'Attorney-Prep Summary',
                  'Evidence-Backed Findings With Exact Clause Quotes'
                ].map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <Check className="h-5 w-5 text-[#FF5F1F] mr-3 shrink-0" strokeWidth={3} />
                    <span className="text-xs font-bold text-[#1A3668] uppercase tracking-wide">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-8 mt-auto">
              <button 
                onClick={() => handleCheckout(STRIPE_PRICE_SINGLE_REVIEW_CYCLE ?? "")}
                className="w-full bg-slate-100 text-[#1A3668] hover:bg-slate-200 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-sm"
              >
                Buy Single Scan
              </button>
            </div>
          </div>

          {/* TIER 2: MONTHLY SUBSCRIPTION */}
          <div className="bg-white rounded-2xl border-2 border-[#1A3668] p-8 shadow-md flex flex-col justify-between relative transform lg:-translate-y-4 hover:lg:-translate-y-5 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#1A3668] text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
              Best Value
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-black text-[#1A3668] uppercase">Active Bidder Plan</h3>
                <p className="text-sm text-slate-500 mt-2 font-medium">Built for active estimating teams managing steady backlogs.</p>
              </div>
              <div className="border-t border-b border-slate-100 py-6">
                <span className="text-4xl font-black text-[#1A3668]">$249.00</span>
                <span className="text-sm text-slate-500 font-bold ml-2 uppercase">/ Month</span>
              </div>
              <ul className="space-y-4 pt-2">
                {[
                  '3 Full Processing Credits Per Month', 
                  'Pre-Award & Post-Award Capabilities', 
                  'Full Rollover For Unused Credits', 
                  'Plain-English Operational Risk Summary'
                ].map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <Check className="h-5 w-5 text-[#FF5F1F] mr-3 shrink-0" strokeWidth={3} />
                    <span className="text-xs font-bold text-[#1A3668] uppercase tracking-wide">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-8 mt-auto">
              <button 
                onClick={() => handleCheckout(STRIPE_PRICE_ACTIVE_BIDDER_PLAN ?? "")}
                className="w-full bg-[#FF5F1F] text-white hover:bg-orange-600 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-sm"
              >
                Start Subscription
              </button>
            </div>
          </div>

          {/* TIER 3: ENTERPRISE PLAN */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col justify-between hover:border-slate-300 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-black text-[#1A3668] uppercase">Enterprise Plan</h3>
                <p className="text-sm text-slate-500 mt-2 font-medium">For high-volume subcontractors, GovCon advisors, proposal teams, and internal contract-review teams.</p>
              </div>
              <div className="border-t border-b border-slate-100 py-6">
                <span className="text-4xl font-black text-[#1A3668]">$1,999.00</span>
                <span className="text-sm text-slate-500 font-bold ml-2 uppercase">/ Annually</span>
              </div>
              <ul className="space-y-4 pt-2">
                {[
                  '30 Full Processing Credits',
                  'Multi-User Access For Teams',
                  'Full Rollover Capability',
                  'Prime Questions & Requested-Change Language'
                ].map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <Check className="h-5 w-5 text-[#FF5F1F] mr-3 shrink-0" strokeWidth={3} />
                    <span className="text-xs font-bold text-[#1A3668] uppercase tracking-wide">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-8 mt-auto">
              <button 
                onClick={() => handleCheckout(STRIPE_PRICE_ENTERPRISE_PLAN ?? "")}
                className="w-full bg-[#1A3668] text-white hover:bg-[#152A50] py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-sm"
              >
                Get Enterprise Access
              </button>
            </div>
          </div>

        </div>

        {/* TRUST BADGES ROW */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-12 text-slate-400">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
            <Lock size={16} className="text-[#1A3668]" /> 256-Bit SSL Encryption
          </div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
            <ShieldCheck size={16} className="text-[#1A3668]" /> Payments Processed by Stripe
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-20 px-6 max-w-4xl mx-auto border-t border-slate-200">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-black text-[#1A3668] uppercase mb-4 tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>
        <div className="space-y-4">
          {faqData.map((faq, index) => (
            <div key={index} className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
              <button 
                onClick={() => toggleFaq(index)} 
                className="w-full flex justify-between items-center p-6 text-left focus:outline-none hover:bg-slate-50 transition-colors"
              >
                <span className="font-black text-[#1A3668] text-sm uppercase tracking-wide">{faq.q}</span>
                {expandedFaq === index ? <ChevronUp className="h-5 w-5 text-[#FF5F1F]" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
              </button>
              {expandedFaq === index && (
                <div className="px-6 pb-6 text-[#596A7D] text-sm font-medium leading-relaxed border-t border-slate-100 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
      
    </div>
  );
}