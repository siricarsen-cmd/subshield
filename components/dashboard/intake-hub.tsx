"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, AlertTriangle, UploadCloud, FileText } from "lucide-react";
import * as pdfjs from "pdfjs-dist";
import { createWorker } from "tesseract.js";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function AdvancedIntakeHub() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [contractText, setContractText] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension !== "pdf" && extension !== "txt") {
      setErrorMessage("Unsupported format. Please upload a clean .pdf or .txt file.");
      return;
    }
    setErrorMessage(null);
    setUploadedFile(file);
    setContractText(""); 
  };

  // Dual-Engine Text Extraction (Digital Character Matching + OCR Image Scanning Fallback)
  const extractTextFromPdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;
    let fullText = "";

    // 1. Attempt standard digital character stream reading
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += pageText + "\n";
    }

    // 2. Fallback to Tesseract OCR if the digital stream returned an empty or scanned document layout
    if (!fullText.trim() || fullText.replace(/\s/g, "").length < 20) {
      setLoadingStatus("Scanned document detected. Launching OCR Pixel Scan...");
      
      const worker = await createWorker("eng");
      let ocrText = "";

      // Canvas element generation to render PDF page pixels directly in browser memory
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      for (let i = 1; i <= pdfDoc.numPages; i++) {
        setLoadingStatus(`OCR Scanning Page ${i} of ${pdfDoc.numPages}...`);
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 }); // High-fidelity scaling for crisp OCR extraction
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (ctx) {
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
          const dataUrl = canvas.toDataURL("image/png");
          const { data: { text } } = await worker.recognize(dataUrl);
          ocrText += text + "\n";
        }
      }

      await worker.terminate();
      fullText = ocrText;
    }

    return fullText;
  };

  const handleTriageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);
    setLoadingStatus("Extracting document layers...");

    try {
      let textPayload = contractText;

      if (uploadedFile && uploadedFile.name.endsWith(".txt")) {
        textPayload = await uploadedFile.text();
      } else if (uploadedFile && uploadedFile.name.endsWith(".pdf")) {
        textPayload = await extractTextFromPdf(uploadedFile);
      }

      if (!textPayload.trim()) {
        throw new Error("No readable text could be extracted. Please ensure the file is not password-protected.");
      }

      setLoadingStatus("Running Semantic Triage Engine...");

      const response = await fetch("/api/process-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractText: textPayload }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to process contract parameters.");

      const reportId = data.matchedRulesRegistry && data.matchedRulesRegistry.length > 0
        ? data.matchedRulesRegistry[0].id
        : "clean";

      localStorage.setItem(`subshield_report_${reportId}`, JSON.stringify(data.matchedRulesRegistry || []));
      router.push(`/report/${reportId}`);

    } catch (err: any) {
      console.error("[MULTI-INTAKE ROUTE FAILURE]", err);
      setErrorMessage(err.message || "An unexpected processing error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm max-w-5xl mx-auto">
      <div className="border-b border-slate-100 pb-4 mb-6">
        <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#FF5F1F]" />
          Pre-Award Subcontract Intake Hub
        </h3>
        <p className="text-xs text-[#596A7D] font-medium mt-0.5">
          Drop in an entire agreement file or copy-paste specific project email threads below for rapid risk exposure isolation.
        </p>
      </div>

      <form onSubmit={handleTriageSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={() => setIsDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isDragActive 
                ? "border-[#FF5F1F] bg-[#FF5F1F]/5 scale-[0.99]" 
                : "border-slate-200 hover:border-[#1A3668]/30 hover:bg-slate-50"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pdf,.txt"
              className="hidden"
            />
            
            {uploadedFile ? (
              <div className="space-y-2">
                <div className="p-3 bg-green-50 text-green-600 rounded-full inline-block border border-green-100">
                  <FileText className="w-6 h-6" />
                </div>
                <p className="text-xs font-black text-[#1A3668] max-w-[200px] truncate">
                  {uploadedFile.name}
                </p>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to Scan
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="p-3 bg-slate-50 text-[#596A7D] rounded-full inline-block border border-slate-100">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-xs font-black text-[#1A3668] uppercase tracking-wide">Drag & Drop Contract File</p>
                <p className="text-[11px] text-[#596A7D] font-medium max-w-[200px]">
                  Supports unencrypted <span className="font-bold text-[#1A3668]">.PDF</span> or <span className="font-bold text-[#1A3668]">.TXT</span> project documents
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col relative">
            <textarea
              value={contractText}
              onChange={(e) => {
                setContractText(e.target.value);
                if (uploadedFile) setUploadedFile(null);
              }}
              placeholder="Or paste custom email pushback clauses or RFP text blocks here manually..."
              disabled={loading}
              className="w-full h-full min-h-[160px] p-4 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#FF5F1F] focus:border-[#FF5F1F] disabled:bg-slate-50 disabled:text-slate-400 font-mono resize-none"
            />
          </div>

        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs font-bold text-red-600 flex items-center gap-2 max-w-4xl mx-auto">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {errorMessage}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="submit"
            disabled={loading || (!contractText.trim() && !uploadedFile)}
            className="bg-[#FF5F1F] hover:bg-[#1A3668] text-white text-xs font-black uppercase tracking-wider px-8 py-3.5 rounded-lg shadow-sm transition disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed w-full sm:w-auto"
          >
            {loading ? loadingStatus : "Run Informal Triage"}
          </button>
        </div>
      </form>
    </div>
  );
}