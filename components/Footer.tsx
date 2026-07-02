import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#596A7D] text-slate-100 py-12 px-6 border-t border-slate-600">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        
        {/* BRAND IDENTIFIER */}
        <div className="col-span-1 md:col-span-2 space-y-3">
          <Link href="/" className="flex items-center group">
            <img 
              src="/Clean-Logo.png" 
              alt="SubShield Logo" 
              className="h-10 w-auto object-contain brightness-0 invert opacity-90 transition-opacity group-hover:opacity-100"
            />
          </Link>
          <p className="text-xs text-slate-200 max-w-sm leading-relaxed font-medium pt-1">
            Government subcontracting risk review for small businesses. Spot risks early, ask better questions, and protect your margins.
          </p>
        </div>

        {/* INTERFACE PRODUCT UTILITIES */}
        <div>
          <h4 className="text-white text-xs font-black uppercase tracking-widest mb-4">Product</h4>
          <ul className="space-y-2 text-xs font-bold text-slate-200">
            <li><Link href="/pricing" className="hover:text-[#FF5F1F] transition-colors">Pricing</Link></li>
            <li><Link href="/sample-report" className="hover:text-[#FF5F1F] transition-colors">Sample Report</Link></li>
            <li><Link href="/about" className="hover:text-[#FF5F1F] transition-colors">About</Link></li>
            <li><Link href="/contact" className="hover:text-[#FF5F1F] transition-colors">Contact</Link></li>
          </ul>
        </div>

        {/* ADMINISTRATIVE UTILITIES */}
        <div>
          <h4 className="text-white text-xs font-black uppercase tracking-widest mb-4">Resources</h4>
          <ul className="space-y-2 text-xs font-bold text-slate-200">
            <li><Link href="/blog" className="hover:text-[#FF5F1F] transition-colors">Blog</Link></li>
            <li><Link href="/privacy" className="hover:text-[#FF5F1F] transition-colors">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-[#FF5F1F] transition-colors">Terms of Use</Link></li>
          </ul>
        </div>

      </div>

      {/* METADATA BLOCK & REQUISITE RECOURSE LIABILITY SHIELD */}
      <div className="max-w-7xl mx-auto border-t border-slate-600 pt-8 flex flex-col md:flex-row justify-between items-center text-[11px] font-bold text-slate-300 space-y-3 md:space-y-0">
        <div>
          &copy; {new Date().getFullYear()} SubShield. All rights reserved.
        </div>
        <div className="flex space-x-6">
          <Link href="/privacy" className="hover:text-[#FF5F1F] transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-[#FF5F1F] transition-colors">Terms of Use</Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-6 text-[10px] text-slate-300/80 leading-relaxed font-medium border-t border-slate-600/50 pt-4">
        <strong>Disclaimer:</strong> SubShield is a contract risk-screening and document-organization tool. SubShield is not a law firm and does not provide legal advice, legal opinions, or legal representation. Reports are for informational and preparation purposes only. Contractors should consult qualified legal counsel before signing or relying on any subcontract, teaming agreement, or related government contract document.
      </div>
    </footer>
  );
}