"use client";

import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface CopyableCodeBlockProps {
  code: string;
  language?: string;
  label?: string; // e.g. "Terminal", "Express.js"
}

export function CopyableCodeBlock({ code, language, label }: CopyableCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }, [code]);

  return (
    <div className="relative group bg-slate-900 rounded-xl overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/60 border-b border-slate-700/50">
        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold select-none">
          {label || language || "Code"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md transition-all duration-200 cursor-pointer select-none bg-slate-700/50 hover:bg-slate-600/60 text-slate-300 hover:text-white"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-green-400" />
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <div className="p-4 md:p-5 overflow-x-auto">
        <pre className="text-[13px] text-gray-300 font-mono leading-relaxed whitespace-pre">
          {code}
        </pre>
      </div>
    </div>
  );
}
