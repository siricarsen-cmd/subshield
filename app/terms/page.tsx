import Link from "next/link";
import {
  AlertTriangle,
  CreditCard,
  FileText,
  Scale,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-900 pb-16">
      <header className="bg-[#0A192F] text-white py-14 px-6 border-b border-slate-800 text-center">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-[#FF6B00] mb-2">
            <ShieldCheck className="w-6 h-6 stroke-[2]" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight">
            Terms of Use
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Effective July 15, 2026
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-8">
        <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3" aria-labelledby="acceptance">
          <h2 id="acceptance" className="text-base font-black text-[#0A192F] uppercase tracking-tight">
            Acceptance of Terms
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            These Terms of Use govern access to and use of SubShield. By accessing or using the service, you agree to these Terms. If you do not agree, do not use SubShield.
          </p>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm space-y-6" aria-labelledby="service-description">
          <h2 id="service-description" className="text-sm font-black text-[#0A192F] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="w-4 h-4 text-[#FF6B00]" aria-hidden="true" />
            Description of SubShield
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm leading-relaxed font-medium text-slate-600">
            <div className="space-y-1.5">
              <h3 className="font-black text-slate-800 uppercase tracking-tight text-xs">AI-Assisted Screening</h3>
              <p>SubShield accepts PDF, DOCX, TXT, and pasted text and produces evidence-grounded screening and preparation reports for government-contracting documents.</p>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-black text-slate-800 uppercase tracking-tight text-xs">No Legal Advice</h3>
              <p>SubShield is not a law firm, does not provide legal advice or legal opinions, and does not create an attorney-client relationship. Consult a qualified government-contracts attorney or other qualified legal counsel before signing or relying on final contract terms.</p>
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm space-y-6" aria-labelledby="account-use">
          <h2 id="account-use" className="text-sm font-black text-[#0A192F] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <UserCheck className="w-4 h-4 text-[#FF6B00]" aria-hidden="true" />
            Accounts and Authorized Use
          </h2>
          <div className="space-y-4 text-sm text-slate-600 leading-relaxed font-medium">
            <div>
              <h3 className="font-black text-slate-800 uppercase tracking-tight text-xs mb-1.5">Account Responsibilities</h3>
              <p>You are responsible for maintaining the confidentiality of your sign-in credentials, using an email address you control, and promptly addressing suspected unauthorized access to your account.</p>
            </div>
            <div>
              <h3 className="font-black text-slate-800 uppercase tracking-tight text-xs mb-1.5">Authority to Submit Documents</h3>
              <p>You may submit only material that you are authorized to provide and process. You remain responsible for reviewing documents for unnecessary personal, proprietary, restricted, or third-party information before submission.</p>
            </div>
          </div>
        </section>

        <section className="bg-amber-50 border border-amber-200 rounded-xl p-6 md:p-8 shadow-sm space-y-4" aria-labelledby="prohibited-use">
          <h2 id="prohibited-use" className="text-sm font-black text-amber-900 uppercase tracking-wider flex items-center gap-2 border-b border-amber-200 pb-3">
            <AlertTriangle className="w-4 h-4" aria-hidden="true" />
            Prohibited Content and Uses
          </h2>
          <div className="space-y-3 text-sm text-amber-900 leading-relaxed font-medium">
            <p>Do not submit classified information, export-controlled information, Controlled Unclassified Information (CUI), passwords, complete payment-card data, Social Security numbers, medical records, malware, or information you have no right to use. SubShield is not represented as an authorized environment for government-restricted information.</p>
            <p>You may not use SubShield unlawfully; interfere with service operation; attempt to access another user&apos;s account, files, or reports; bypass authentication, payment, or credit controls; probe the service for vulnerabilities without authorization; or use the service to infringe another person&apos;s rights.</p>
          </div>
        </section>

        <section className="bg-slate-900 text-slate-300 p-6 rounded-xl shadow-sm space-y-3" aria-labelledby="report-limits">
          <h2 id="report-limits" className="text-sm font-black tracking-widest text-[#FF6B00] uppercase">
            AI-Assisted Report Limitations
          </h2>
          <p className="text-sm leading-relaxed font-medium">
            Automated analysis can miss, misclassify, or misunderstand language and may not identify every relevant issue. Reports are screening and preparation materials, not complete document reviews, legal opinions, or guarantees of legal, commercial, or negotiation outcomes. You are responsible for evaluating each report and the underlying document with qualified counsel as appropriate.
          </p>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm space-y-6" aria-labelledby="credits-purchases">
          <h2 id="credits-purchases" className="text-sm font-black text-[#0A192F] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <CreditCard className="w-4 h-4 text-[#FF6B00]" aria-hidden="true" />
            Credits, Purchases, and Billing
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm leading-relaxed font-medium text-slate-600">
            <div className="space-y-1.5">
              <h3 className="font-black text-slate-800 uppercase tracking-tight text-xs">Single Review Cycle</h3>
              <p>A $149.99 one-time purchase provides 1 review credit for one complete document ingestion and analysis. It is not a subscription.</p>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-black text-slate-800 uppercase tracking-tight text-xs">Active Bidder Plan</h3>
              <p>A $249 monthly subscription provides 3 review credits for each successfully paid eligible monthly billing cycle. Unused credits remain available in the customer account. Customers can manage or cancel the subscription through the Stripe billing portal.</p>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-black text-slate-800 uppercase tracking-tight text-xs">Enterprise Credit Pack</h3>
              <p>A $1,999 one-time purchase provides 30 review credits for higher-volume use. It is not a subscription and does not renew.</p>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-5 space-y-3 text-sm text-slate-600 leading-relaxed font-medium">
            <p>One available credit is reserved when a paid analysis begins and remains consumed when the analysis is successfully processed. A genuine processing failure restores the credit under the implemented review lifecycle. Viewing a completed report does not consume another credit.</p>
            <p>A revised or amended document requires another available credit and a new analysis. SubShield does not currently provide automated version comparison.</p>
            <p>Stripe handles payment processing. SubShield does not store complete card numbers. Billing questions and refund requests are handled based on the circumstances and applicable payment rules; submitting a request does not guarantee approval.</p>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm space-y-6" aria-labelledby="availability-deletion">
          <h2 id="availability-deletion" className="text-sm font-black text-[#0A192F] uppercase tracking-wider border-b border-slate-100 pb-3">
            Service Availability and Review Deletion
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm leading-relaxed font-medium text-slate-600">
            <div className="space-y-1.5">
              <h3 className="font-black text-slate-800 uppercase tracking-tight text-xs">Availability and Processing</h3>
              <p>SubShield may experience interruptions, delays, file-extraction problems, or processing failures. The service does not promise uninterrupted availability, perfect detection, or successful processing of every document.</p>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-black text-slate-800 uppercase tracking-tight text-xs">Deletion and Limited Retention</h3>
              <p>You can delete reviews from the dashboard. Deletion removes the customer-facing review and its uploaded Storage file when one exists. Limited billing, accounting, fulfillment, security, transaction, and diagnostic records may remain.</p>
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm space-y-4" aria-labelledby="intellectual-property">
          <h2 id="intellectual-property" className="text-sm font-black text-[#0A192F] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <Scale className="w-4 h-4 text-[#FF6B00]" aria-hidden="true" />
            Intellectual Property and Report Use
          </h2>
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed font-medium">
            <p>You retain your rights in documents and text you submit. SubShield and its licensors retain their rights in the service, software, interface, branding, and original service materials.</p>
            <p>You may use reports for your personal or internal business purposes, including preparation for discussions with a prime contractor or qualified legal counsel. You may not resell access to the service, misrepresent a report as a legal opinion, or copy or exploit the service itself beyond normal authorized use.</p>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm space-y-4" aria-labelledby="suspension">
          <h2 id="suspension" className="text-sm font-black text-[#0A192F] uppercase tracking-wider border-b border-slate-100 pb-3">
            Suspension or Restriction
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            SubShield may suspend or restrict access when reasonably necessary to address misuse, suspected fraud, security threats, chargebacks or payment disputes, prohibited uploads, attempts to bypass service controls, or risks to other users or the service.
          </p>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm space-y-4" aria-labelledby="terms-changes">
          <h2 id="terms-changes" className="text-sm font-black text-[#0A192F] uppercase tracking-wider border-b border-slate-100 pb-3">
            Changes to the Service or Terms
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            SubShield may change, add, or discontinue service features and may update these Terms as the service develops. Updated Terms will be posted on this page with a revised effective date. If you do not accept updated Terms, stop using the service.
          </p>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4 shadow-sm" aria-labelledby="terms-contact">
          <h2 id="terms-contact" className="text-base font-black text-[#0A192F] uppercase tracking-tight">
            Contact
          </h2>
          <p className="text-sm text-slate-500 font-medium max-w-xl mx-auto leading-relaxed">
            For questions about these Terms, visit the Contact page. Do not send sensitive contract information through public contact channels.
          </p>
          <Link
            href="/contact"
            className="inline-flex bg-[#FF6B00] text-white text-xs font-black uppercase tracking-wider px-8 py-3.5 rounded-xl hover:bg-[#0A192F] transition-all shadow-sm text-center"
          >
            View Contact Page
          </Link>
        </section>
      </div>
    </div>
  );
}
