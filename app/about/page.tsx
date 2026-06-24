"use client";

import Link from "next/link";
import { ChevronRight, ShieldCheck, Construction, Factory, Truck, Wrench, Laptop } from "lucide-react";
import FinalCTA from "../../components/FinalCTA";

export default function AboutPage() {
  // Industry Target Grid Data Mapping - Updated to include 5 multi-industry channels
  const targetIndustries = [
    { label: "Construction", icon: <Construction className="w-5 h-5 text-[#1A3668]" /> },
    { label: "Industrial Supply & Equipment", icon: <Factory className="w-5 h-5 text-[#1A3668]" /> },
    { label: "Specialty Subcontractors", icon: <Wrench className="w-5 h-5 text-[#1A3668]" /> },
    { label: "Logistics & Fuel", icon: <Truck className="w-5 h-5 text-[#1A3668]" /> },
    { label: "IT, Tech & Professional Services", icon: <Laptop className="w-5 h-5 text-[#1A3668]" /> }
  ];

  // Core Belief Pillars Array
  const beliefPillars = [
    "Plain-English explanations over dense legalese",
    "Isolating actual federal flow-downs from custom prime liabilities",
    "Compacting billable hours before your formal attorney review",
    "Practical operational protection, not legal scare tactics"
  ];

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-900 antialiased font-sans">
      
      {/* BREADCRUMB PLATFORM */}
      <div className="bg-white border-b border-slate-200 py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
          <Link href="/" className="text-[#1A3668] hover:text-[#FF5F1F] transition-colors">
            SubShield
          </Link>
          <ChevronRight size={14} className="mx-2" />
          <span className="text-slate-600 font-medium">About Our Mission</span>
        </div>
      </div>

      {/* COMPONENT 1: THE PAGE HEADER & INTRO BLOCK */}
      <section className="bg-white pt-16 pb-20 px-6 border-b border-slate-200 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-slate-50 rounded-full blur-3xl opacity-50 z-0"></div>
        <div className="max-w-3xl mx-auto relative z-10 space-y-4">
          <span className="text-[10px] font-black text-[#FF5F1F] uppercase tracking-widest bg-orange-50 border border-orange-200/50 px-3 py-1 rounded-full inline-block">
            Corporate Profile
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#1A3668] tracking-tight uppercase">
            ABOUT SUBSHIELD
          </h1>
          <p className="text-base sm:text-lg text-[#596A7D] font-medium max-w-2xl mx-auto leading-relaxed">
            Built to help small businesses slow down, protect their cash flow, and clarify the details before they sign.
          </p>
        </div>
      </section>

      {/* COMPONENT 2: FOUNDER PROFILE BLOCK & BIO REHYDRATION */}
      <section className="py-20 px-6 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* PROFILE FRAME (LEFT SIDE) */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-4 shadow-2xs relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#1A3668] rounded-t-2xl"></div>
            <div className="w-20 h-20 bg-slate-100 border border-slate-200 rounded-full mx-auto flex items-center justify-center text-[#1A3668] shadow-inner font-black text-xl tracking-tight">
              SS
            </div>
            <div>
              <h3 className="text-base font-black text-[#1A3668] uppercase tracking-tight">Carsen Siri</h3>
              <p className="text-[10px] font-black text-[#FF5F1F] uppercase tracking-widest mt-0.5">FOUNDER, SUBSHIELD</p>
            </div>
            <div className="border-t border-slate-100 pt-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Procurement Risk Specialist
            </div>
          </div>

          {/* WHY I CREATED SUBSHIELD NARRATIVE (RIGHT SIDE) */}
          <div className="lg:col-span-8 space-y-6 text-left">
            <h3 className="text-xs font-black text-[#1A3668] uppercase tracking-widest">
              Our Origin Framework
            </h3>
            <div className="text-sm md:text-base text-slate-600 font-medium leading-relaxed space-y-4">
              <p>
                My name is Carsen Siri. I created SubShield after digging deep into government contracting opportunities and realizing how quickly prime contractor and subcontractor relationships can turn heavily lopsided.
              </p>
              <p>
                Before launching this platform, I spent years as a procurement professional in the commercial and industrial lighting supply sector. In that world, details meant everything. Manufacturer lead times, bulk pricing tiers, technical submittals, and complex delivery specifications had to be executed perfectly. A single overlooked line item or an unverified risk-shifting clause could easily wipe out an entire project's profit margin.
              </p>
              <p>
                That procurement experience shaped the exact way I look at federal business agreements: slow down, isolate the liabilities, verify the compliance paths, and never assume a verbal promise is enough. SubShield was built directly from that operational contractor mindset. It is not a law firm; it is a direct tool to protect your working capital and compress your legal bills <strong className="font-bold text-[#1A3668]">before your team begins performance</strong>.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* WHO SUBSHIELD IS FOR - GRID PANEL */}
      <section className="bg-white border-t border-b border-slate-200 py-16 px-6">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <h3 className="text-xs font-black text-[#FF5F1F] uppercase tracking-widest">Target Sectors</h3>
            <h4 className="text-lg sm:text-2xl font-extrabold text-[#1A3668] uppercase tracking-tight">
              Sectors Built Into Our Rule-Matrix
            </h4>
          </div>

          {/* Dynamic multi-industry responsive matrix grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {targetIndustries.map((industry, idx) => (
              <div key={idx} className="bg-[#F4F5F7]/50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-center gap-3 hover:bg-white hover:shadow-2xs transition-all text-center sm:text-left">
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg shrink-0 shadow-2xs">
                  {industry.icon}
                </div>
                <span className="text-xs font-black text-[#1A3668] uppercase tracking-wide leading-tight">
                  {industry.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT WE BELIEVE - VALUE BULLETS SECTION */}
      <section className="py-20 px-6 max-w-3xl mx-auto w-full text-left space-y-8">
        <div className="text-center sm:text-left space-y-2">
          <h3 className="text-xs font-black text-[#FF5F1F] uppercase tracking-widest">Operational Core</h3>
          <h4 className="text-xl sm:text-2xl font-extrabold text-[#1A3668] uppercase tracking-tight">
            Our Baseline Principles
          </h4>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {beliefPillars.map((belief, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 flex items-start gap-4 shadow-2xs">
              <div className="p-1 bg-orange-50 text-[#FF5F1F] rounded-md border border-orange-100 shrink-0 mt-0.5">
                <ShieldCheck size={14} />
              </div>
              <p className="text-xs sm:text-sm text-slate-700 font-bold uppercase tracking-wide">
                {belief}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* COMPONENT 3: BOTTOM CALL TO ACTION CONTAINER */}
      <FinalCTA />

    </div>
  );
}