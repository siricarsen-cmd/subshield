import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-white text-slate-900 border-b border-slate-100 sticky top-0 z-50 shadow-sm">
      {/* Container height is kept at h-20 to keep standard spacing alignment intact */}
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-20">
        
        {/* BRAND LOGO AREA - BUMPED DISPLAY SIZE FROM h-12 TO h-16 */}
        <Link href="/" className="flex items-center h-full">
          <img 
            src="/Clean-Logo.png" 
            alt="SubShield Logo" 
            className="h-16 w-auto object-contain transition-transform group-hover:scale-102"
          />
        </Link>

        {/* HIGH-INTENT NAVIGATION LINKS */}
        <div className="hidden md:flex space-x-8 items-center text-sm font-bold uppercase tracking-wider text-[#596A7D]">
          <Link href="/how-it-works" className="hover:text-[#FF5F1F] transition-colors">How It Works</Link>
          <Link href="/sample-report" className="hover:text-[#FF5F1F] transition-colors">Sample Report</Link>
          <Link href="/pricing" className="hover:text-[#FF5F1F] transition-colors">Pricing</Link>
          <Link href="/about" className="hover:text-[#FF5F1F] transition-colors">About</Link>
          <Link href="/contact" className="hover:text-[#FF5F1F] transition-colors">Contact</Link>
        </div>

        {/* ACTIONS AREA: START REVIEW & SIGN IN */}
        <div className="flex items-center gap-6">
          <Link href="/intake" className="bg-[#FF5F1F] hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded text-xs uppercase tracking-widest transition-all shadow-sm block text-center">
            Start Review
          </Link>
          {/* Option A: The Navy Outline Button */}
          <Link href="/login" className="border-2 border-[#1A3668] text-[#1A3668] hover:bg-[#1A3668] hover:text-white font-bold px-5 py-2 rounded text-xs uppercase tracking-widest transition-all shadow-sm text-center">
            Sign In
          </Link>
        </div>

      </div>
    </nav>
  );
}