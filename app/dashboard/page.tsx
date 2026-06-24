"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link"; 
import { UploadCloud, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

// --- TEMPORARY HARDCODED KEYS TO BYPASS WINDOWS/TURBOPACK CACHE ---
const supabaseUrl = "https://fqwkvyypjnxkiojbubdf.supabase.co";
const supabaseAnonKey = "sb_publishable_o4tvWZUZF3eLv6nfjRs95A_KdNMAvHA";
// ------------------------------------------------------------------

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [audits, setAudits] = useState<any[]>([]);

  useEffect(() => {
    const getUserAndData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        fetchAudits(user.id);
      }
    };
    getUserAndData();
  }, []);

  const fetchAudits = async (userId: string) => {
    const { data, error } = await supabase
      .from('contract_audits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAudits(data);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processUpload(e.target.files[0]);
    }
  };

  const processUpload = async (file: File) => {
    if (!user) {
      setUploadStatus({ type: 'error', msg: 'You must be logged in to upload contracts.' });
      return;
    }

    if (file.type !== "application/pdf") {
      setUploadStatus({ type: 'error', msg: 'Please upload a valid PDF document.' });
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);

    try {
      // 1. Upload to Storage
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Create Registry Record
      const { data: insertData, error: dbError } = await supabase
        .from('contract_audits')
        .insert([{ user_id: user.id, file_name: file.name, status: 'Processing' }])
        .select();

      if (dbError) throw dbError;
      
      const newRecordId = insertData[0].id;
      
      setUploadStatus({ type: 'success', msg: `${file.name} uploaded. Engine is scanning for risks...` });
      await fetchAudits(user.id); 
      
      // 3. Send file to the AI Parsing Route
      const formData = new FormData();
      formData.append("file", file);

      const aiResponse = await fetch('/api/analyze-contract', {
        method: 'POST',
        body: formData
      });

      const aiData = await aiResponse.json();

      if (aiResponse.ok) {
        console.log("AI REVIEW COMPLETE:", aiData.result);
        
        // 4. Update Database status to 'Review Ready' AND save the AI data!
        await supabase
          .from('contract_audits')
          .update({ 
            status: 'Review Ready',
            ai_results: aiData.result 
          })
          .eq('id', newRecordId);
          
        await fetchAudits(user.id); 
        setUploadStatus({ type: 'success', msg: `${file.name} review complete.` });

      } else {
        throw new Error(aiData.error || "AI Engine failed to process document.");
      }

    } catch (error: any) {
      console.error(error);
      setUploadStatus({ type: 'error', msg: 'Upload or processing failed. Please try again.' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] font-sans text-slate-900 pb-20">
      
      <div className="bg-white border-b border-slate-200 py-8 px-6">
        <div className="max-w-5xl mx-auto flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black text-[#1A3668] uppercase tracking-tight">Pre-Award Subcontract Intake Hub</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Securely route agreements into the specific project audit pipeline.</p>
          </div>
          <div className="text-right border-l border-slate-200 pl-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Allocation</p>
            <p className="text-lg font-black text-[#FF5F1F]">25 SCANS REMAINING</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-10 space-y-10">
        
        <section>
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
              isDragging ? 'border-[#FF5F1F] bg-[#FF5F1F]/5' : 'border-slate-300 bg-white hover:border-slate-400'
            }`}
          >
            {isUploading ? (
              <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-[#FF5F1F] animate-spin" />
                <p className="text-sm font-bold text-[#1A3668] uppercase tracking-wider">Encrypting and Routing to Intake Hub...</p>
              </div>
            ) : (
              <>
                <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <UploadCloud className={`w-8 h-8 ${isDragging ? 'text-[#FF5F1F]' : 'text-slate-400'}`} />
                </div>
                <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide">Drag & Drop Contract File</h3>
                <p className="text-xs font-medium text-slate-500 mt-2 mb-6">Supported format: Secure PDF</p>
                
                <input type="file" accept="application/pdf" className="hidden" id="file-upload" onChange={handleFileSelect} />
                <label htmlFor="file-upload" className="cursor-pointer inline-flex items-center gap-2 bg-[#FF5F1F] hover:bg-[#E04F1A] text-white text-xs font-black uppercase tracking-wider py-2.5 px-6 rounded-lg transition shadow-sm">
                  Browse Local Files
                </label>
              </>
            )}
          </div>

          {uploadStatus && (
            <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 border ${
              uploadStatus.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {uploadStatus.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <p className="text-xs font-bold">{uploadStatus.msg}</p>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-sm font-black text-[#1A3668] uppercase tracking-widest mb-4">Audit Operations Registry</h2>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Project Document Identifier</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {audits.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-xs font-medium text-slate-500">
                      No documents uploaded yet. Drag and drop a contract above to begin.
                    </td>
                  </tr>
                ) : (
                  audits.map((audit) => (
                    <tr key={audit.id}>
                      <td className="px-6 py-4 flex items-center gap-3">
                        <FileText className="w-4 h-4 text-slate-400" />
                        {audit.file_name}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded border ${
                          audit.status === 'Processing' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {audit.status === 'Processing' ? 'Scanning...' : 'Review Ready'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/report/${audit.id}`} className="text-xs font-bold text-[#FF5F1F] hover:underline uppercase tracking-wide">
                          View Report
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}