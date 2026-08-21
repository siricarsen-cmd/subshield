"use client";

import React from "react";
import { ArrowLeft, CalendarClock, Construction, FileSignature, Scale } from "lucide-react";

export default function MillerActPaymentBondClaimsArticle() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased pb-20">
      <div className="bg-[#1A3668] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a href="/blog" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF5F1F] hover:text-white transition">
              <ArrowLeft className="w-4 h-4" /> Back to Knowledge Hub
            </a>
            <span className="self-start rounded-full border border-orange-300/60 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#FF5F1F]">
              Federal Construction Payment
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight">
            Miller Act Payment Bond Claims: Deadlines Federal Construction Subcontractors Should Know
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl font-medium">
            Federal construction payment-bond rights can be valuable, but the timing, tier, notice, and waiver rules need to be identified early.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 text-sm text-slate-700 leading-relaxed font-medium">
          <p>
            A subcontractor on a federal construction project generally cannot use a state mechanics lien against federal property. The Miller Act addresses that gap by requiring payment protection on qualifying federal public construction work and by creating a federal payment-bond remedy for certain unpaid labor and material claims.
          </p>
          <p>
            The important point is not simply that a bond exists. The claimant’s contract tier, last date of labor or material, notice history, and filing date can determine whether the remedy remains available.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3 flex items-center gap-2">
            <Construction className="w-5 h-5 text-[#FF5F1F]" /> When is a Miller Act payment bond required?
          </h2>
          <p>
            Under 40 U.S.C. § 3131, before a federal contract of more than $100,000 is awarded for construction, alteration, or repair of a public building or public work, the contractor generally must furnish a performance bond and a payment bond. Other statutes can adjust the threshold for particular programs, so the actual solicitation and bond requirement should still be checked.
          </p>
          <p className="text-xs text-slate-500">
            Official source: <a href="https://uscode.house.gov/view.xhtml?req=(title:40%20section:3131%20edition:prelim)" className="text-[#1A3668] font-bold hover:underline">40 U.S.C. § 3131</a>.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3 flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-[#FF5F1F]" /> The 90-day point matters—but not in only one way
          </h2>
          <p>
            Section 3133 provides that a person furnishing labor or material on bonded work who has not been paid in full within 90 days after the last labor was performed or material was furnished for the claim may bring a civil action on the payment bond.
          </p>
          <p>
            A lower-tier claimant that has a direct contract with a subcontractor but no contractual relationship with the prime contractor has an additional notice requirement: written notice to the prime contractor within 90 days from the claimant’s last labor or material for the claim. The statute specifies that the notice identify the amount claimed with substantial accuracy and the party for whom the work or material was provided.
          </p>
          <p>
            Do not turn “90 days” into a generic rule for every claimant. A direct subcontractor of the bonded prime and a lower-tier subcontractor do not have identical statutory notice requirements.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3 flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#FF5F1F]" /> The suit deadline is different from the 90-day rule
          </h2>
          <p>
            The Miller Act also sets an outside deadline for bringing the payment-bond action: no later than one year after the day on which the claimant performed the last labor or supplied the last material for the claim. That is a separate deadline from the 90-day nonpayment and lower-tier notice provisions.
          </p>
          <p>
            If a payment dispute is approaching either deadline, this is not a good time to rely on an informal promise that a check is coming soon. The exact dates and claimant tier should be organized for qualified construction counsel.
          </p>
          <p className="text-xs text-slate-500">
            Official source: <a href="https://uscode.house.gov/view.xhtml?edition=prelim&req=granuleid:USC-prelim-title40-section3133" className="text-[#1A3668] font-bold hover:underline">40 U.S.C. § 3133, Rights of persons furnishing labor or material</a>.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3 flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-[#FF5F1F]" /> You can request a certified copy of the bond
          </h2>
          <p>
            Section 3133 also provides a mechanism for a person that supplied labor or material and remains unpaid to apply to the contracting agency for a certified copy of the payment bond and the underlying contract, subject to the statute’s affidavit and fee requirements. That can be important when the subcontract file does not contain the surety or bond information.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3">A pre-work waiver has limits under the statute</h2>
          <p>
            The Miller Act states that a waiver of the right to bring a civil action on the required payment bond is void unless the waiver is in writing, signed by the person whose right is waived, and executed after that person furnished labor or material for the project. That statutory rule is worth separating from other releases or payment waivers that may appear in subcontract documents.
          </p>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
            <h3 className="text-xs font-black text-[#1A3668] uppercase tracking-wide">Build the claim file early</h3>
            <ul className="list-disc pl-5 space-y-2 text-xs text-slate-600">
              <li>Prime contract and payment-bond information.</li>
              <li>Your subcontract and any lower-tier agreements.</li>
              <li>Last dates of labor and material tied to the unpaid amount.</li>
              <li>Invoices, delivery records, time records, and acceptance evidence.</li>
              <li>Any 90-day notice, delivery proof, and payment correspondence.</li>
              <li>Change orders and disputed-scope documentation.</li>
            </ul>
          </div>

          <p>
            For the broader payment picture, see <a href="/blog/federal-subcontractor-not-paid-prime-contractor" className="text-[#FF5F1F] font-bold hover:underline">what to check when a federal prime has not paid</a> and <a href="/blog/prompt-payment-act-federal-subcontractors" className="text-[#FF5F1F] font-bold hover:underline">how the Prompt Payment Act affects subcontractors</a>.
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-white border-2 border-[#FF5F1F] rounded-xl p-6 shadow-md space-y-4 sticky top-6">
            <h3 className="text-sm font-black text-[#1A3668] uppercase tracking-wide">Do Not Lose the Dates</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              SubPreCheck can help organize the subcontract, payment terms, notice language, change history, and missing documents before the package goes to qualified counsel.
            </p>
            <a href="/sample-report" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-white bg-[#FF5F1F] hover:bg-[#E04F1A] rounded-lg transition shadow-sm">View Sample Report</a>
            <a href="/pricing" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-[#1A3668] border border-slate-200 hover:border-[#FF5F1F] rounded-lg transition">See Review Plans</a>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              General educational information only. Miller Act coverage and deadlines can be fact-specific, and missing a statutory deadline can affect rights. Consult qualified counsel for an actual claim.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
