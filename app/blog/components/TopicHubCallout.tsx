import { ArrowUpRight } from "lucide-react";
import { topicHubForCategory } from "../topicHubLinks";

export function TopicHubCallout({ category }: { category: string }) {
  const hub = topicHubForCategory(category);
  return (
    <div className="bg-[#1A3668]/5 border border-[#1A3668]/15 rounded-xl p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-[#596A7D]">Explore the full topic</p>
      <a href={hub.href} className="mt-1 inline-flex items-center gap-1.5 text-xs font-black text-[#1A3668] hover:text-[#FF5F1F] hover:underline transition">
        {hub.label} <ArrowUpRight className="w-4 h-4" />
      </a>
    </div>
  );
}
