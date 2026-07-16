import Link from "next/link";
import {
  CreditCard,
  Database,
  FileText,
  Lock,
  Server,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-900 pb-16">
      <header className="bg-[#0A192F] text-white py-14 px-6 border-b border-slate-800 text-center">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-[#FF6B00] mb-2">
            <Lock className="w-6 h-6 stroke-[2]" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Effective July 15, 2026
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-8">
        <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm" aria-labelledby="privacy-overview">
          <h2 id="privacy-overview" className="text-base font-black text-[#0A192F] uppercase tracking-tight mb-3">
            Overview
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            This Privacy Policy explains the information SubShield handles when you create an account, submit material for review, purchase credits or a subscription, view reports, or use an available support workflow. It also explains how that information is used and the choices available to you.
          </p>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm space-y-6" aria-labelledby="information-provided">
          <h2 id="information-provided" className="text-sm font-black text-[#0A192F] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <UserCheck className="w-4 h-4 text-[#FF6B00]" aria-hidden="true" />
            Information You Provide
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm leading-relaxed font-medium text-slate-600">
            <div className="space-y-1.5">
              <h3 className="font-black text-slate-800 uppercase tracking-tight text-xs">Account Information</h3>
              <p>SubShield handles the email address and authentication information associated with your account.</p>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-black text-slate-800 uppercase tracking-tight text-xs">Review Submissions</h3>
              <p>This includes PDF, DOCX, or TXT files and text you paste into the service for analysis.</p>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-black text-slate-800 uppercase tracking-tight text-xs">Payment References</h3>
              <p>Stripe processes payments. SubShield receives payment-related transaction and fulfillment references but does not store complete payment-card numbers.</p>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-black text-slate-800 uppercase tracking-tight text-xs">Support Communications</h3>
              <p>If a support or contact workflow is made available and you use it, SubShield may handle the information included in that communication.</p>
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm space-y-4" aria-labelledby="service-information">
          <h2 id="service-information" className="text-sm font-black text-[#0A192F] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <Database className="w-4 h-4 text-[#FF6B00]" aria-hidden="true" />
            Information Produced by the Service
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            SubShield produces and maintains information needed to operate reviews and customer accounts. Depending on how you use the service, this may include report results, review status, timestamps, filenames, Storage paths, extraction and processing metadata, and records used to account for review credits, purchases, and fulfillment.
          </p>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm space-y-4" aria-labelledby="information-use">
          <h2 id="information-use" className="text-sm font-black text-[#0A192F] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            How Information Is Used
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600 leading-relaxed font-medium">
            <li>Authenticate users and maintain account access.</li>
            <li>Ingest submitted material, perform AI-assisted analysis, and generate and display reports.</li>
            <li>Process purchase status, fulfill credits, and support subscription billing.</li>
            <li>Respond through an available customer-support workflow.</li>
            <li>Protect the service, prevent fraud and misuse, diagnose failures, and operate and improve service reliability.</li>
          </ul>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm space-y-4" aria-labelledby="service-providers">
          <h2 id="service-providers" className="text-sm font-black text-[#0A192F] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <Server className="w-4 h-4 text-[#FF6B00]" aria-hidden="true" />
            Service Providers
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            SubShield relies on service providers for website hosting, authentication, database and file storage, payment processing, and AI-assisted analysis. These providers handle information as needed to deliver their services. Stripe processes payments and billing-portal access. This Policy does not claim certifications, government authorizations, or contractual protections that have not been verified.
          </p>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm space-y-4" aria-labelledby="document-handling">
          <h2 id="document-handling" className="text-sm font-black text-[#0A192F] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="w-4 h-4 text-[#FF6B00]" aria-hidden="true" />
            Document Handling and Deletion
          </h2>
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed font-medium">
            <p>Uploaded files may remain associated with a review until you delete that review. Pasted text is processed to generate a report; this Policy does not promise that every temporary processing copy is retained or immediately erased.</p>
            <p>Deleting a review from the dashboard removes the customer-facing review and its associated uploaded Storage file when one exists. Limited accounting, transaction, credit-fulfillment, security, and diagnostic records may remain after deletion.</p>
            <p>SubShield does not promise immediate removal from every backup or an automatic retention period that is not implemented.</p>
          </div>
        </section>

        <section className="bg-amber-50 border border-amber-200 rounded-xl p-6 md:p-8 shadow-sm space-y-4" aria-labelledby="do-not-submit">
          <h2 id="do-not-submit" className="text-sm font-black text-amber-900 uppercase tracking-wider border-b border-amber-200 pb-3">
            Information You Should Not Submit
          </h2>
          <div className="space-y-3 text-sm text-amber-900 leading-relaxed font-medium">
            <p>Do not submit classified information, export-controlled information, passwords, complete payment-card data, Social Security numbers, medical records, or personal information that is not necessary for the review.</p>
            <p>SubShield is not represented as an authorized system for classified information, export-controlled information, Controlled Unclassified Information (CUI), FedRAMP workloads, or other government-restricted information. You are responsible for having the right and authority to submit all material you provide.</p>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm space-y-6" aria-labelledby="security-selling">
          <h2 id="security-selling" className="text-sm font-black text-[#0A192F] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <Lock className="w-4 h-4 text-[#FF6B00]" aria-hidden="true" />
            Security and Data Selling
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm leading-relaxed font-medium text-slate-600">
            <div className="space-y-1.5">
              <h3 className="font-black text-slate-800 uppercase tracking-tight text-xs">Security</h3>
              <p>SubShield uses HTTPS and reasonable access controls intended to protect account and review information. No online service can guarantee absolute security, and SubShield does not claim unverified security certifications or government approval.</p>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-black text-slate-800 uppercase tracking-tight text-xs">No Data-Broker Sales</h3>
              <p>SubShield does not sell uploaded contract documents or account information as a data-broker product.</p>
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm space-y-4" aria-labelledby="user-choices">
          <h2 id="user-choices" className="text-sm font-black text-[#0A192F] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <CreditCard className="w-4 h-4 text-[#FF6B00]" aria-hidden="true" />
            Your Choices
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600 leading-relaxed font-medium">
            <li>Access your dashboard to view available reviews, reports, and credit information.</li>
            <li>Delete reviews from the dashboard.</li>
            <li>Manage applicable subscription billing through the Stripe billing portal.</li>
            <li>Once the contact workflow is operational, use the <Link href="/contact" className="font-bold text-[#1A3668] underline decoration-[#FF6B00] underline-offset-2">Contact page</Link> for privacy questions.</li>
          </ul>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm space-y-4" aria-labelledby="policy-changes">
          <h2 id="policy-changes" className="text-sm font-black text-[#0A192F] uppercase tracking-wider border-b border-slate-100 pb-3">
            Changes to This Policy
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            SubShield may update this Privacy Policy as the service changes. A revised policy will be posted on this page with an updated effective date.
          </p>
        </section>

        <section className="bg-slate-900 text-slate-300 p-6 rounded-xl shadow-sm space-y-3" aria-labelledby="privacy-contact">
          <h2 id="privacy-contact" className="text-sm font-black tracking-widest text-[#FF6B00] uppercase">
            Contact
          </h2>
          <p className="text-sm leading-relaxed font-medium">
            For privacy questions, visit the <Link href="/contact" className="font-bold text-white underline decoration-[#FF6B00] underline-offset-2">Contact page</Link>. Do not include sensitive contract details in the public contact form.
          </p>
        </section>
      </div>
    </div>
  );
}
