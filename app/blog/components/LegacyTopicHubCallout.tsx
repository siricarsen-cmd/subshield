"use client";

import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { posts } from "../postRegistry";
import { batch4Posts } from "../batch4Data";
import { batch5Posts } from "../batch5Data";
import { batch6Posts } from "../batch6Data";
import { batch7Posts } from "../batch7Data";
import { topicHubForCategory } from "../topicHubLinks";

const rendererManagedSlugs = new Set([
  ...batch4Posts.map((post) => post.slug),
  ...batch5Posts.map((post) => post.slug),
  ...batch6Posts.map((post) => post.slug),
  ...batch7Posts.map((post) => post.slug),
]);

export function LegacyTopicHubCallout() {
  const pathname = usePathname();
  if (!pathname.startsWith("/blog/") || pathname === "/blog/") return null;

  const slug = pathname.slice("/blog/".length).replace(/\/$/, "");
  const post = posts.find((candidate) => candidate.slug === slug);
  if (!post || post.category === "Topic Hub" || post.category === "Resource" || rendererManagedSlugs.has(slug)) return null;

  const hub = topicHubForCategory(post.category);
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <div className="bg-[#1A3668]/5 border border-[#1A3668]/15 rounded-xl p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#596A7D]">Explore the full topic</p>
        <a href={hub.href} className="mt-1 inline-flex items-center gap-1.5 text-xs font-black text-[#1A3668] hover:text-[#FF5F1F] hover:underline transition">
          {hub.label} <ArrowUpRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
