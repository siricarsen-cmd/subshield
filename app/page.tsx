"use client";

import Link from "next/link";
import { 
  FileText, ArrowRight, CheckCircle, 
  FileSearch, FileWarning, AlertTriangle, Clock, 
  Briefcase, FileSignature, Layers, ShieldCheck, Landmark, Shield, Lock
} from "lucide-react";

export default function Home() {
  const riskCategories = [
    {
      title: "Payment Traps",
      desc: "Pay-when-paid language, delayed payment timing, retainage, setoff rights, or unclear invoice approval rules.",
      icon: <Clock size={20} className="text-[#FF5F1F]" />
    },
    {
      title: "Missing Documents",
      desc: "Referenced exhibits, flowdowns, wage determinations, cybersecurity terms, SOWs, or prime contract attachments that were not provided.",
      icon: <FileSearch size={20} className="text-[#FF5F1F]" />
    },
    {
      title: "Vague Scope of Work",
      desc: "Unclear deliverables, undefined acceptance standards, open-ended support duties, or mismatched SOW language.",
      icon: <Layers size={20} className="text-[#FF5F1F]" />
    },
    {
      title: "Flowdown Exposure",
      desc: "Federal clauses, FAR/DFARS obligations, prime contract terms, or compliance duties passed down without enough context.",
      icon: <FileWarning size={20} className="text-[#FF5F1F]" />
    },
    {
      title: "Liability & Indemnity",
      desc: "Broad indemnity, uncapped liability, insurance mismatch, or responsibility for issues outside your control.",
      icon: <AlertTriangle size={20} className="text-[#FF5F1F]" />
    },
    {
      title: "Schedule & Change Risk",
      desc: "Unclear period of performance, unilateral schedule changes, informal direction, or unpaid change work.",
      icon: <Briefcase size={20} className="text-[#FF5F1F]" />
    },
    {
      title: "Termination & Default",
      desc: "Short cure periods, broad default rights, convenience termination gaps, or weak payment protection after termination.",
      icon: <FileSignature size={20} className="text-[#FF5F1F]" />
    },
    {
      title: "Compliance Cost Risk",
      desc: "Cybersecurity, wage, reporting, audit, bonding, insurance, or documentation duties that may not be reflected in your price.",
      icon: <Landmark size={20} className="text-[#FF5F1F]" />
    }
  ];

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-900 antialiased font-sans">
      
      {/* 1. HERO COMPONENT */}
      <section className="max-w-6xl mx-auto px-6 pt-16 md:pt-24 pb-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* LEFT COLUMN: BRAND TYPOGRAPHY */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <span className="text-[10px] font-black text-[#FF5F1F] uppercase tracking-widest bg-orange-50 border border-orange-200/50 px-3 py-1 rounded-full inline-block">
            Pre-Award Risk Review
          </span>
          
          <h1 className="text-3xl md:text-5xl font-black text-[#1A3668] tracking-tight uppercase leading-tight">
            Review prime subcontract risk before you bid, sign, or commit.
          </h1>
          
          <p className="text-base md:text-lg text-[#596A7D] font-medium leading-relaxed max-w-2xl">
            SubShield helps contractors review government subcontract, teaming, and prime-provided bid packages before attorney review — flagging payment traps, missing documents, vague scopes, flowdown risks, and negotiation questions to send back to the prime.
          </p>
          
          <div className="pt-2 flex flex-col sm:flex-row gap-4">
            <Link 
              href="/pricing"
              className="bg-[#FF5F1F] text-white px-8 py-4 rounded-xl hover:bg-[#1A3668] transition-all font-black text-xs sm:text-sm tracking-widest uppercase inline-flex items-center justify-center gap-2 group shadow-sm"
            >
              See Plans <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link 
              href="/sample-report"
              className="bg-white text-[#1A3668] border-2 border-slate-200 hover:border-[#1A3668] px-8 py-4 rounded-xl transition-all font-black text-xs sm:text-sm tracking-widest uppercase inline-flex items-center justify-center shadow-sm"
            >
              View Sample Report
            </Link>
          </div>
        </div>

        {/* RIGHT COLUMN: PRIME PACKAGE RISK REVIEW CARD */}
        <div className="lg:col-span-5 w-full flex flex-col items-center lg:items-end">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-md p-6 md:p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-[#1A3668]"></div>
            
            <div className="space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 bg-slate-100 text-[#1A3668] rounded-lg">
                  <ShieldCheck size={20} className="text-[#FF5F1F]" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-[#1A3668] uppercase tracking-wide">Prime Package Risk Review</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Pre-Commitment Scan</p>
                </div>
              </div>

              <p className="text-xs text-[#596A7D] font-medium leading-relaxed">
                Upload your subcontract, teaming agreement, SOW, flowdowns, exhibits, or bid package. SubShield flags common risk areas before you commit or send the package to counsel.
              </p>

              <div className="space-y-3 pt-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">System Checks Include:</span>
                
                {[
                  "Payment and invoicing traps",
                  "Missing flowdowns or exhibits",
                  "Vague scope or workshare language",
                  "Broad liability or indemnity terms",
                  "Questions to send back to the prime"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs font-bold text-slate-700 uppercase tracking-wide">
                    <CheckCircle size={14} className="text-[#FF5F1F] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Trust Badge under the hero card */}
          <div className="flex items-center gap-2 mt-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-full max-w-md justify-center">
            <Lock size={12} className="text-[#1A3668]" /> 256-Bit Encrypted Portal
          </div>
        </div>
      </section>

      {/* 2. WHY PRE-AWARD MATTERS */}
      <section className="bg-white border-t border-b border-slate-200 py-16 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#1A3668] uppercase tracking-tight">
            Catch subcontract risk while you still have leverage.
          </h2>
          <p className="text-sm md:text-base text-[#596A7D] font-medium max-w-3xl mx-auto leading-relaxed">
            Once the prime submits the bid or receives the award, subcontract terms can become harder to renegotiate. SubShield helps contractors identify missing information, unclear obligations, and risk-heavy terms before they commit pricing, labor, equipment, bonding, insurance, or performance capacity.
          </p>
        </div>
      </section>

      {/* 3. WHERE ARE YOU IN THE PROCESS */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A3668] uppercase tracking-tight mt-1">
            Where are you in the prime-sub process?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* MAIN CARD: Pre-Award */}
          <div className="bg-[#1A3668] text-white p-8 rounded-2xl shadow-md border-2 border-[#1A3668] flex flex-col justify-between hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full">
                Primary Use Case
              </span>
              <h3 className="text-xl font-black uppercase tracking-tight">Before bid, award, or signature</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Use SubShield before you commit to a prime's subcontract terms, teaming terms, scope, flowdowns, pricing assumptions, or compliance obligations.
              </p>
              
              <div className="pt-4 pb-6 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Good For:</span>
                <ul className="text-xs font-medium space-y-2 text-slate-200">
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-[#FF5F1F]" /> Draft subcontract packages</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-[#FF5F1F]" /> Teaming agreements & LOIs</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-[#FF5F1F]" /> Prime-provided SOWs</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-[#FF5F1F]" /> Flowdown attachments</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-[#FF5F1F]" /> Bid packages with future terms</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-[#FF5F1F]" /> Missing exhibits or documents</li>
                </ul>
              </div>
            </div>
            <Link 
              href="/pricing"
              className="w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest text-center flex items-center justify-center gap-2 transition-all bg-[#FF5F1F] text-white hover:bg-orange-600 shadow-sm"
            >
              Start Pre-Award Review <ArrowRight size={14} />
            </Link>
          </div>

          {/* SECONDARY CARD: Post-Award */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 px-3 py-1 rounded-full">
                Secondary Fallback Path
              </span>
              <h3 className="text-xl font-black text-[#1A3668] uppercase tracking-tight">Already received or signed a subcontract?</h3>
              <p className="text-sm text-[#596A7D] leading-relaxed">
                If you already moved forward without a structured review, SubShield can still help identify risk areas, missing documents, unclear obligations, and questions to raise with the prime or legal counsel.
              </p>
            </div>
            <div className="pt-8">
              <Link 
                href="/pricing"
                className="w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest text-center flex items-center justify-center gap-2 transition-all bg-slate-100 text-[#1A3668] hover:bg-slate-200"
              >
                Start Post-Award Review <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOMEPAGE WORKFLOW */}
      <section className="bg-[#1A3668] text-white py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight">
              How SubShield Works
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-8 left-12 right-12 h-0.5 bg-slate-700 z-0"></div>
            
            {[
              {
                step: "1",
                title: "Upload the prime-provided package",
                desc: "Upload the draft subcontract, teaming agreement, SOW, flowdowns, exhibits, or bid documents provided by the prime contractor."
              },
              {
                step: "2",
                title: "SubShield runs an initial risk review",
                desc: "The system flags common risk areas including payment timing, vague work scope, missing documents, flowdown exposure, and change-order risk."
              },
              {
                step: "3",
                title: "Send focused questions back to the prime",
                desc: "Use the report to request missing documents, clarify obligations, and ask for revisions before you commit or send the package to counsel."
              },
              {
                step: "4",
                title: "Send the cleaner package to your attorney",
                desc: "After the prime responds, SubShield recommends sending the revised package to qualified legal counsel for final review."
              }
            ].map((item, idx) => (
              <div key={idx} className="relative z-10 flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#FF5F1F] flex items-center justify-center text-2xl font-black shadow-lg border-4 border-[#1A3668]">
                  {item.step}
                </div>
                <h4 className="text-sm font-bold uppercase tracking-wide px-2">{item.title}</h4>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. WHAT SUBSHIELD FLAGS */}
      <section className="py-20 px-6 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[10px] font-black text-[#FF5F1F] uppercase tracking-widest bg-orange-50 border border-orange-200/50 px-3 py-1 rounded-full">
            Review Scope
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A3668] uppercase tracking-tight mt-4">
            What SubShield Flags
          </h2>
          <p className="text-sm text-[#596A7D] font-medium mt-2 leading-relaxed">
            SubShield reviews the package for common government subcontract risk areas that can affect payment, scope, compliance, liability, and negotiation leverage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {riskCategories.map((threat, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3 flex flex-col hover:border-slate-300 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div className="p-2 bg-slate-50 inline-flex rounded-lg w-fit mb-2">
                {threat.icon}
              </div>
              <h4 className="text-xs font-black text-[#1A3668] uppercase tracking-wide leading-tight">
                {threat.title}
              </h4>
              <p className="text-[11px] text-[#596A7D] font-medium leading-relaxed">
                {threat.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. ATTORNEY POSITIONING & WHO IT HELPS */}
      <section className="bg-slate-50 border-t border-slate-200 py-20 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          
          {/* Attorney Section */}
          <div className="space-y-6">
            <div className="inline-flex p-3 bg-white text-[#1A3668] border border-slate-200 rounded-xl shadow-sm">
              <FileText size={24} />
            </div>
            <h3 className="text-xl font-extrabold text-[#1A3668] uppercase tracking-tight">
              Built to support attorney review — not replace it.
            </h3>
            <p className="text-sm text-[#596A7D] font-medium leading-relaxed">
              SubShield is not a law firm and does not provide legal advice. It helps contractors organize the first pass by identifying common risk areas, missing documents, unclear obligations, and questions for the prime. After the prime responds with a cleaner package, SubShield recommends sending the revised documents to qualified legal counsel for final review.
            </p>
            <ul className="space-y-3 pt-2">
              {[
                "Helps organize contract issues before legal review",
                "Helps reduce avoidable attorney review time",
                "Helps focus counsel on the highest-risk terms",
                "Helps contractors ask better questions before committing"
              ].map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs font-bold text-[#1A3668] uppercase tracking-wide">
                  <CheckCircle size={16} className="text-[#FF5F1F] shrink-0" />
                  <span className="mt-0.5">{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Who It Helps Section */}
          <div className="space-y-6">
            <div className="inline-flex p-3 bg-white text-[#1A3668] border border-slate-200 rounded-xl shadow-sm">
              <Shield size={24} />
            </div>
            <h3 className="text-xl font-extrabold text-[#1A3668] uppercase tracking-tight">
              Built for contractors working under government primes.
            </h3>
            <p className="text-sm text-[#596A7D] font-medium leading-relaxed">
              SubShield is designed specifically for teams navigating the complexities of federal contracting pipelines at the subcontract level.
            </p>
            <ul className="space-y-3 pt-2">
              {[
                "Small and mid-sized government subcontractors",
                "IT and technology service providers",
                "Specialty trade contractors",
                "Construction contractors",
                "Suppliers and manufacturers",
                "Professional service firms",
                "Internal contract, operations, or business development teams",
                "Enterprise teams that want a consistent first-pass review process"
              ].map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs font-bold text-[#1A3668] uppercase tracking-wide">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF5F1F] shrink-0 mt-1.5"></div>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </section>

      {/* 7. INLINED FINAL CTA */}
      <section className="bg-white py-20 px-6 border-t border-slate-200">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-black text-[#1A3668] uppercase tracking-tight leading-tight">
            Ready to review the package before you commit?
          </h2>
          <p className="text-base text-[#596A7D] font-medium leading-relaxed max-w-2xl mx-auto">
            Upload your prime-provided subcontract, teaming, or bid package. SubShield will flag common risk areas, missing documents, and negotiation questions so you can go back to the prime before final attorney review.
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