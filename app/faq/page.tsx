import Link from "next/link";
import { HelpCircle, Scale, FileSearch, Clock, Shield, Lock, FileText, ChevronRight } from "lucide-react";
import FinalCTA from "../components/FinalCTA";

export default function FAQPage() {
  const faqs = [
    {
      icon: Scale,
      q: "Is SubShield a law firm or a replacement for an attorney?",
      a: "No. SubShield is an automated Attorney Prep Toolkit. We scan government solicitation materials, teaming agreements, and draft subcontracts to isolate commercial liabilities, hidden scope gaps, and payment traps. We do not provide formal legal representation. Instead, we give you an organized risk layout so you can direct your construction attorney's billable hours purely on targeted drafting and negotiation."
    },
    {
      icon: FileSearch,
      q: "What is the difference between the Proposal-Stage and Award-Stage review?",
      a: "Proposal-Stage review is built for contractors responding to quick prime emails, pre-solicitation notices, or brief teaming commitments. It focuses on missing protections—like unbacked workshare promises or proprietary rate exposure. Award-Stage review handles finalized, multi-page draft subcontracts, scanning line-by-line for aggressive pass-down indemnifications, pay-if-paid clauses, and tight claims windows."
    },
    {
      icon: Clock,
      q: "How fast do I receive my completed Risk Report?",
      a: "Government bidding scales on strict timelines, so our engine processes data rapidly. Once you upload your document draft or paste your raw text intake files into your secure portal, your comprehensive, plain-English SubShield Risk Report is compiled and ready within 24 hours."
    },
    {
      icon: Shield,
      q: "Can I use SubShield for standard commercial or residential projects?",
      a: "SubShield is engineered specifically for federal, state, and local government procurement parameters. Our logic matrices are built around GovCon realities, FAR/DFARS flow-downs, small business participation goals, and prime-to-subcontractor compliance frameworks. It is not optimized for standard residential or commercial work."
    },
    {
      icon: Lock,
      q: "How secure are my pricing models, past performance data, and files?",
      a: "Security is our baseline. We utilize enterprise-grade encryption for all documents and raw text data both in transit and at rest. Your competitive labor rates, proprietary bidding methods, and company files are strictly private, completely segmented, and used exclusively to assemble your specific risk triage documents."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-900 antialiased font-sans">
      
      {/* HEADER BLOCK */}
      <section className="bg-white pt-16 pb-20 px-6 border-b border-slate-200 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-50 rounded-full blur-3xl opacity-40 z-0"></div>
        <div className="max-w-3xl mx-auto relative z-10">
          <span className="text-[10px] font-black text-[#FF5F1F] uppercase tracking-widest bg-orange-50 border border-orange-200/50 px-3 py-1 rounded-full">
            Knowledge Base
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#1A3668] tracking-tight mt-4 mb-4 uppercase">
            Frequently Asked Questions
          </h1>
          <p className="text-base sm:text-lg text-[#596A7D] font-medium max-w-xl mx-auto leading-relaxed">
            Clear, direct answers about how SubShield protects your small business margins during GovCon teaming.
          </p>
        </div>
      </section>

      {/* FAQ GRID CONTAINER */}
      <section className="py-20 px-6 max-w-4xl mx-auto w-full">
        <div className="space-y-6">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-start">
              <div className="bg-[#F4F5F7] p-3 rounded-xl text-[#FF5F1F] shrink-0">
                <faq.icon size={22} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-bold text-[#1A3668] text-base mb-2.5 leading-tight uppercase tracking-tight">
                  {faq.q}
                </h3>
                <p className="text-xs sm:text-sm text-[#596A7D] font-medium leading-relaxed">
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FLOATING CTA OUTLINE ELEMENT */}
      <FinalCTA />

    </div>
  );
}