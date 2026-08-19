import { AlertCircle, CheckCircle, FileSearch, Scale, ShieldAlert } from "lucide-react";
import Link from "next/link";
import FinalCTA from "@/components/FinalCTA";
import JsonLd from "@/components/JsonLd";
import { buildMetadata, SITE_ORIGIN } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Federal Subcontract Risk Review | SubPreCheck",
  description:
    "Review federal subcontract, teaming, and prime-provided bid packages before you commit. SubPreCheck surfaces payment, scope, flowdown, compliance, and missing-document risks for a better-prepared attorney handoff.",
  path: "/",
});

const riskItems = [
  {
    title: "Payment & Cash Flow",
    body: "Contingent payment, retainage, setoff, backcharge, and acceptance language that can affect when and whether you get paid.",
  },
  {
    title: "Scope & Workshare",
    body: "Vague scope, undefined workshare, missing exhibits, and incorporated documents that can expand obligations after award.",
  },
  {
    title: "FAR / DFARS Flowdowns",
    body: "Referenced clauses, flowdown language, cyber requirements, labor rules, and other federal obligations that need applicability review.",
  },
  {
    title: "Changes, Notices & Cure",
    body: "Short notice windows, change-order traps, cure/default provisions, and continue-performance language that can limit your options later.",
  },
  {
    title: "Liability & Termination",
    body: "Indemnification, insurance, termination, dispute, venue, and liability provisions that can shift risk beyond your priced scope.",
  },
  {
    title: "Missing Documents",
    body: "Statements of Work, flowdown matrices, wage determinations, cyber attachments, schedules, exhibits, and other referenced materials you were not given.",
  },
] as const;

const processSteps = [
  {
    step: "01",
    title: "Upload the Package",
    desc: "Upload PDF, DOCX, TXT, or paste the subcontract or prime-provided bid package before you commit.",
  },
  {
    step: "02",
    title: "Review the Issues",
    desc: "SubPreCheck organizes evidence-grounded findings, missing documents, deadlines, and questions to raise with the prime.",
  },
  {
    step: "03",
    title: "Clarify With the Prime",
    desc: "Use the request list and cited contract language to resolve missing documents, vague scope, payment terms, and other issues before signing.",
  },
  {
    step: "04",
    title: "Prepare for Counsel",
    desc: "After the prime responds, send the revised package to qualified legal counsel so attorney time can focus on the legal questions that require legal judgment.",
  },
] as const;

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "SubPreCheck",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          url: SITE_ORIGIN,
          description:
            "Structured first-pass federal subcontract risk review for small and mid-sized subcontractors.",
          offers: {
            "@type": "AggregateOffer",
            lowPrice: "149.99",
            priceCurrency: "USD",
            offerCount: "3",
          },
        }}
      />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-slate-100 bg-white px-6 py-20 sm:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,95,31,0.08),_transparent_38%),radial-gradient(circle_at_bottom_left,_rgba(26,54,104,0.08),_transparent_38%)]" />
        <div className="relative mx-auto max-w-5xl text-center">
          <span className="inline-flex rounded-full border border-orange-200/70 bg-orange-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#FF5F1F]">
            Federal Subcontract Risk Review
          </span>
          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-black uppercase tracking-tight text-[#1A3668] sm:text-5xl md:text-6xl">
            Know the risks before you bid, sign, or commit.
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base font-medium leading-relaxed text-[#596A7D] sm:text-lg">
            SubPreCheck gives federal subcontractors a structured first-pass review of prime-provided packages — surfacing payment, scope, flowdown, compliance, and missing-document issues before the package reaches counsel.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/pricing"
              className="inline-flex min-h-12 items-center justify-center rounded bg-[#FF5F1F] px-7 py-3 text-xs font-black uppercase tracking-widest text-white shadow-md transition-colors hover:bg-orange-600"
            >
              See Plans
            </Link>
            <Link
              href="/sample-report"
              className="inline-flex min-h-12 items-center justify-center rounded border-2 border-[#1A3668] bg-white px-7 py-3 text-xs font-black uppercase tracking-widest text-[#1A3668] transition-colors hover:bg-[#1A3668] hover:text-white"
            >
              View Sample Report
            </Link>
          </div>
          <p className="mx-auto mt-5 max-w-2xl text-[11px] font-semibold leading-relaxed text-slate-500">
            Contract risk screening and document organization for informational and preparation purposes. Not legal advice or a substitute for qualified legal counsel.
          </p>
        </div>
      </section>

      {/* 2. WHY USE IT PRE-AWARD */}
      <section className="bg-slate-50 px-6 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#FF5F1F]">Before You Commit</span>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-[#1A3668]">
              The best time to find a problem is before it becomes your obligation.
            </h2>
            <p className="mt-5 text-sm font-medium leading-relaxed text-[#596A7D]">
              Federal subcontract packages can bury major business terms inside flowdowns, exhibits, prime-contract references, and boilerplate. SubPreCheck helps organize those issues while you still have room to ask questions, request missing documents, and price the risk.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <AlertCircle className="h-7 w-7 text-[#FF5F1F]" />
              <h3 className="mt-4 text-sm font-black uppercase tracking-wide text-[#1A3668]">Before Signing</h3>
              <p className="mt-2 text-xs font-medium leading-relaxed text-slate-600">
                Identify payment, liability, termination, notice, flowdown, and missing-document questions before the terms are locked in.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <FileSearch className="h-7 w-7 text-[#FF5F1F]" />
              <h3 className="mt-4 text-sm font-black uppercase tracking-wide text-[#1A3668]">Before Pricing Risk</h3>
              <p className="mt-2 text-xs font-medium leading-relaxed text-slate-600">
                Find obligations that can affect labor, cyber, sourcing, insurance, schedule, compliance, and working capital before you price the job.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <Scale className="h-7 w-7 text-[#FF5F1F]" />
              <h3 className="mt-4 text-sm font-black uppercase tracking-wide text-[#1A3668]">Before Counsel</h3>
              <p className="mt-2 text-xs font-medium leading-relaxed text-slate-600">
                Organize the package first so attorney time can focus on the legal questions that actually require legal judgment.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <CheckCircle className="h-7 w-7 text-[#FF5F1F]" />
              <h3 className="mt-4 text-sm font-black uppercase tracking-wide text-[#1A3668]">Before Mobilizing</h3>
              <p className="mt-2 text-xs font-medium leading-relaxed text-slate-600">
                Clarify scope, documents, notice requirements, and commercial assumptions before committing people, materials, or cash.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section className="bg-[#1A3668] px-6 py-20 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#FF5F1F]">How It Works</span>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-tight">From package to better questions.</h2>
            <p className="mt-3 text-sm font-medium leading-relaxed text-slate-300">
              SubPreCheck surfaces common risk areas before you commit and organizes the issues for discussion with the prime or counsel.
            </p>
          </div>

          <div className="relative grid gap-8 md:grid-cols-4">
            <div className="absolute left-[12.5%] right-[12.5%] top-8 hidden h-px bg-white/20 md:block" />
            {processSteps.map((item, idx) => (
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

      {/* 5. WHAT SUBPRECHECK FLAGS */}
      <section className="py-20 px-6 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[10px] font-black text-[#FF5F1F] uppercase tracking-widest bg-orange-50 border border-orange-200/50 px-3 py-1 rounded-full">
            Review Scope
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A3668] uppercase tracking-tight mt-4">
            What SubPreCheck Flags
          </h2>
          <p className="text-sm text-[#596A7D] font-medium mt-2 leading-relaxed">
            SubPreCheck reviews the package for common government subcontract risk areas that can affect payment, scope, compliance, liability, and negotiation leverage.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {riskItems.map((item) => (
            <div key={item.title} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-orange-50 rounded-lg text-[#FF5F1F] shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#1A3668] uppercase tracking-wide">{item.title}</h3>
                  <p className="text-xs text-slate-600 font-medium mt-2 leading-relaxed">{item.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <FinalCTA />
    </main>
  );
}
