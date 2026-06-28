"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

export default function PricingPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setExpandedFaq(expandedFaq === idx ? null : idx);
  };

  const handleCheckout = async (priceId: string) => {
    // Removed user session check to allow guest checkout
    // UPDATED: Now pointing to the correct /api/create-checkout route
    const response = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId }),
    });

    const data = await response.json();
    
    if (data.error) {
      alert("Payment initiation failed: " + data.error);
      return;
    }

    if (data.url) {
      window.location.href = data.url;
    }
  };

  const faqData = [
    {
      q: "DOES THIS REPLACE MY ATTORNEY?",
      a: "No. SubShield is a specialized GovCon compliance utility and a billable hour compactor. We isolate mandatory federal flow-downs, flag hidden liabilities, and map out compliant redline alternatives beforehand. This allows your attorney to focus exclusively on high-level negotiation and final sign-off rather than billing you hundreds of dollars an hour to read raw federal boilerplate from scratch."
    },
    {
      q: "HOW DO THE CREDITS AND PACKAGES WORK?",
      a: "A single project scan credit covers one complete text or document ingestion analysis cycle. The Monthly Subscription provides 3 processing credits per month, while the Enterprise Plan provides 30 processing credits per year. Unused credits never expire and roll over continuously, letting your estimators pull a report on project emails, Teaming Agreements, or formal prime subcontracts whenever a new opportunity arises."
    },
    {
      q: "WHAT TYPES OF DOCUMENTS DO YOU ANALYZE?",
      a: "We focus exclusively on the procurement documents government subcontractors across all service sectors encounter when working with Tier-1 Prime Contractors on state and federal contracts. This includes Pre-Award Teaming Agreements, Letters of Intent (LOIs), project proposal emails, and formal Post-Award Prime Subcontract Agreements loaded with complex FAR and DFARS boilerplate flow-downs."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-900 antialiased font-sans">
      
      <section className="pt-24 pb-12 px-6 max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-black text-[#1A3668] tracking-tight uppercase mb-6">
          SIMPLE, TRANSPARENT PRICING
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Protect your profit boundaries with direct, predictable transaction pricing. No surprise fees, no complex usage metrics. Organize contract risks before formal review to compact your billable legal hours.
        </p>
      </section>

      <section className="pb-20 px-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-black text-[#1A3668] uppercase">SINGLE PROJECT SCAN</h3>
                <p className="text-sm text-slate-500 mt-2 font-medium">Perfect for spot-checking compliance health.</p>
              </div>
              <div className="border-t border-b border-slate-100 py-6">
                <span className="text-4xl font-black text-[#1A3668]">$149.99</span>
                <span className="text-sm text-slate-500 font-bold ml-2">/ PROJECT SCAN</span>
              </div>
              <ul className="space-y-4 pt-2">
                {['1 FULL PROCESSING CREDIT', 'PLAIN-ENGLISH OPERATIONAL RISK SUMMARY', 'PRE-DRAFTED TARGET REDLINES', 'PM TALK-TRACK EMAIL MEMO'].map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <Check className="h-5 w-5 text-[#FF5F1F] mr-3 shrink-0" strokeWidth={3} />
                    <span className="text-xs font-bold text-slate-700 tracking-wide">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-8">
              <button 
                onClick={() => handleCheckout('price_1Tlf0mHCtlCRL0oUEc38O1DB')}
                className="w-full bg-[#1A3668] text-white hover:bg-[#152A50] py-4 rounded-lg font-black text-xs uppercase tracking-wider transition-colors"
              >
                SELECT SINGLE CYCLE
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border-2 border-[#1A3668] p-8 shadow-md flex flex-col justify-between relative transform lg:-translate-y-4">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#1A3668] text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              Most Popular
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-black text-[#1A3668] uppercase">MONTHLY SUBSCRIPTION</h3>
                <p className="text-sm text-slate-500 mt-2 font-medium">Built for active estimating teams managing steady backlogs.</p>
              </div>
              <div className="border-t border-b border-slate-100 py-6">
                <span className="text-4xl font-black text-[#1A3668]">$249.00</span>
                <span className="text-sm text-slate-500 font-bold ml-2">/ MONTH</span>
              </div>
              <ul className="space-y-4 pt-2">
                {['3 FULL PROCESSING CREDITS PER MONTH', 'STANDARD PRE-AWARD & POST-AWARD TRIAGE', 'FULL ROLLOVER CAPABILITY FOR UNUSED CREDITS', 'PLAIN-ENGLISH OPERATIONAL RISK SUMMARY'].map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <Check className="h-5 w-5 text-[#FF5F1F] mr-3 shrink-0" strokeWidth={3} />
                    <span className="text-xs font-bold text-slate-700 tracking-wide">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-8">
              <button 
                onClick={() => handleCheckout('price_1Tlf1HHCtlCRL0oUGy7eUqd6')}
                className="w-full bg-[#1A3668] text-white hover:bg-[#152A50] py-4 rounded-lg font-black text-xs uppercase tracking-wider transition-colors"
              >
                START SUBSCRIPTION
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-black text-[#1A3668] uppercase">ENTERPRISE PLAN</h3>
                <p className="text-sm text-slate-500 mt-2 font-medium">For high-volume prime contractors and large teams.</p>
              </div>
              <div className="border-t border-b border-slate-100 py-6">
                <span className="text-4xl font-black text-[#1A3668]">$1,999.00</span>
                <span className="text-sm text-slate-500 font-bold ml-2">/ ANNUALLY</span>
              </div>
              <ul className="space-y-4 pt-2">
                {['30 FULL PROCESSING CREDITS', 'MULTI-USER ACCESS FOR ESTIMATING TEAMS', 'FULL ROLLOVER CAPABILITY FOR NEW QUARTERS', 'PRE-DRAFTED TARGET REDLINES & MEMOS'].map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <Check className="h-5 w-5 text-[#FF5F1F] mr-3 shrink-0" strokeWidth={3} />
                    <span className="text-xs font-bold text-slate-700 tracking-wide">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-8">
              <button 
                onClick={() => handleCheckout('price_1Tlf20HCtlCRL0oUGtni2RlJ')}
                className="w-full bg-[#FF5F1F] text-white hover:bg-[#E55319] py-4 rounded-lg font-black text-xs uppercase tracking-wider transition-colors"
              >
                BUY ENTERPRISE PLAN
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 max-w-4xl mx-auto border-t border-slate-200">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-black text-[#1A3668] uppercase mb-4">FREQUENTLY HANDLED COMPLIANCE INQUIRIES</h2>
        </div>
        <div className="space-y-4">
          {faqData.map((faq, index) => (
            <div key={index} className="border border-slate-200 rounded-lg bg-white overflow-hidden">
              <button onClick={() => toggleFaq(index)} className="w-full flex justify-between items-center p-6 text-left focus:outline-none">
                <span className="font-bold text-[#1A3668] text-sm tracking-wide">{faq.q}</span>
                {expandedFaq === index ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
              </button>
              {expandedFaq === index && (
                <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-4">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}