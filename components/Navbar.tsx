"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const mobileNavigationLinks = [
  { href: "/sample-report", label: "Sample Report" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
  { href: "/login", label: "Sign In" },
] as const;

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white text-slate-900 border-b border-slate-100 sticky top-0 z-50 shadow-sm print:hidden">
      {/* Container height is kept at h-20 to keep standard spacing alignment intact */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 flex justify-between items-center h-20">
        
        {/* BRAND LOGO AREA */}
        <Link href="/" className="flex min-w-0 items-center h-full">
          <img 
            src="/Clean-Logo.png" 
            alt="SubShield Logo" 
            className="h-9 w-auto object-contain transition-transform group-hover:scale-102 min-[375px]:h-12 md:h-16"
          />
        </Link>

        {/* HIGH-INTENT NAVIGATION LINKS */}
        <div className="hidden md:flex space-x-8 items-center text-sm font-bold uppercase tracking-wider text-[#596A7D]">
          <Link href="/sample-report" className="hover:text-[#FF5F1F] transition-colors">Sample Report</Link>
          <Link href="/pricing" className="hover:text-[#FF5F1F] transition-colors">Pricing</Link>
          <Link href="/about" className="hover:text-[#FF5F1F] transition-colors">About</Link>
          <Link href="/faq" className="hover:text-[#FF5F1F] transition-colors">FAQ</Link>
          <Link href="/contact" className="hover:text-[#FF5F1F] transition-colors">Contact</Link>
        </div>

        {/* ACTIONS AREA: SEE PLANS, MOBILE MENU & SIGN IN */}
        <div className="flex shrink-0 items-center gap-2 md:gap-6">
          <Link href="/pricing" className="bg-[#FF5F1F] hover:bg-orange-600 text-white font-bold px-2 py-2.5 rounded text-xs uppercase tracking-widest transition-all shadow-sm block text-center min-[375px]:px-3 md:px-5">
            See Plans
          </Link>
          <button
            type="button"
            onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="inline-flex h-10 w-10 items-center justify-center rounded border-2 border-[#1A3668] text-[#1A3668] hover:bg-[#1A3668] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5F1F] focus-visible:ring-offset-2 md:hidden"
          >
            {isMenuOpen ? (
              <X aria-hidden="true" className="h-5 w-5" />
            ) : (
              <Menu aria-hidden="true" className="h-5 w-5" />
            )}
          </button>
          <Link href="/login" className="hidden border-2 border-[#1A3668] text-[#1A3668] hover:bg-[#1A3668] hover:text-white font-bold px-5 py-2 rounded text-xs uppercase tracking-widest transition-all shadow-sm text-center md:block">
            Sign In
          </Link>
        </div>

      </div>

      {isMenuOpen && (
        <div id="mobile-navigation" className="border-t border-slate-100 bg-white md:hidden">
          <div className="max-w-7xl mx-auto flex flex-col px-3 py-3 sm:px-6">
            {mobileNavigationLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setIsMenuOpen(false)}
                className="rounded px-3 py-3 text-sm font-bold uppercase tracking-wider text-[#596A7D] hover:bg-slate-50 hover:text-[#FF5F1F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5F1F] focus-visible:ring-inset"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
