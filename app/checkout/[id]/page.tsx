"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

export default function CheckoutCatchAllPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string; // Captures "annual-pack" or whatever tier was clicked

  useEffect(() => {
    async function processSimulatedStripeHandshake() {
      // Figure out what package they clicked based on the URL bar
      const isAnnual = id === "annual-pack" || id?.includes("annual");
      const tierName = isAnnual ? "Annual Growth Pack" : "Single Project Scan";
      const creditsToAward = isAnnual ? 5 : 1;

      // 1. Update the user's permanent account balance state in browser memory
      const sessionActive = localStorage.getItem("subshield_session");
      if (sessionActive) {
        try {
          const currentSession = JSON.parse(sessionActive);
          currentSession.credits = (currentSession.credits || 0) + creditsToAward;
          currentSession.isPaid = true;
          currentSession.tier = tierName;
          localStorage.setItem("subshield_session", JSON.stringify(currentSession));
        } catch (e) {
          console.error("Error writing payment metadata to session:", e);
        }
      }

      // 2. Hold the screen for a brief second so they see the secure transaction animation
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 3. Send them straight to the dashboard with the success triggers in the address link
      router.push(`/dashboard?payment_success=true&credits=${creditsToAward}`);
    }

    if (id) {
      processSimulatedStripeHandshake();
    }
  }, [id, router]);

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="p-8 bg-white border border-slate-200 rounded-xl shadow-sm max-w-md space-y-4">
        <div className="animate-spin inline-flex items-center justify-center rounded-full border-4 border-t-[#FF5F1F] border-slate-100 w-12 h-12 mx-auto">
          <ShieldCheck className="w-5 h-5 text-[#1A3668]" />
        </div>
        <div>
          <h4 className="text-sm font-black text-[#1A3668] uppercase tracking-wide">Securing Stripe Node Connection</h4>
          <p className="text-xs text-[#596A7D] font-medium mt-1 leading-relaxed">
            Authorizing secure credit card token alignment fields. Preparing your SubShield risk processing credits...
          </p>
        </div>
      </div>
    </div>
  );
}