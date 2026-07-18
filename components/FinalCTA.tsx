import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function FinalCTA() {
  return (
    <section className="bg-[#1A3668] text-white py-16 px-6 border-t border-slate-800">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
          Ready to Review Before You Commit?
        </h2>

        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Compare plans, choose the review option that fits your current package, and organize the issues before final legal review.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/pricing"
            className="bg-[#FF5F1F] text-white px-8 py-4 rounded-xl hover:bg-orange-600 transition-all font-black text-xs sm:text-sm tracking-widest uppercase inline-flex items-center justify-center gap-2 shadow-sm"
          >
            See Plans <ArrowRight size={16} />
          </Link>
          <Link 
            href="/sample-report" 
            className="bg-transparent text-white border-2 border-slate-500 px-8 py-4 rounded-xl hover:bg-white/5 transition-all font-black text-xs sm:text-sm tracking-widest uppercase inline-flex items-center justify-center gap-2"
          >
            View Sample Report
          </Link>
        </div>
      </div>
    </section>
  );
}
