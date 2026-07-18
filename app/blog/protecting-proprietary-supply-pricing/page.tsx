"use client";

import React from "react";
import { ShieldAlert, FileText, CheckCircle, ArrowLeft, EyeOff } from "lucide-react";

export default function ProprietaryPricingArticle() {
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
              Supply Chain & IP Defense
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight">
            Protecting Proprietary Supply Pricing: NDA Pitfalls for Commercial Trade Distributors
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl font-medium">
            How standard non-disclosure agreements leave your custom bills of materials and specialized vendor quote channels completely exposed to pre-award bid shopping.
          </p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Article Body */}
        <div className="lg:col-span-2 space-y-6 text-sm text-slate-700 leading-relaxed font-medium">
          <p>
            In the commercial procurement and specialty supply sectors, your true competitive edge isn’t just your ability to read a blueprint—it is your **direct vendor and manufacturer relationships**. The thousands of unbillable hours you spend negotiating custom lot pricing, lock-in volume rebates, and factory allocation queues are what allow you to submit a winning bid.
          </p>
          <p>
            But on bid day, many trade distributors step directly into a structural trap. They assume the standard, boilerplated Non-Disclosure Agreement (NDA) they signed during the estimating phase keeps their data secure.
          </p>
          <p>
            Then, days after submitting your numbers, you discover that the general contractor or prime broker has taken your meticulously engineered bill of materials, stripped your corporate branding, and handed it to a competitor to match. Your intellectual property has just been weaponized against you.
          </p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#FF5F1F]" /> The One-Way NDA Blindspot
          </h3>
          <p>
            The fundamental mistake specialty suppliers make is failing to check the **direction of the data flow** inside the agreement. 
          </p>
          <p>
            The overwhelming majority of pre-bid NDAs handed out by general contractors are strictly **one-way agreements**. They are masterfully written to ensure you don't reveal the project owner’s proprietary site maps or architectural blueprints. However, they contain absolutely zero reciprocal text protecting the proprietary data, custom configurations, or specialized pricing matrices *you* supply to the GC.
          </p>
          <p>
            Legally, the moment you click submit on their online procurement portal, your custom packages and negotiated commodity price thresholds become fair game for aggressive pre-award bid shopping.
          </p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#FF5F1F]" /> The Danger of the "Public Domain" Exception
          </h3>
          <p>
            Even when an NDA claims to be mutual, general contractor boilerplates routinely use a dangerous technical definition for what constitutes "Confidential Information."
          </p>
          <p>
            Many contracts state that information is only protected if it is explicitly stamped with a giant "CONFIDENTIAL" watermark or if it contains data not otherwise discoverable. Because a manufacturer's part number or a standard component's model code is technically public catalog information, an aggressive GC will argue that your specific bill of materials sequence is not a trade secret—even though the integrated package pricing took weeks of custom factory negotiation to achieve.
          </p>

          <div className="bg-slate-100 border-l-4 border-[#1A3668] p-4 rounded-r-xl space-y-2">
            <h4 className="text-xs font-black text-[#1A3668] uppercase tracking-wider">The "Approved Equal" Submittal Raid</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Watch out for clauses in the procurement specs that grant the GC an automatic, irrevocable license to use your engineering submittals to source "approved equals." If you provide your specialized system layouts or substitution calculations without protective headers, you are essentially providing your competitors with free engineering services.
            </p>
          </div>

          {/* Strategic Internal SEO Cross-Link */}
          <div className="bg-slate-50 border-l-4 border-[#FF5F1F] p-4 my-6 rounded-r-xl">
            <p className="text-[10px] font-black text-[#1A3668] uppercase tracking-widest">
              Related Field Intelligence
            </p>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
              Pre-bid pricing leaks often manifest through poorly defined partnership parameters during initial proposals. Protect your estimating assets by reading our guide on
              <a href="/blog/teaming-agreement-vague-scope-liabilities" className="text-[#FF5F1F] font-black hover:underline inline-flex items-center gap-0.5 ml-1 uppercase tracking-wide text-[11px]">
                The Teaming Agreement Trap: Defending Specialized Layouts from Pre-Award Bid Shopping →
              </a>
            </p>
          </div>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#FF5F1F]" /> Implementing Your Procurement Defense
          </h3>
          <p>
            Never let a prime contractor exploit your factory relationships to line their own pockets. Lock down your proprietary supply chains with these operational strategies:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-[#1A3668]">Enforce a True Bilateral NDA:</strong> Insist that the pre-bid agreement be converted into a strict, two-way mutual contract that explicitly includes "pricing matrices, material bills of quantities, and factory component configurations" within the legal definition of protected trade secrets.</li>
            <li><strong className="text-[#1A3668]">Insert Pricing Expiration & Shopping Penalties:</strong> Add explicit text directly to your proposal files stating that the pricing provided is conditional upon non-disclosure, and that any unauthorized distribution to third-party competitors will automatically nullify the quote and trigger immediate commercial procurement penalties.</li>
            <li><strong className="text-[#1A3668]">Mask Factory Lead-Time Strategies:</strong> Keep highly specialized logistics details or internal factory allocation channels close to your chest until a formal letter of intent is executed.</li>
          </ul>
        </div>

        {/* Strategic Call-to-Action Sidebar */}
        <div className="space-y-6">
          <div className="bg-white border-2 border-[#FF5F1F] rounded-xl p-6 shadow-md space-y-4 sticky top-6">
            <div className="p-2 bg-[#FF5F1F]/10 rounded-lg text-[#FF5F1F] inline-block">
              <EyeOff className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-[#1A3668] uppercase tracking-wide">
              Shield Your Proprietary Pricing
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Don't let aggressive prime contractors shop your custom engineered bills of materials to cut-rate brokers.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Drop your incoming pre-bid NDAs, RFQs, or procurement addendums into the <strong className="text-[#1A3668]">SubShield AI Procurement Auditor</strong> to instantly flag one-way data risks, isolate unfair material usage clauses, and defend your profit boundaries before you click submit.
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
