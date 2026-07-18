"use client";

import Link from "next/link";
import { 
  ArrowRight, CheckCircle, Building2, 
  HardHat, Server, Truck, Package, ShieldCheck
} from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-900 antialiased font-sans">
      
      {/* 1. PAGE HEADER */}
      <section className="bg-white border-b border-slate-200 pt-16 md:pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <span className="text-[10px] font-black text-[#FF5F1F] uppercase tracking-widest bg-orange-50 border border-orange-200/50 px-3 py-1 rounded-full inline-block">
            About SubShield
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-[#1A3668] tracking-tight uppercase leading-tight">
            Built to help small businesses slow down, protect their margins, and clarify the details before they sign.
          </h1>
        </div>
      </section>

      {/* 2. FOUNDER ORIGIN STORY */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row">
          
          {/* Left Column: Founder Identity */}
          <div className="bg-[#1A3668] text-white p-10 md:w-1/3 flex flex-col items-center text-center md:items-start md:text-left justify-center border-b md:border-b-0 md:border-r border-[#1A3668]">
            {/* Profile Image Container */}
            <div className="w-24 h-24 mb-6 rounded-full overflow-hidden border-2 border-orange-300 bg-[#596A7D] shrink-0 shadow-lg">
              <img 
                src="/founder.jpg" 
                alt="Carsen Siri, Founder of SubShield"
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="space-y-2">
              <span className="text-[10px] font-black text-orange-300 uppercase tracking-widest">
                Our Origin Framework
              </span>
              <h2 className="text-3xl font-black uppercase tracking-tight leading-none">
                Carsen Siri
              </h2>
              <p className="text-sm font-bold text-slate-300 uppercase tracking-wide">
                Founder, SubShield
              </p>
            </div>
          </div>

          {/* Right Column: The Story */}
          <div className="p-10 md:w-2/3 space-y-6 text-sm text-[#596A7D] font-medium leading-relaxed">
            <p className="text-base font-bold text-[#1A3668] leading-relaxed">
              My name is Carsen Siri. I created SubShield after digging deep into government contracting opportunities and realizing how quickly prime contractor and subcontractor relationships can turn heavily lopsided.
            </p>
            <p>
              My background is in purchasing and procurement across national medical and industrial supply sectors. In those high-stakes environments, details meant everything. A single overlooked line item or an unverified risk-shifting clause could easily wipe out an entire project's profit margin.
            </p>
            <p>
              That foundational experience shaped the exact way I look at federal business agreements today: slow down, isolate the liabilities, verify the compliance paths, and never assume a verbal promise is enough. 
            </p>
            <p>
              SubShield was built directly from that operational contractor mindset. It is not a law firm; it is a direct tool to organize your contract review, protect your working capital, and help you ask the right questions before you involve legal counsel and begin performance.
            </p>
          </div>
        </div>
      </section>

      {/* 3. TARGET SECTORS MATRIX */}
      <section className="bg-slate-50 border-t border-b border-slate-200 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A3668] uppercase tracking-tight">
              Sectors Built Into Our Rule-Matrix
            </h2>
            <p className="text-sm text-[#596A7D] font-medium mt-3 max-w-2xl mx-auto">
              SubShield is designed to support the specific compliance and risk profiles of diverse lower-tier federal contractors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Construction & Trade",
                icon: <HardHat size={24} className="text-[#FF5F1F]" />
              },
              {
                title: "IT & Tech Services",
                icon: <Server size={24} className="text-[#FF5F1F]" />
              },
              {
                title: "Industrial Supply",
                icon: <Package size={24} className="text-[#FF5F1F]" />
              },
              {
                title: "Logistics & Equipment",
                icon: <Truck size={24} className="text-[#FF5F1F]" />
              }
            ].map((sector, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col items-center text-center space-y-4 hover:border-slate-300 transition-all">
                <div className="p-3 bg-slate-50 rounded-lg">
                  {sector.icon}
                </div>
                <h4 className="text-sm font-black text-[#1A3668] uppercase tracking-wide">
                  {sector.title}
                </h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. OPERATIONAL CORE / BASELINE PRINCIPLES */}
      <section className="py-20 px-6 max-w-4xl mx-auto w-full">
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex p-3 bg-slate-50 text-[#1A3668] border border-slate-200 rounded-full">
            <ShieldCheck size={24} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A3668] uppercase tracking-tight">
            Our Baseline Principles
          </h2>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 md:p-12">
          <ul className="space-y-6">
            {[
              "Plain-English explanations over dense legalese.",
              "Isolating actual federal flow-downs from custom prime liabilities.",
              "Organizing contract risks to support efficient attorney review.",
              "Practical operational protection, not legal scare tactics."
            ].map((principle, idx) => (
              <li key={idx} className="flex items-start gap-4">
                <CheckCircle size={20} className="text-[#FF5F1F] shrink-0 mt-0.5" />
                <span className="text-sm md:text-base font-bold text-[#1A3668] uppercase tracking-wide leading-relaxed">
                  {principle}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 5. INLINED FINAL CTA */}
      <section className="bg-white py-20 px-6 border-t border-slate-200">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-black text-[#1A3668] uppercase tracking-tight leading-tight">
            Ready to review the package before you commit?
          </h2>
          <p className="text-base text-[#596A7D] font-medium leading-relaxed max-w-2xl mx-auto">
            Isolate mandatory FAR flow-downs, strip out unfair liabilities, and organize your files before your formal legal review begins.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link 
              href="/pricing"
              className="bg-[#FF5F1F] text-white px-8 py-4 rounded-xl hover:bg-[#1A3668] transition-all font-black text-xs sm:text-sm tracking-widest uppercase inline-flex items-center justify-center shadow-sm"
            >
              See Plans
            </Link>
            <Link 
              href="/sample-report"
              className="bg-slate-100 text-[#1A3668] hover:bg-slate-200 px-8 py-4 rounded-xl transition-all font-black text-xs sm:text-sm tracking-widest uppercase inline-flex items-center justify-center shadow-sm"
            >
              View Sample Report
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
