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
      alert('Email template copied to clipboard.');
    } catch {
      alert('Copy failed. Please select and copy manually.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#20324A]/35 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-2xl rounded-lg border border-[#E6EEF5] bg-white p-6 shadow-2xl animate-scale-in">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#20324A]"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="font-headline text-lg font-semibold text-[#20324A]">
          Stakeholder Sharing Template
        </h3>
        <p className="mt-2 text-sm text-[#64748B]">
          Copy this concise note for handovers, sponsor updates, or diligence packs.
        </p>

        <div className="mt-4 max-h-80 overflow-y-auto rounded-lg border border-[#E6EEF5] bg-[#F7F9FC] p-4">
          <pre className="whitespace-pre-wrap font-body text-sm leading-relaxed text-[#22324B]">
            {EMAIL_TEMPLATE}
          </pre>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#E6EEF5] px-4 py-2 text-sm font-semibold text-[#20324A] hover:bg-[#F7F9FC]"
          >
            Close
          </button>
          <button
            type="button"
            onClick={copyTemplate}
            className="rounded-lg bg-[#20B8C5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#108995]"
          >
            Copy Email Text
          </button>
        </div>
      </div>
    </div>
  );
}
