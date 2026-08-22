import { ArrowLeft, BookOpenCheck } from "lucide-react";
import { batch4Articles, type Batch4Slug } from "../batch4Data";
import { TopicHubCallout } from "./TopicHubCallout";

export function Batch4ArticlePage({ slug }: { slug: Batch4Slug }) {
  const article = batch4Articles[slug];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased pb-20">
      <div className="bg-[#1A3668] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a href="/blog" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF5F1F] hover:text-white transition"><ArrowLeft className="w-4 h-4" /> Back to Knowledge Hub</a>
            <span className="self-start rounded-full border border-orange-300/60 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#FF5F1F]">{article.category}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight">{article.title}</h1>
          <p className="text-slate-300 text-sm max-w-2xl font-medium">{article.dek}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <article className="lg:col-span-2 space-y-6 text-sm text-slate-700 leading-relaxed font-medium">
          {article.intro.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          {article.sections.map((section) => (
            <section key={section.heading} className="space-y-3">
              <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3 flex items-center gap-2"><BookOpenCheck className="w-5 h-5 text-[#FF5F1F]" /> {section.heading}</h2>
              {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.bullets && <ul className="list-disc pl-5 space-y-2">{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}
              {section.source && <p className="text-xs text-slate-500">Official source: <a href={section.source.url} className="text-[#1A3668] font-bold hover:underline">{section.source.label}</a>.</p>}
            </section>
          ))}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
            <h3 className="text-xs font-black text-[#1A3668] uppercase tracking-wide">Related SubPreCheck Guides</h3>
            <ul className="space-y-2 text-xs">{article.related.map((link) => <li key={link.href}><a href={link.href} className="text-[#FF5F1F] font-bold hover:underline">{link.label}</a></li>)}</ul>
          </div>
          <TopicHubCallout category={article.category} />
        </article>

        <aside className="space-y-6">
          <div className="bg-white border-2 border-[#FF5F1F] rounded-xl p-6 shadow-md space-y-4 sticky top-6">
            <h3 className="text-sm font-black text-[#1A3668] uppercase tracking-wide">{article.ctaTitle}</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">{article.ctaBody}</p>
            <a href="/sample-report" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-white bg-[#FF5F1F] hover:bg-[#E04F1A] rounded-lg transition shadow-sm">View Sample Report</a>
            <a href="/pricing" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-[#1A3668] border border-slate-200 hover:border-[#FF5F1F] rounded-lg transition">See Review Plans</a>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
            <p className="text-[11px] text-slate-500 leading-relaxed">General educational information only. Federal subcontract rights and obligations depend on the actual solicitation, prime contract, subcontract, incorporated documents, governing law, and current regulations. SubPreCheck is not a law firm and does not provide legal advice.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
