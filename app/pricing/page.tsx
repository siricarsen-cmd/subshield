"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Check, ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import FinalCTA from "../../components/FinalCTA";
import { createClient } from "@/utils/supabase/client"; // Ensure this import matches your project path

export default function PricingPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const supabase = createClient();

  const toggleFaq = (idx: number) => {
    setExpandedFaq(expandedFaq === idx ? null : idx);
  };

  const handleCheckout = async (priceId: string) => {
    // 1. Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // 2. Redirect to login if not authenticated
    if (!user) {
      window.location.href = `/login?redirect=checkout/${priceId}`;
      return;
    }

    // 3. Trigger Stripe Checkout
    const response = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId, userId: user.id }),
    });

    const { sessionId, error } = await response.json();
    
    if (error) {
      alert("Payment initiation failed: " + error);
      return;
    }

    // 4. Redirect to Stripe
    window.location.href = `https://checkout.stripe.com/pay/${sessionId}`;
  };

  const faqData = [
    {
      q: "Does this replace my attorney?",
      a: "No. SubShield is a specialized GovCon compliance utility and a billable hour compactor. We isolate mandatory federal flow-downs, flag hidden liabilities, and map out compliant redline alternatives beforehand. This allows your attorney to focus exclusively on high-level negotiation and final sign-off rather than billing you hundreds of dollars an hour to read raw federal boilerplate from scratch."
    },
    {
      q: "How do the credits and packages work?",
      a: "A single project scan credit covers one complete text or document ingestion analysis cycle. The Monthly Subscription provides 3 processing credits per month, while the Enterprise Plan provides 30 processing credits per year. Unused credits never expire and roll over continuously, letting your estimators pull reports on project emails, Teaming Agreements, or formal prime subcontracts whenever a new opportunity arises."
    },
    {
      q: "What types of documents do you analyze?",
      a: "We focus exclusively on the procurement documents government subcontractors and industrial suppliers encounter when working with Tier-1 Prime Contractors on state and federal contracts. This includes Pre-Award Teaming Agreements, Letters of Intent (LOIs), project proposal emails, and formal Post-Award Prime Subcontract Agreements loaded with complex FAR and DFARS boilerplate flow-downs."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-900 antialiased font-sans">
      {/* Breadcrumb... (Keep your existing breadcrumb) */}
      
      {/* Header... (Keep your existing header) */}

      <section className="py-20 px-6 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          
          {/* TIER 1: SINGLE PROJECT SCAN */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col justify-between">
            <div className="space-y-6">
              <h3 className="text-lg font-black text-[#1A3668] uppercase">Single Project Scan</h3>
              <div className="border-t border-b border-slate-100 py-4"><span className="text-3xl font-black text-[#1A3668]">$149.99</span></div>
              {/* List... (Keep your existing list) */}
            </div>
            <div className="pt-8">
              <button 
                onClick={() => handleCheckout('price_1Tlf0mHCtlCRL0oUEc38O1DB')}
                className="w-full bg-[#1A3668] text-white hover:bg-[#FF5F1F] py-3.5 rounded-xl font-black text-xs uppercase transition-all"
              >
                SELECT SINGLE CYCLE
              </button>
            </div>
          </div>

          {/* TIER 2: MONTHLY SUBSCRIPTION */}
          <div className="bg-white rounded-2xl border-2 border-[#1A3668] p-8 shadow-md flex flex-col justify-between relative transform lg:-translate-y-2">
            <div className="space-y-6">
              <h3 className="text-lg font-black text-[#1A3668] uppercase">Monthly Subscription</h3>
              <div className="border-t border-b border-slate-100 py-4"><span className="text-3xl font-black text-[#1A3668]">$249.00</span></div>
            </div>
            <div className="pt-8">
              <button 
                onClick={() => handleCheckout('price_1Tlf1HHCtlCRL0oUGy7eUqd6')}
                className="w-full bg-[#1A3668] text-white py-3.5 rounded-xl font-black text-xs uppercase"
              >
                START SUBSCRIPTION
              </button>
            </div>
          </div>

          {/* TIER 3: ENTERPRISE PLAN */}
          <div className="bg-white rounded-2xl border-2 border-[#FF5F1F] p-8 shadow-sm flex flex-col justify-between">
            <div className="space-y-6">
              <h3 className="text-lg font-black text-[#1A3668] uppercase">Enterprise Plan</h3>
              <div className="border-t border-b border-slate-100 py-4"><span className="text-3xl font-black text-[#1A3668]">$1,999.00</span></div>
            </div>
            <div className="pt-8">
              <button 
                onClick={() => handleCheckout('price_1Tlf20HCtlCRL0oUGtni2RlJ')}
                className="w-full bg-[#FF5F1F] text-white py-3.5 rounded-xl font-black text-xs uppercase"
              >
                BUY ENTERPRISE PLAN
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ and Footer... (Keep your existing sections) */}
    </div>
  );
}