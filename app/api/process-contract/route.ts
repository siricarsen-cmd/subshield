import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { contractText } = await request.json();

    if (!contractText || !contractText.trim()) {
      return NextResponse.json({ error: "No contract text received by processor engine." }, { status: 400 });
    }

    const upperText = contractText.toUpperCase();
    const matchedRulesRegistry: any[] = [];

    // =========================================================================
    // TRAP 1: BROAD-FORM INDEMNIFICATION (ROBUST)
    // =========================================================================
    const hasIndemnityWords = [
      "INDEMNIFY", "HARMLESS", "DEFEND", "SOLE NEGLIGENCE", 
      "CONTRIBUTORY", "LIABILITY SHIFT", "INDEMNIFICATION"
    ].some(word => upperText.includes(word));

    if (hasIndemnityWords) {
      matchedRulesRegistry.push({
        id: "indemnity-risk",
        severity: "Critical",
        title: "Broad-Form Duty to Defend and Indemnify",
        ruleCode: "General Liability Risk",
        analysis: "Article 5 of this agreement forces you to defend and indemnify the Prime Contractor even if the loss or damage is partially caused by their own negligence. This strips away your standard common-law liability protections.",
        redline: "Delete the broad phrase in Article 5.2 and replace it with: 'Subcontractor's indemnification obligations under this Article shall apply only to the extent caused by the negligent acts, errors, or omissions of the Subcontractor...'",
        emailTrack: "Regarding Article 5, our insurance carrier will not allow us to accept broad-form indemnification that covers another party's negligence. We must revise this clause to limit our liability strictly to our own proportionate fault."
      });
    }

    // =========================================================================
    // TRAP 2: PAY-IF-PAID CONTINGENCY (ROBUST)
    // =========================================================================
    const hasPayIfPaidWords = [
      "PAY-IF-PAID", "CONDITION PRECEDENT", "UNTIL AND UNLESS", 
      "ACTUAL RECEIPT", "ASSUMES THE RISK OF NONPAYMENT"
    ].some(word => upperText.includes(word));

    if (hasPayIfPaidWords) {
      matchedRulesRegistry.push({
        id: "payment-risk",
        severity: "Critical",
        title: "Contingent Pay-If-Paid Condition Precedent",
        ruleCode: "Payment Terms",
        analysis: "Article 2.2 contains an absolute 'Pay-If-Paid' clause, making payment from the government a condition precedent to you getting paid. If the government delays or defaults on funding, the Prime has zero legal obligation to pay you.",
        redline: "Modify Article 2.2 to transform it into a timing mechanism: 'Payment to Subcontractor shall be made within seven (7) calendar days of Prime Contractor receiving payment from the Government...'",
        emailTrack: "We understand that payment flows from the government, but we cannot assume the structural risk of overall owner default or non-payment unrelated to our scope."
      });
    }

    // =========================================================================
    // TRAP 3: NO DAMAGES FOR DELAY (ROBUST)
    // =========================================================================
    const hasDelayWaiverWords = [
      "NO DAMAGES FOR DELAY", "SOLE REMEDY", "TIME EXTENSION ONLY", 
      "WAIVER OF OVERHEAD", "DELAY-RELATED DAMAGES", "LOST PRODUCTIVITY"
    ].some(word => upperText.includes(word));

    if (hasDelayWaiverWords) {
      matchedRulesRegistry.push({
        id: "delay-risk",
        severity: "High",
        title: "No Damages for Delay / Overhead Waiver",
        ruleCode: "Project Schedule",
        analysis: "Article 3.3 waives your right to claim extra money for field overhead, material escalation, or labor disruptions caused by project delays, even if the delay was completely caused by the Prime or the Government.",
        redline: "Revise Article 3.3 to protect your delay costs: 'Except where a delay is caused solely by force majeure events, Subcontractor shall be entitled to recover an equitable adjustment for documented extended field overhead...'",
        emailTrack: "With tight labor pools and material mobilization schedules, an extended delay out of our control creates significant unabsorbed overhead. We need to strike the blanket waiver of delay damages."
      });
    }

    // =========================================================================
    // TRAP 4: FAR 52.222-6 DAVIS-BACON MANDATES
    // =========================================================================
    if (upperText.includes("FAR 52.222-6") || upperText.includes("DAVIS-BACON") || upperText.includes("WAGE RATE") || upperText.includes("CERTIFIED PAYROLL")) {
      matchedRulesRegistry.push({
        id: "davis-bacon-risk",
        severity: "Critical",
        title: "FAR 52.222-6 Construction Wage Rate Compliance Requirements",
        ruleCode: "FAR Regulatory Flowdown",
        analysis: "This clause triggers mandatory Davis-Bacon compliance. You must pay field laborers weekly based on strict federal wage determinations and submit certified payroll reports. Misclassifying an industrial worker or technician can lead to automatic contract termination, severe back-pay penalties, or federal debarment.",
        redline: "Add a clarifying coordination section: 'Contractor shall supply the applicable Wage Determination schedule within forty-eight (48) hours of contract award. Any adjustments or classification disputes raised by the Department of Labor shall be processed cooperatively as an equitable adjustment...'",
        emailTrack: "As a specialized trade contractor, our payroll compliance relies heavily on matching the precise Department of Labor wage definitions. We require confirmation that the prime contract's exact, unedited wage scale exhibits are attached in full before execution."
      });
    }

    // =========================================================================
    // TRAP 5: LIQUIDATED DAMAGES DISPROPORTIONATE SHIFT
    // =========================================================================
    if (upperText.includes("LIQUIDATED DAMAGES") || upperText.includes("DAILY PENALTY") || upperText.includes("RE-PROCUREMENT") || upperText.includes("ASSESS PENALTIES")) {
      matchedRulesRegistry.push({
        id: "liquidated-damages-risk",
        severity: "High",
        title: "Uncapped Liquidated Damages Flowdown Liability",
        ruleCode: "Damage Allocation",
        analysis: "Article 8.1 flows down the risk of owner-imposed liquidated damages. If the overall project is delayed, the Prime can pass 100% of the daily financial penalties onto you, even if your trade scope only caused a fraction of the bottleneck. Without a protective cap, a single material delivery delay can wipe out your whole profit margin.",
        redline: "Insert a clear financial liability cap: 'Subcontractor's total cumulative liability for any liquidated damages, delay penalties, or consequential costs under this agreement shall be strictly capped at a maximum of ten percent (10%) of the total Subcontract value.'",
        emailTrack: "While we intend to strictly meet our schedule milestones, we cannot sign an open-ended agreement exposing us to uncapped daily project liquidated damages. We need to implement a standard 10% liability cap."
      });
    }

    // =========================================================================
    // TRAP 6: DFARS 252.204-7012 (CYBERSECURITY & DRAWINGS)
    // =========================================================================
    if (upperText.includes("DFARS 252.204-7012") || upperText.includes("NIST SP 800-171") || upperText.includes("CONTROLLED UNCLASSIFIED") || upperText.includes("CUI")) {
      matchedRulesRegistry.push({
        id: "dfars-cyber-risk",
        severity: "Critical",
        title: "DFARS 252.204-7012 Cybersecurity & CUI Reporting Protocol",
        ruleCode: "DoD Regulatory Mandate",
        analysis: "This clause sneaky flows down severe defense-level cybersecurity mandates. Because you handle government project facility drawings or technical specs, your business computers, mobile devices, and server drives must implement all 110 security controls of NIST SP 800-171. Furthermore, any network incident or malware discovery must be reported directly to the DoD within 72 hours, exposing your entire company infrastructure to federal audit.",
        redline: "Tailor the clause to your commercial scope: 'Subcontractor provides standard commercial trade construction installation services. The parties agree that no Controlled Unclassified Information (CUI) or covered defense data will be stored on Subcontractor's internal corporate systems, and project documents shall be accessed solely through Contractor's secured FedRAMP project management portal.'",
        emailTrack: "Regarding DFARS 252.204-7012, as a commercial supplier and subcontractor, we operate on localized security parameters. To ensure absolute regulatory alignment, we require a contractual layout stating that all project prints and tech data stay confined entirely to your secure server portal, completely isolating our internal systems from CUI compliance liability."
      });
    }

    // =========================================================================
    // TRAP 7: THE BLANKET FLOWDOWN UNENFORCEABILITY TRAP
    // =========================================================================
    if (upperText.includes("INCORPORATED BY REFERENCE IN THEIR ENTIRETY") || upperText.includes("BLANKET FLOWDOWN") || upperText.includes("MUTATIS MUTANDIS")) {
      matchedRulesRegistry.push({
        id: "blanket-flowdown-risk",
        severity: "High",
        title: "Blind Unedited Blanket Flowdown Incorporation",
        ruleCode: "Contract Structure",
        analysis: "Article 7 uses a lazy, high-risk 'Blanket Flowdown' phrase that loops hundreds of pages of unknown prime contract regulations directly into your scope. Because the document fails to explicitly tailor the definitions (swapping 'Government' for 'Prime Contractor'), this can legally force your business to perform completely irrelevant compliance reporting, audit readiness tasks, or create massive uncompensated legal exposure.",
        redline: "Add an explicit definition correction rider: 'In all FAR and DFARS clauses incorporated by reference into this Subcontract, the term 'Government' or 'Contracting Officer' shall mean 'Prime Contractor', and the term 'Contractor' shall mean 'Subcontractor', provided that such substitution is strictly limited to provisions relating to performance coordination and does not create an independent administrative reporting duty to a federal agency.'",
        emailTrack: "We take federal compliance very seriously, but blanket incorporation makes it impossible to accurately price risk. We require that all non-mandatory flowdown clauses be explicitly itemized, and we must attach a short definitions rider ensuring that administrative reporting tracks are cleanly mapped to our physical field scope."
      });
    }

    // =========================================================================
    // NEW TRAP 8: STRICT NOTICE WINDOWS FOR CHANGES (FAR 52.243-4 MAPPED)
    // =========================================================================
    if (upperText.includes("FAR 52.243-4") || upperText.includes("NOTICE OF CLAIM") || upperText.includes("WITHIN 7 CALENDAR DAYS") || upperText.includes("WRITTEN CLAIM FOR ANY EQUITABLE")) {
      matchedRulesRegistry.push({
        id: "notice-window-risk",
        severity: "High",
        title: "Hyper-Restrictive 7-Day Written Changes Claim Notice Window",
        ruleCode: "Contract Administration / Risk Window",
        analysis: "Article 4.2 implements a hyper-restrictive 7-day window to submit written equitable adjustments for scope changes, significantly front-running the standard federal 20-day baseline under FAR 52.243-4. In a fast-moving field installation project, missing this short administrative deadline results in an automatic forfeiture of your entire right to claim extra material costs or extended field overhead.",
        redline: "Restore standard federal notice safety margins: 'Subcontractor must submit a written statement or notification of a directed change within twenty (20) calendar days from the date of the written direction, or within a reasonable timeframe necessary to prevent job disruption, conforming to standard FAR 52.243-4 notice allowances.'",
        emailTrack: "While we intend to track all field directives closely, a rigid 7-day notice window creates artificial defaults on complex commercial logistics configurations. We require aligning the change order notification window to a standard, commercially viable 20 calendar days."
      });
    }

    // =========================================================================
    // NEW TRAP 9: THE PAY-WHEN-PAID INSOLVENCY TRANSITION
    // =========================================================================
    if (upperText.includes("PAY-WHEN-PAID") || upperText.includes("TIMING MECHANISM") || upperText.includes("REASONABLE TIME")) {
      matchedRulesRegistry.push({
        id: "pay-when-paid-trap",
        severity: "High",
        title: "Deceptive Pay-When-Paid Timing vs Insolvency Risk Transfer",
        ruleCode: "Payment Terms",
        analysis: "Many subcontracts disguise risk using a 'Pay-When-Paid' framework. While presented as a mere 'timing mechanism' to structure payment intervals, if it lacks explicit protective language, a prime contractor will leverage it during a dispute or bankruptcy to completely block funding. True safety requires stating that if the prime isn't paid due to reasons unrelated to your work, you still get paid within a reasonable time window.",
        redline: "Secure final payment timing protections: 'Payments otherwise due to Subcontractor shall not be delayed or conditioned upon Prime Contractor's receipt of funds from the Owner if such withholding is unrelated to Subcontractor's performance. In all events, final payment shall be disbursed to Subcontractor within ninety (90) days of project substantial completion.'",
        emailTrack: "We require clarification regarding the payment timing parameters. To protect our trade baseline, we need to ensure that administrative shortfalls or funding disputes between the owner and prime do not permanently withhold compensation for our fully compliant trade labor."
      });
    }

    // =========================================================================
    // NEW TRAP 10: FAR 52.225-1 BUY AMERICAN ACT SUPPLY DOMESTIC MANDATE
    // =========================================================================
    if (upperText.includes("FAR 52.225-1") || upperText.includes("BUY AMERICAN") || upperText.includes("DOMESTIC SOURCE") || upperText.includes("COUNTRY OF ORIGIN")) {
      matchedRulesRegistry.push({
        id: "buy-american-risk",
        severity: "Critical",
        title: "FAR 52.225-1 Buy American Act Sourcing Compliance Mandate",
        ruleCode: "Procurement / Sourcing Restriction",
        analysis: "This clause imposes massive financial and administrative compliance criteria on all physical goods, equipment, and assemblies delivered to the site. For an industrial lighting and electrical supplier, installing non-domestic components (such as foreign-manufactured lighting drivers, relays, or conduits) that fail the strict 65% domestic content cost rule constitutes a material breach of federal law, requiring costly component replacement and exposing you to civil False Claims Act liability.",
        redline: "Implement a mutual coordination and submittal safety rider: 'Subcontractor shall supply complete manufacturer country-of-origin submittals for approval. Prime Contractor's written approval of such submittals shall constitute a binding confirmation that the supplied materials satisfy all applicable contract domestic sourcing criteria, and Prime shall defend against any subsequent agency sourcing challenges.'",
        emailTrack: "Given the complex global supply lines for specialized electrical components and commercial fixtures, compliance with FAR 52.225-1 requires careful material review. We need an administrative protocol confirming that our submittal packages are formally stamped and verified by your compliance office prior to fabrication orders."
      });
    }

    return NextResponse.json({
      success: true,
      matchedRulesRegistry: matchedRulesRegistry
    }, { status: 200 });

  } catch (error: any) {
    console.error("[MATCHING ENGINE FAULT]", error);
    return NextResponse.json({ error: "Internal risk parameter matching exception." }, { status: 500 });
  }
}