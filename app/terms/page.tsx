"use client";

import React from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  EyeOff, 
  Lock, 
  Database, 
  Scale,
  HelpCircle
} from "lucide-react";

export default function DocumentTermsPage() {
  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-900 pb-16">
      
      {/* Page Header Segment */}
      <div className="bg-[#0A192F] text-white py-14 px-6 border-b border-slate-800 text-center">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-[#FF6B00] mb-2">
            <ShieldCheck className="w-6 h-6 stroke-[2]" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight">
            Document Privacy & Security
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Your Documents Deserve Careful Handling
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-8">
        
        {/* Core Introductory Context Block */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            SubShield is built to help small businesses review government teaming agreements, draft subcontracts, statements of work, and solicitation-related documents. We understand that these documents may contain sensitive business information, pricing, proposal details, company capabilities, past performance, or contract terms. This page explains how we think about document privacy, what you should upload, and how to protect sensitive information before starting a review.
          </p>
        </div>

        {/* Two-Column Matrix: What to Upload vs What Not to Upload */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card: Acceptable Intake Items */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-xs font-black text-[#0A192F] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                What You May Upload
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                SubShield is designed to review documents related to government prime/subcontractor relationships, including:
              </p>
              <ul className="text-xs text-slate-700 font-bold space-y-2 list-inside list-disc pl-1">
                <li>Government teaming agreements</li>
                <li>Draft subcontracts</li>
                <li>Statements of work (SOW)</li>
                <li>Solicitation documents</li>
                <li>Flow-down or contract requirement paths</li>
                <li>Proposal-stage commitments</li>
                <li>Revised or amended subcontract documents</li>
              </ul>
            </div>
            <p className="text-[11px] font-medium text-slate-400 italic pt-4 mt-4 border-t border-slate-50">
              The more complete your documents are, the better the review can be.
            </p>
          </div>

          {/* Card: Prohibited Upload Items */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-xs font-black text-rose-700 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <EyeOff className="w-4 h-4 text-rose-600" />
                What Not to Upload
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Please do not upload un-related or restricted organizational records, including:
              </p>
              <ul className="text-xs text-slate-700 font-bold space-y-2 list-inside list-disc pl-1">
                <li>Classified military or agency information</li>
                <li>Export-controlled information (ITAR/EAR)</li>
                <li>Password-protected or encrypted files</li>
                <li>Personal legal documents or tax returns</li>
                <li>Employment records & medical information</li>
                <li>Bank statements or general credit assets</li>
                <li>Non-procurement corporate business files</li>
              </ul>
            </div>
            <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wide pt-4 mt-4 border-t border-slate-50">
              SubShield is not intended for classified or emergency legal matters.
            </p>
          </div>

        </div>

        {/* High-Risk Redaction Warning Panel */}
        <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-xl p-6 flex items-start gap-4 shadow-sm">
          <div className="p-2 bg-amber-100 rounded-lg text-[#FF6B00] shrink-0">
            <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider">
              Redact Sensitive Information When Possible
            </h3>
            <p className="text-xs text-amber-800 leading-relaxed font-medium">
              Before uploading, we recommend removing or redacting information that is not needed for the operational review. You may want to strip out: <strong>Social Security numbers, Tax ID numbers, bank account information, personal addresses, employee details, proprietary formulas, passwords, or unrelated specific pricing segments.</strong> Do not upload anything you are not comfortable submitting for automated evaluation.
            </p>
          </div>
        </div>

        {/* Operational Mechanics Framework Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm space-y-6">
          <h3 className="text-xs font-black text-[#0A192F] uppercase tracking-wider border-b border-slate-100 pb-3">
            System Operations & Document Lifecycle Protocols
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed font-medium text-slate-600">
            <div className="space-y-1.5">
              <h4 className="font-black text-slate-800 uppercase tracking-tight">How Your Documents Are Used</h4>
              <p>Your uploaded documents are used to generate your SubShield Risk Report. The review looks for common government prime/subcontractor risk areas, such as unclear workshares, missing statement of work details, payment timing concerns, broad flow-down clauses, vague teaming promises, proposal-use concerns, and one-sided termination pathways.</p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-black text-slate-800 uppercase tracking-tight">Revised or Amended Documents</h4>
              <p>If a prime contractor sends a revised or amended document, the user may start a new review using an available credit or applicable paid review. SubShield does not currently provide an automated comparison workflow that links a revised document to a prior report or guarantees that prior concerns will be tracked as resolved, unresolved, or newly introduced.</p>
            </div>

            <div className="space-y-1.5 border-t border-slate-100 pt-4 md:pt-0 md:border-t-0">
              <h4 className="font-black text-slate-800 uppercase tracking-tight">Who Can See Your Documents</h4>
              <p>SubShield should only allow access to your documents for the purpose of processing your review, providing support, and maintaining the service. Access is strictly limited to only what is necessary to complete or support your review pipeline. SubShield does not sell your uploaded documents.</p>
            </div>

            <div className="space-y-1.5 border-t border-slate-100 pt-4 md:pt-0 md:border-t-0">
              <h4 className="font-black text-slate-800 uppercase tracking-tight">AI-Assisted Engine Limits</h4>
              <p>SubShield uses AI-assisted review to help identify common contract and business-risk issues in government prime/subcontractor documents. The AI review helps create a plain-English report, but the report is not legal advice and should not be treated as a legal opinion. For final legal decisions, you should consult a qualified attorney.</p>
            </div>
          </div>

          {/* Locked-In Document Storage Launch Policy */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-1.5">
            <h4 className="text-xs font-black text-[#0A192F] uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#FF6B00]" />
              Document Storage Launch Policy
            </h4>
            <p className="text-xs text-slate-600 italic font-medium">
              "We are careful about document handling and will publish clear retention and deletion details before accepting paid reviews."
            </p>
          </div>
        </div>

        {/* User Responsibilities & Data Governance Framework */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-medium text-slate-600">
          <div className="space-y-1.5">
            <h4 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-slate-400" />
              User Responsibility
            </h4>
            <p>You are responsible for deciding what documents and information to upload. Before submitting, ensure you have the absolute authorization right to upload it, that it relates to your review parameters, and that sensitive unnecessary lines have been fully omitted.</p>
          </div>

          <div className="space-y-1.5 border-t border-slate-100 pt-4 md:pt-0 md:border-t-0 md:border-l md:border-slate-100 md:pl-6">
            <h4 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              Payment Information
            </h4>
            <p>Payment details are processed exclusively through a secure third-party billing gateway provider, such as Stripe. SubShield does not directly store, capture, or witness your full credit card digits. Transactions are bound solely to the secure financial network's practices.</p>
          </div>

          <div className="space-y-1.5 border-t border-slate-100 pt-4 md:pt-0 md:border-t-0 md:border-l md:border-slate-100 md:pl-6">
            <h4 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              Inquiry Controls
            </h4>
            <p>If you are unsure whether to process a specific agreement scope, you may contact SubShield before initiating. For general questions, do not send confidential contract text metrics through the public contact form block—a basic description is sufficient.</p>
          </div>
        </div>

        {/* Core Mandatory Legal Disclaimer Callout */}
        <div className="border-l-4 border-[#FF6B00] bg-slate-900 text-slate-300 p-5 rounded-r-xl shadow-sm space-y-1">
          <span className="text-[10px] font-black tracking-widest text-[#FF6B00] uppercase block">
            CRITICAL REGULATORY COMPLIANCE FRAMEWORD
          </span>
          <h4 className="text-xs font-bold text-white uppercase tracking-tight">
            Important Legal Note: Toolkit, Not a Law Firm
          </h4>
          <p className="text-xs leading-relaxed text-justify text-slate-400 font-medium normal-case">
            SubShield is an automated document analysis utility designed for educational and contract preparation purposes only. SubShield does not provide legal advice, legal opinions, or formal legal counsel. The automated risk alerts and redline alternatives generated by this platform are designed to help small business owners identify standard commercial risk factors before engaging with prime contractors or legal professionals. Using this software does not create an attorney-client relationship. SubShield strongly recommends that all final contract documents be reviewed by a qualified construction attorney licensed in your jurisdiction prior to execution.
          </p>
        </div>

        {/* Bottom Closing CTA Block */}
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4 shadow-sm">
          <div className="space-y-1">
            <h3 className="text-base font-black text-[#0A192F] uppercase tracking-tight">
              Review the Risk With Care
            </h3>
            <p className="text-xs text-slate-500 font-medium max-w-xl mx-auto leading-relaxed">
              SubShield is designed to help you better understand government prime/subcontractor documents before signing or continuing negotiations. Remove sensitive data paths and ensure suitability before submitting.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/dashboard" 
              className="w-full sm:w-auto bg-[#FF6B00] text-white text-xs font-black uppercase tracking-wider px-8 py-3.5 rounded-xl hover:bg-[#0A192F] transition-all shadow-sm text-center"
            >
              Start Review
            </Link>
            <Link 
              href="/contact" 
              className="w-full sm:w-auto border border-slate-200 bg-white text-slate-700 text-xs font-black uppercase tracking-wider px-8 py-3.5 rounded-xl hover:border-[#0A192F] transition-all text-center"
            >
              Contact Us
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}