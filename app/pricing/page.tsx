"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Lock, ShieldCheck } from "lucide-react";
import {
  STRIPE_PRICE_SINGLE_REVIEW_CYCLE,
  STRIPE_PRICE_ACTIVE_BIDDER_PLAN,
  STRIPE_PRICE_ENTERPRISE_PLAN,
} from "@/lib/stripe-plans";

type CheckoutPlan = "single" | "activeBidder" | "enterprise";

const CHECKOUT_ERROR_MESSAGE =
  "Checkout could not be started. Please try again later.";

export default function PricingPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<CheckoutPlan | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const toggleFaq = (idx: number) => {
    setExpandedFaq(expandedFaq === idx ? null : idx);
  };

  const handleCheckout = async (
    priceId: string | undefined,
    plan: CheckoutPlan,
  ) => {
    if (checkoutPlan) return;

    setCheckoutError(null);
    setCheckoutPlan(plan);

    try {
      if (!priceId) throw new Error("Checkout configuration is unavailable.");

      const response = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      if (!response.ok) throw new Error("Checkout request failed.");

      const data = (await response.json()) as { url?: unknown };
      if (typeof data.url !== "string" || !data.url) {
        throw new Error("Checkout URL was unavailable.");
      }

      window.location.assign(data.url);
    } catch (error: unknown) {
      console.error("Checkout could not be started:", error);
      setCheckoutError(CHECKOUT_ERROR_MESSAGE);
    } finally {
      setCheckoutPlan(null);
    }
  };

  const faqData = [
    {
      q: "Does this replace my attorney?",
      a: "No. SubShield provides AI-assisted, evidence-grounded screening and preparation materials, not legal advice or legal opinions. Use the report to organize questions and consult qualified government-contracts counsel before signing or relying on final contract terms.",
    },
    {
      q: "How do the credits and plans work?",
      a: "One credit covers one submitted document analysis. The Single Review Cycle is a one-time purchase for 1 credit. Active Bidder is a $249 monthly subscription that adds 3 credits for each successfully paid eligible monthly billing cycle, and unused credits remain available in your account. The Enterprise Credit Pack is a $1,999 one-time purchase for 30 credits.",
    },
    {
      q: "What if my document is revised or amended?",
      a: "A revised or amended document requires another available credit and a new analysis. SubShield does not currently offer automated version comparison or track changes between reports.",
    },
    {
      q: "What can I submit for analysis?",
      a: "SubShield accepts PDF, DOCX, TXT, and pasted text. It is intended for government-contracting materials such as teaming agreements, solicitation documents, statements of work, and draft subcontracts.",
    },
  ];

  const checkoutInProgress = checkoutPlan !== null;

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-900 antialiased font-sans">
      <section className="pt-24 pb-12 px-6 max-w-4xl mx-auto text-center space-y-6">
        <span className="text-[10px] font-black text-[#FF5F1F] uppercase tracking-widest bg-orange-50 border border-orange-200/50 px-3 py-1 rounded-full inline-block">
          Select Your Plan
        </span>
        <h1 className="text-4xl md:text-5xl font-black text-[#1A3668] tracking-tight uppercase">
          Simple, Transparent Pricing
        </h1>
        <p className="text-lg text-[#596A7D] font-medium leading-relaxed max-w-3xl mx-auto">
          Choose a one-time credit purchase or a monthly plan based on your review volume. Each credit covers one complete document ingestion and analysis.
        </p>
      </section>

      <section className="pb-20 px-6 max-w-7xl mx-auto w-full" aria-label="Pricing options">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col justify-between hover:border-slate-300 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-[#1A3668] uppercase">Single Review Cycle</h2>
                <p className="text-sm text-slate-500 mt-2 font-medium">A one-time purchase for a single document review.</p>
              </div>
              <div className="border-t border-b border-slate-100 py-6">
                <span className="text-4xl font-black text-[#1A3668]">$149.99</span>
                <span className="text-sm text-slate-500 font-bold ml-2 uppercase">One-Time</span>
              </div>
              <ul className="space-y-4 pt-2">
                {[
                  "1 Review Credit",
                  "One Complete Document Ingestion And Analysis",
                  "Plain-English Risk Summary",
                  "Missing Document Checklist",
                  "Prime Questions And Requested-Change Memo",
                  "Evidence-Grounded Findings With Clause Quotes",
                ].map((feature) => (
                  <li key={feature} className="flex items-start">
                    <Check className="h-5 w-5 text-[#FF5F1F] mr-3 shrink-0" strokeWidth={3} />
                    <span className="text-xs font-bold text-[#1A3668] uppercase tracking-wide">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-8 mt-auto">
              <button
                type="button"
                onClick={() => void handleCheckout(STRIPE_PRICE_SINGLE_REVIEW_CYCLE, "single")}
                disabled={checkoutInProgress}
                aria-busy={checkoutPlan === "single"}
                className="w-full bg-slate-100 text-[#1A3668] hover:bg-slate-200 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {checkoutPlan === "single" ? "Starting Single Review Checkout..." : "Buy Single Review"}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border-2 border-[#1A3668] p-8 shadow-md flex flex-col justify-between relative transform lg:-translate-y-4 hover:lg:-translate-y-5 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#1A3668] text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
              Monthly Plan
            </div>
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-[#1A3668] uppercase">Active Bidder Plan</h2>
                <p className="text-sm text-slate-500 mt-2 font-medium">For customers with an ongoing monthly review workload.</p>
              </div>
              <div className="border-t border-b border-slate-100 py-6">
                <span className="text-4xl font-black text-[#1A3668]">$249</span>
                <span className="text-sm text-slate-500 font-bold ml-2 uppercase">/ Month</span>
              </div>
              <ul className="space-y-4 pt-2">
                {[
                  "3 Review Credits Per Successfully Paid Monthly Billing Cycle",
                  "Unused Credits Remain Available In Your Account",
                  "Monthly Subscription",
                  "Manage Or Cancel Through The Stripe Billing Portal",
                ].map((feature) => (
                  <li key={feature} className="flex items-start">
                    <Check className="h-5 w-5 text-[#FF5F1F] mr-3 shrink-0" strokeWidth={3} />
                    <span className="text-xs font-bold text-[#1A3668] uppercase tracking-wide">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-8 mt-auto">
              <button
                type="button"
                onClick={() => void handleCheckout(STRIPE_PRICE_ACTIVE_BIDDER_PLAN, "activeBidder")}
                disabled={checkoutInProgress}
                aria-busy={checkoutPlan === "activeBidder"}
                className="w-full bg-[#FF5F1F] text-white hover:bg-orange-600 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {checkoutPlan === "activeBidder" ? "Starting Active Bidder Checkout..." : "Start Active Bidder Subscription"}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col justify-between hover:border-slate-300 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-[#1A3668] uppercase">Enterprise Credit Pack</h2>
                <p className="text-sm text-slate-500 mt-2 font-medium">A one-time credit pack for higher-volume users.</p>
              </div>
              <div className="border-t border-b border-slate-100 py-6">
                <span className="text-4xl font-black text-[#1A3668]">$1,999</span>
                <span className="text-sm text-slate-500 font-bold ml-2 uppercase">One-Time</span>
              </div>
              <ul className="space-y-4 pt-2">
                {[
                  "30 Review Credits",
                  "One-Time Purchase",
                  "No Subscription Or Renewal",
                  "Plain-English Risk And Preparation Reports",
                ].map((feature) => (
                  <li key={feature} className="flex items-start">
                    <Check className="h-5 w-5 text-[#FF5F1F] mr-3 shrink-0" strokeWidth={3} />
                    <span className="text-xs font-bold text-[#1A3668] uppercase tracking-wide">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-8 mt-auto">
              <button
                type="button"
                onClick={() => void handleCheckout(STRIPE_PRICE_ENTERPRISE_PLAN, "enterprise")}
                disabled={checkoutInProgress}
                aria-busy={checkoutPlan === "enterprise"}
                className="w-full bg-[#1A3668] text-white hover:bg-[#152A50] py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {checkoutPlan === "enterprise" ? "Starting Enterprise Checkout..." : "Buy Enterprise Credit Pack"}
              </button>
            </div>
          </div>
        </div>

        <p className="sr-only" role="status" aria-live="polite">
          {checkoutPlan ? "Checkout is being prepared." : ""}
        </p>
        {checkoutError && (
          <div
            role="alert"
            aria-live="assertive"
            className="max-w-3xl mx-auto mt-8 rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-center text-sm font-bold text-rose-800"
          >
            {checkoutError}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-12 text-slate-400">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
            <Lock size={16} className="text-[#1A3668]" /> Secure HTTPS Connection
          </div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
            <ShieldCheck size={16} className="text-[#1A3668]" /> Payments Processed by Stripe
          </div>
        </div>
      </section>

      <section className="py-20 px-6 max-w-4xl mx-auto border-t border-slate-200">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-black text-[#1A3668] uppercase mb-4 tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>
        <div className="space-y-4">
          {faqData.map((faq, index) => {
            const buttonId = `faq-button-${index}`;
            const panelId = `faq-panel-${index}`;

            return (
              <div key={faq.q} className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
                <button
                  id={buttonId}
                  type="button"
                  onClick={() => toggleFaq(index)}
                  aria-expanded={expandedFaq === index}
                  aria-controls={panelId}
                  className="w-full flex justify-between items-center p-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FF5F1F] hover:bg-slate-50 transition-colors"
                >
                  <span className="font-black text-[#1A3668] text-sm uppercase tracking-wide">{faq.q}</span>
                  {expandedFaq === index ? <ChevronUp className="h-5 w-5 text-[#FF5F1F]" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                </button>
                {expandedFaq === index && (
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className="px-6 pb-6 text-[#596A7D] text-sm font-medium leading-relaxed border-t border-slate-100 pt-4"
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
