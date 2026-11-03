import React, { useState } from 'react';
import { X, Check, Copy, FileCode, ShieldCheck } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  code: string;
  language?: string;
  filename: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  title,
  code,
  filename,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#090910] border border-white/[0.1] shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-[#0c0c14]">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner">
              <FileCode size={16} />
            </div>
            <div>
              <h3 className="font-mono text-sm font-bold text-white tracking-wide">{title}</h3>
              <p className="text-[11px] text-zinc-400 font-mono">100% Client-Side Generated Code</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Code Content Box */}
        <div className="flex-1 p-4 overflow-y-auto bg-[#040407]">
          <pre className="font-mono text-xs text-zinc-200 leading-relaxed overflow-x-auto p-4 rounded-xl bg-[#020205] border border-white/[0.06] selection:bg-emerald-500/30">
            <code>{code}</code>
          </pre>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/[0.08] bg-[#0c0c14]">
          <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-mono">
            <ShieldCheck size={14} />
            <span>Zero Server Latency</span>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono font-medium transition-colors cursor-pointer border border-white/[0.08]"
            >
              Download {filename}
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-mono font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'COPIED!' : 'COPY CODE'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
