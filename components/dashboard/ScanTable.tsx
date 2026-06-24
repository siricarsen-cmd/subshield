"use client";

import React from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

const mockHistoricalRows = [
  { id: "101", file_name: "Fort_Meade_HVAC_Subcontract.pdf", date: "05/30/2026", track: "Formal Scan", risks: "3 Flags", status: "Success" },
  { id: "102", file_name: "Pasted Proposal Text (PM Email Offer)", date: "05/28/2026", track: "Pre-Award Triage", risks: "1 Flag", status: "Success" }
];

export default function ScanTable() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-[#596A7D]">
              <th className="py-4 px-6">Project Document Identifier</th>
              <th className="py-4 px-6">Date Checked</th>
              <th className="py-4 px-6">Profile Track</th>
              <th className="py-4 px-6">Risk Flags</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
            {mockHistoricalRows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/30 transition-all">
                <td className="py-4 px-6 text-[#1A3668] font-black max-w-xs truncate">{row.file_name}</td>
                <td className="py-4 px-6 text-slate-400 font-mono">{row.date}</td>
                <td className="py-4 px-6">
                  <span className={`text-[10px] px-2 py-0.5 rounded border ${
                    row.track === "Formal Scan" ? "bg-blue-50 text-[#1A3668] border-blue-100" : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}>
                    {row.track}
                  </span>
                </td>
                <td className="py-4 px-6 text-[#FF5F1F] font-black">{row.risks}</td>
                <td className="py-4 px-6">
                  <span className="text-green-600 flex items-center gap-1">● {row.status}</span>
                </td>
                <td className="py-4 px-6 text-right">
                  <Link 
                    href={`/report/${row.id}`} 
                    className="inline-flex items-center gap-1 text-[#FF5F1F] hover:text-[#1A3668] transition-colors font-black uppercase tracking-wider text-[11px]"
                  >
                    View Report
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}