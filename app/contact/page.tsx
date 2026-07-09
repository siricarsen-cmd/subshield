"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    reason: "Question before starting a review",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form Submitted:", formData);
    alert("Thank you! Your message has been sent.");
  };

  return (
    <div className="bg-white min-h-screen text-slate-900 font-sans">
      <div className="max-w-7xl mx-auto px-6 py-16">
        
        <div className="border-b border-slate-100 pb-8 mb-12">
          <h1 className="text-4xl font-black tracking-tight text-[#1A3668] uppercase">
            Contact Us
          </h1>
          <p className="text-base text-[#596A7D] font-bold mt-2 tracking-wide uppercase">
            Questions Before You Start?
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          <div className="lg:col-span-5 space-y-8">
            
            <div className="space-y-3">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#1A3668]">
                Before You Send Sensitive Information
              </h3>
              <p className="text-sm text-[#596A7D] leading-relaxed font-medium">
                Please do not include confidential, proprietary, or sensitive contract details in this general contact form. If you start a SubShield Review Cycle, you will be able to securely upload your complete documents through your private client portal. For general inquiries, a brief summary of your question is enough.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#1A3668]">
                Common Reasons to Contact Us
              </h3>
              <ul className="space-y-2 text-sm text-[#596A7D] font-bold">
                <li className="flex items-start">
                  <span className="text-[#FF5F1F] mr-2 mt-0.5">•</span> 
                  <span>You are not sure whether your document fits SubShield</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#FF5F1F] mr-2 mt-0.5">•</span> 
                  <span>You have questions about our $149.99 Single Review Cycle, $249 Active Bidder Plan, or Enterprise Plan</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#FF5F1F] mr-2 mt-0.5">•</span> 
                  <span>You have questions before starting a new review for a revised or updated document</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#FF5F1F] mr-2 mt-0.5">•</span> 
                  <span>You are encountering an asset uploading or portal processing issue</span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-5 rounded-xl space-y-2.5">
              <h4 className="text-xs font-black uppercase tracking-widest text-[#1A3668]">
                Strict Operational Disclaimer
              </h4>
              <p className="text-xs text-[#596A7D] leading-relaxed font-medium">
                SubShield is an automated compliance utility, not a law firm. We can answer questions regarding platform features, document ingestion capabilities, and credit billing configurations. We cannot provide legal advice, contract interpretations, or legal opinions through this form.
              </p>
            </div>

          </div>

          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <h3 className="text-lg font-black text-[#1A3668] uppercase tracking-wide mb-6">
              Send a Message
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#596A7D] mb-2">
                  Full Name
                </label>
                <input 
                  type="text"
                  required
                  className="w-full border border-slate-200 bg-slate-50/50 rounded-lg p-3 text-sm font-medium focus:outline-none focus:border-[#FF5F1F] focus:bg-white transition-all"
                  placeholder="e.g., John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#596A7D] mb-2">
                  Email Address
                </label>
                <input 
                  type="email"
                  required
                  className="w-full border border-slate-200 bg-slate-50/50 rounded-lg p-3 text-sm font-medium focus:outline-none focus:border-[#FF5F1F] focus:bg-white transition-all"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#596A7D] mb-2">
                  What can we help with?
                </label>
                <select 
                  className="w-full border border-slate-200 bg-slate-50/50 rounded-lg p-3 text-sm font-bold text-[#596A7D] focus:outline-none focus:border-[#FF5F1F] focus:bg-white transition-all"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                >
                  <option>Question before starting a review</option>
                  <option>Help with an existing review</option>
                  <option>Question about document types</option>
                  <option>Question about pricing</option>
                  <option>General question</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#596A7D] mb-2">
                  Your Message
                </label>
                <textarea 
                  rows={5}
                  required
                  className="w-full border border-slate-200 bg-slate-50/50 rounded-lg p-3 text-sm font-medium focus:outline-none focus:border-[#FF5F1F] focus:bg-white transition-all resize-none"
                  placeholder="Describe how we can support your business..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-[#FF5F1F] hover:bg-orange-600 text-white font-bold py-3.5 px-6 rounded-xl text-sm uppercase tracking-widest transition-all shadow-sm mt-2"
              >
                Submit Request
              </button>

            </form>
          </div>

        </div>

        {/* INLINED FINAL CTA */}
        <div className="border-t border-slate-200 mt-16 pt-16 text-center max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl md:text-4xl font-black text-[#1A3668] uppercase tracking-tight leading-tight">
            Ready to review the package before you commit?
          </h2>
          <p className="text-base text-[#596A7D] font-medium leading-relaxed max-w-2xl mx-auto">
            Upload your prime-provided subcontract, teaming, or bid package. SubShield will flag common risk areas, missing documents, and negotiation questions so you can go back to the prime before final attorney review.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link 
              href="/pricing"
              className="bg-[#FF5F1F] text-white px-8 py-4 rounded-xl hover:bg-[#1A3668] transition-all font-black text-xs sm:text-sm tracking-widest uppercase inline-flex items-center justify-center shadow-sm"
            >
              See Plans
            </Link>
            <Link 
              href="/sample-report"
              className="bg-white text-[#1A3668] hover:bg-slate-50 border-2 border-slate-200 px-8 py-4 rounded-xl transition-all font-black text-xs sm:text-sm tracking-widest uppercase inline-flex items-center justify-center shadow-sm"
            >
              View Sample Report
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}