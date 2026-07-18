import {
  Building2,
  Clock,
  CreditCard,
  FileInput,
  FileSearch,
  FileText,
  Scale,
  Shield,
  ShieldAlert,
} from "lucide-react";
import FinalCTA from "@/components/FinalCTA";

export default function FAQPage() {
  const faqs = [
    {
      icon: Scale,
      q: "Is SubShield a law firm or a replacement for an attorney?",
      a: "No. SubShield is an automated contract risk-screening and document-organization tool. It identifies targeted government-contracting issues, quotes supporting contract text, and organizes questions for negotiation and attorney review. SubShield does not provide legal advice, legal opinions, or legal representation."
    },
    {
      icon: FileSearch,
      q: "What types of documents are a good fit for SubShield?",
      a: "SubShield is designed for government-contracting documents provided by prime contractors, including solicitation packages, teaming agreements, draft subcontracts, flow-down packages, amendments, and related supporting documents. Its primary use is reviewing terms before bidding, signing, or committing resources."
    },
    {
      icon: FileInput,
      q: "What file types can I submit?",
      a: "SubShield accepts PDF, DOCX, TXT, and pasted contract text. Scanned PDFs may require optical character recognition. When the document text cannot be reviewed reliably, SubShield displays a Limited Scan or Partial OCR notice rather than presenting the result as a clean review."
    },
    {
      icon: Clock,
      q: "How long does a review take?",
      a: "Analysis begins after a document is uploaded or text is submitted. Text-based documents generally process more quickly, while large or scanned PDFs may take longer. The report becomes available after automated processing finishes. SubShield does not promise a fixed manual-review turnaround time."
    },
    {
      icon: FileText,
      q: "What does the report include?",
      a: "Depending on the document and extraction quality, the report may include document anchors, targeted risk findings, exact quoted contract language, operational explanations, suggested negotiation language, missing-document concerns, important deadlines, and an organized memo for discussion with the prime contractor or qualified counsel."
    },
    {
      icon: CreditCard,
      q: "How do plans and review credits work?",
      a: "Each plan provides the review credits described on the Pricing page. An available credit is required to run a document review. Revised documents or additional packages may require another credit, depending on the review being submitted. Current plan details are always shown on the Pricing page."
    },
    {
      icon: Shield,
      q: "How are my documents and reports handled?",
      a: "Documents and reports are associated with the signed-in account and are processed to provide the SubShield service. Users can delete saved reviews from the dashboard. When an associated contract file is stored with the review, the deletion workflow also removes that stored file. Additional details are provided in the Privacy Policy."
    },
    {
      icon: ShieldAlert,
      q: "Does “No Critical Flags Detected” mean the contract is safe to sign?",
      a: "No. It means SubShield did not detect the targeted critical issues in the document text it was able to review. It is not a legal opinion, approval, or guarantee that the agreement is complete, favorable, enforceable, or safe to sign. Qualified legal review may still be appropriate."
    },
    {
      icon: Building2,
      q: "Can I use SubShield for ordinary residential or commercial contracts?",
      a: "SubShield is designed specifically for government-contracting and prime-to-subcontractor documents. Its detection rules focus on GovCon risks such as payment conditions, workshare, flow-downs, FAR and DFARS obligations, notice periods, wage requirements, cybersecurity, termination, and related compliance issues. It is not optimized for ordinary residential or general commercial agreements."
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
            Clear answers about document fit, processing, credits, privacy, reports, and the role of qualified legal counsel.
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
