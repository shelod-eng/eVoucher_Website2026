'use client';

import { useEffect, useState } from 'react';
import { X, Loader2, Building, FileText, Hash, ShieldCheck } from 'lucide-react';

interface MerchantDetails {
  id: string;
  business_name: string;
  address: string | null;
  registration_number: string | null;
  tax_clearance_pin: string | null;
  status: string;
  workflow_status: string;
}

interface MerchantDetailsModalProps {
  merchantId: string | null;
  onClose: () => void;
}

const DetailRow = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | null }) => (
  <div className="flex items-start gap-4 py-3 border-b border-slate-100 last:border-b-0">
    <Icon className="w-5 h-5 text-slate-400 mt-1 shrink-0" />
    <div className="flex flex-col">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
      <span className="text-base text-slate-800 font-medium mt-1">{value || <span className="text-slate-400 italic">Not provided</span>}</span>
    </div>
  </div>
);

export default function MerchantDetailsModal({ merchantId, onClose }: MerchantDetailsModalProps) {
  const [details, setDetails] = useState<MerchantDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!merchantId) return;

    const fetchDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/v1/admin/merchant-details/${merchantId}`);
        if (!response.ok) {
          const payload = await response.json();
          throw new Error(payload.error || 'Failed to fetch details.');
        }
        const data = await response.json();
        setDetails(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [merchantId]);

  if (!merchantId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl relative border border-slate-200 animate-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-700 transition-colors rounded-full hover:bg-slate-100"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <h2 className="text-2xl font-bold text-slate-800">
            {details?.business_name || 'Merchant Details'}
          </h2>
          <p className="text-slate-500 mt-1">Full compliance and business information.</p>

          <div className="mt-8">
            {isLoading && (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
              </div>
            )}
            {error && <div className="text-red-600 bg-red-50 p-4 rounded-lg">{error}</div>}
            {details && (
              <div className="space-y-2">
                <DetailRow icon={Building} label="Business Address" value={details.address} />
                <DetailRow icon={FileText} label="Registration Number" value={details.registration_number} />
                <DetailRow icon={Hash} label="Tax Clearance PIN" value={details.tax_clearance_pin} />
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-50 px-8 py-4 rounded-b-2xl border-t border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-600"/>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role-Protected & Audited</span>
            </div>
            <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-300 transition-colors"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
}