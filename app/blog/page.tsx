"use client";

import React from "react";
import Link from "next/link";
import { posts } from "./articleData"; 
import { ArrowUpRight } from "lucide-react";

export default function BlogDashboardPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased pb-20">
      
      {/* Dynamic Master Header Banner */}
      <div className="bg-[#1A3668] text-white py-20 px-4 sm:px-6 lg:px-8 text-center border-b-4 border-[#FF5F1F]">
        <div className="max-w-4xl mx-auto space-y-4">
          <span className="inline-block bg-[#FF5F1F] text-white text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
            SubShield Knowledge Hub
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight uppercase leading-none">
            Contract Strategy & Operational Survival Guides
          </h1>
          <p className="text-slate-300 text-sm md:text-base max-w-2xl mx-auto font-medium leading-relaxed">
            Plain-English intelligence, federal procurement breakdowns, and contract risk mitigation strategies explicitly engineered to defend subcontractor margins.
          </p>
        </div>
      </div>

      {/* Main Grid Interface */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <div 
              key={post.slug} 
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-[#FF5F1F]/40 transition duration-200 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#FF5F1F] bg-[#FF5F1F]/5 px-2.5 py-1 rounded-md">
                    {post.category}
                  </span>
                  <span className="text-[11px] text-slate-400 font-bold tracking-tight">
                    {post.date}
                  </span>
                </div>
                
                <h3 className="text-sm font-black uppercase tracking-wide leading-snug">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="rounded-sm text-[#1A3668] transition duration-150 hover:text-[#FF5F1F] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5F1F] focus-visible:ring-offset-2 group-hover:text-[#FF5F1F]"
                  >
                    {post.title}
                  </Link>
                </h3>
                
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {post.description}
                </p>
              </div>

              <div className="pt-6">
                <hr className="border-slate-100 pb-4" />
                <Link
                  href={`/blog/${post.slug}`} 
                  className="inline-flex items-center gap-1.5 rounded-sm text-xs font-black uppercase tracking-wider text-[#1A3668] hover:text-[#FF5F1F] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5F1F] focus-visible:ring-offset-2"
                >
                  Read Operational Guide <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Persistent Bottom High-Impact Acquisition Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
        <div className="bg-[#1A3668] text-white rounded-3xl p-8 md:p-12 text-center space-y-6 border-2 border-[#FF5F1F] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF5F1F]/5 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
              Stop Risking Your Retention on Predatory Contract Boilerplate
            </h2>
            <p className="text-slate-300 text-xs md:text-sm font-medium leading-relaxed">
              Isolate unfair indemnities, identify hidden liability flow-downs, and secure your payment thresholds before your crews ever set foot on site.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/pricing"
                className="w-full sm:w-auto px-6 py-3 bg-[#FF5F1F] hover:bg-[#E04F1A] text-white text-xs font-black uppercase tracking-wider rounded-xl transition shadow-md"
              >
                See Review Plans
              </Link>
              <Link
                href="/sample-report" 
                className="w-full sm:w-auto px-6 py-3 bg-transparent hover:bg-white/5 text-white border border-white/20 text-xs font-black uppercase tracking-wider rounded-xl transition"
              >
                View Sample Report
              </Link>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
