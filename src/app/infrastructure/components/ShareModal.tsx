'use client';

import { X } from 'lucide-react';
import { EMAIL_TEMPLATE } from '../data/infrastructureData';

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ShareModal({ open, onClose }: ShareModalProps) {
  if (!open) return null;

  const copyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL_TEMPLATE);
      alert('Email template copied to clipboard!');
    } catch {
      alert('Copy failed — please select and copy manually.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-2xl rounded-2xl border border-indigo-500/20 bg-[#0b132b] p-6 shadow-2xl animate-scale-in">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-lg font-semibold text-white">Handover & Sharing Email Template</h3>
        <p className="mt-2 text-sm text-slate-400">
          Copy the template below to email to your team or manager:
        </p>

        <div className="mt-4 max-h-80 overflow-y-auto rounded-xl border border-indigo-500/15 bg-[#060b13] p-4">
          <pre className="whitespace-pre-wrap font-body text-sm leading-relaxed text-slate-300">
            {EMAIL_TEMPLATE}
          </pre>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-indigo-500/20 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5"
          >
            Close
          </button>
          <button
            type="button"
            onClick={copyTemplate}
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500"
          >
            Copy Email Text
          </button>
        </div>
      </div>
    </div>
  );
}
