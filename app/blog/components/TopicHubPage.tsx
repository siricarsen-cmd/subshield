import { ArrowLeft, BookOpenCheck, ArrowUpRight } from "lucide-react";
import { hubPages, type HubSlug } from "../hubData";

export function TopicHubPage({ slug }: { slug: HubSlug }) {
  const page = hubPages[slug];
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased pb-20">
      <div className="bg-[#1A3668] text-white py-16 px-4 sm:px-6 lg:px-8 border-b-4 border-[#FF5F1F]">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a href="/blog" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF5F1F] hover:text-white transition"><ArrowLeft className="w-4 h-4" /> Back to Knowledge Hub</a>
            <span className="self-start rounded-full border border-orange-300/60 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#FF5F1F]">{page.category}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight">{page.title}</h1>
          <p className="text-slate-300 text-sm md:text-base max-w-3xl font-medium leading-relaxed">{page.dek}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 grid grid-cols-1 lg:grid-cols-4 gap-8">
        <article className="lg:col-span-3 space-y-8">
          <div className="space-y-4 text-sm text-slate-700 leading-relaxed font-medium">
            {page.intro.map((p) => <p key={p}>{p}</p>)}
          </div>

          {page.groups.map((group) => (
            <section key={group.heading} className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-lg font-black text-[#1A3668] uppercase tracking-wide flex items-center gap-2"><BookOpenCheck className="w-5 h-5 text-[#FF5F1F]" /> {group.heading}</h2>
                {group.intro && <p className="text-sm text-slate-600 leading-relaxed">{group.intro}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.items.map((item) => (
                  <div key={`${group.heading}-${item.label}`} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    {item.href ? (
                      <a href={item.href} className="inline-flex items-start gap-1.5 text-sm font-black text-[#1A3668] hover:text-[#FF5F1F] hover:underline transition">
                        <span>{item.label}</span><ArrowUpRight className="w-4 h-4 mt-0.5 shrink-0" />
                      </a>
                    ) : (
                      <h3 className="text-sm font-black text-[#1A3668]">{item.label}</h3>
                    )}
                    <p className="mt-2 text-xs text-slate-600 leading-relaxed font-medium">{item.description}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </article>

        <aside className="space-y-6">
          <div className="bg-white border-2 border-[#FF5F1F] rounded-xl p-6 shadow-md space-y-4 sticky top-24">
            <h3 className="text-sm font-black text-[#1A3668] uppercase tracking-wide">{page.ctaTitle}</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">{page.ctaBody}</p>
            <a href="/sample-report" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-white bg-[#FF5F1F] hover:bg-[#E04F1A] rounded-lg transition shadow-sm">View Sample Report</a>
            <a href="/pricing" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-[#1A3668] border border-slate-200 hover:border-[#FF5F1F] rounded-lg transition">See Review Plans</a>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-[11px] text-slate-500 leading-relaxed">General educational information only. Federal subcontract rights and obligations depend on the actual solicitation, prime contract, subcontract, incorporated documents, governing law, and current regulations. SubPreCheck is not a law firm and does not provide legal advice.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
