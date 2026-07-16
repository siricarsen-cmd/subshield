import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="bg-white min-h-screen text-slate-900 font-sans">
      <div className="max-w-7xl mx-auto px-6 py-16">
        
        <div className="border-b border-slate-100 pb-8 mb-12">
          <h1 className="text-4xl font-black tracking-tight text-[#1A3668] uppercase">
            Contact Us
          </h1>
          <p className="text-base text-[#596A7D] font-bold mt-2 tracking-wide uppercase">
            Public Contact Workflow Coming Soon
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          <div className="lg:col-span-5 space-y-8">
            
            <div className="space-y-3">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#1A3668]">
                Before You Send Sensitive Information
              </h3>
              <p className="text-sm text-[#596A7D] leading-relaxed font-medium">
                Please do not send confidential, proprietary, or sensitive contract details through public contact channels. When SubShield’s contact workflow becomes available, a brief summary of a general question will be enough. Submit supported review documents only through your account dashboard.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#1A3668]">
                Future Contact Topics
              </h3>
              <ul className="space-y-2 text-sm text-[#596A7D] font-bold">
                <li className="flex items-start">
                  <span className="text-[#FF5F1F] mr-2 mt-0.5">•</span> 
                  <span>You are not sure whether your document fits SubShield</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#FF5F1F] mr-2 mt-0.5">•</span> 
                  <span>You have questions about our $149.99 Single Review Cycle, $249 monthly Active Bidder Plan, or $1,999 Enterprise Credit Pack</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#FF5F1F] mr-2 mt-0.5">•</span> 
                  <span>You have questions before starting a new review for a revised or updated document</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#FF5F1F] mr-2 mt-0.5">•</span> 
                  <span>You are encountering a document uploading or portal processing issue</span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-5 rounded-xl space-y-2.5">
              <h4 className="text-xs font-black uppercase tracking-widest text-[#1A3668]">
                Service Disclaimer
              </h4>
              <p className="text-xs text-[#596A7D] leading-relaxed font-medium">
                SubShield is an AI-assisted contract risk-screening tool, not a law firm. Once the contact workflow is available, it will support questions about platform features, supported document intake, and credit billing. SubShield cannot provide legal advice, contract interpretations, or legal opinions.
              </p>
            </div>

          </div>

          <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-2xl p-8 shadow-sm">
            <div className="h-full min-h-72 flex flex-col items-center justify-center text-center space-y-4 max-w-xl mx-auto">
              <span className="text-[10px] font-black text-[#FF5F1F] uppercase tracking-widest bg-orange-50 border border-orange-200 px-3 py-1 rounded-full">
                Not Yet Available
              </span>
              <h2 className="text-2xl font-black text-[#1A3668] uppercase tracking-tight">
                Contact Requests Are Not Being Accepted Yet
              </h2>
              <p className="text-sm text-[#596A7D] leading-relaxed font-medium">
                SubShield has not launched its public contact workflow. There is no message form on this page, and no information entered here is collected or delivered. This page will be updated when the contact workflow is ready.
              </p>
              <p className="text-xs text-slate-500 leading-relaxed font-bold">
                Do not send sensitive contract details through public contact channels.
              </p>
            </div>
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
