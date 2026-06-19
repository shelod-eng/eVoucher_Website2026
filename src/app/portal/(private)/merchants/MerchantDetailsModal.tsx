'use client';

import { useEffect, useState } from 'react';
import {
  X,
  Loader2,
  Building2,
  User,
  Mail,
  Phone,
  Tag,
  FileText,
  Hash,
  ShieldCheck,
  Banknote,
  MapPin,
  Percent,
  CheckCircle2,
  XCircle,
  Clock,
  Store,
  Landmark,
} from 'lucide-react';

interface MerchantDetailsData {
  id: string;
  business_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  parent_brand: string | null;
  branch_name: string | null;
  merchant_type: string | null;
  business_type: string | null;
  status: string;
  vetting_status: string | null;
  physical_address: string | null;
  city: string | null;
  province: string | null;
  registration_number: string | null;
  tax_number: string | null;
  pharmacy_license_number: string | null;
  responsible_pharmacist_name: string | null;
  owner_id_number: string | null;
  proof_of_premises: string | null;
  bank_name: string | null;
  account_number: string | null;
  branch_code: string | null;
  account_holder_name: string | null;
  default_total_discount_pct: number | null;
  charity_donation_amount: number | null;
  onboarding_fee_paid: boolean | null;
  email_verified: boolean | null;
  phone_verified: boolean | null;
  created_at: string | null;
  approved_at: string | null;
  onboarding_completed_at: string | null;
  _missingColumns?: boolean;
}

interface MerchantDetailsModalProps {
  merchantId: string | null;
  onClose: () => void;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return value;
  }
}

function formatMoney(value: number | null): string {
  if (value === null || value === undefined) return '—';
  return `R${Number(value).toFixed(2)}`;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mt-6 mb-3 first:mt-0">
      {children}
    </h3>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: unknown;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-b-0">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
      <div className="flex flex-col min-w-0">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          {label}
        </span>
        <span className="text-sm text-slate-800 font-medium mt-0.5 break-words">
          {formatValue(value)}
        </span>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const s = String(status ?? '').toLowerCase();
  const colorMap: Record<string, string> = {
    approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    suspended: 'bg-red-100 text-red-700 border-red-200',
  };
  const color = colorMap[s] || 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${color}`}
    >
      {status || 'unknown'}
    </span>
  );
}

export default function MerchantDetailsModal({ merchantId, onClose }: MerchantDetailsModalProps) {
  const [details, setDetails] = useState<MerchantDetailsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingColumns, setMissingColumns] = useState(false);

  useEffect(() => {
    if (!merchantId) return;

    const fetchDetails = async () => {
      setIsLoading(true);
      setError(null);
      setMissingColumns(false);
      try {
        const response = await fetch(`/api/v1/admin/merchant-details/${merchantId}`);
        if (!response.ok) {
          const payload = await response.json();
          throw new Error(payload.error || 'Failed to fetch details.');
        }
        const data = await response.json();
        setMissingColumns(Boolean(data._missingColumns));
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
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl relative border border-slate-200 animate-in zoom-in-95 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-8 pt-6 pb-4 border-b border-slate-200 shrink-0">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-800 truncate">
              {details?.business_name || 'Merchant Details'}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {details?.merchant_type === 'private' ? 'Private Merchant' : 'Chain Merchant'}{' '}
              &middot; {details?.business_type || '—'}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-4">
            {details?.status && <StatusBadge status={details.status} />}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 transition-colors rounded-full hover:bg-slate-100"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-8 py-6 flex-1">
          {isLoading && (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            </div>
          )}

          {error && (
            <div className="text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="font-semibold text-sm">Unable to load merchant details</p>
              <p className="mt-1 text-xs text-red-500">{error}</p>
              {missingColumns && (
                <p className="mt-2 text-xs text-slate-500">
                  Some newer columns haven't been added to this environment yet. Basic info is still
                  shown below.
                </p>
              )}
            </div>
          )}

          {details && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              {/* Column 1 */}
              <div>
                <SectionTitle>Business Profile</SectionTitle>
                <DetailRow icon={Building2} label="Business Name" value={details.business_name} />
                <DetailRow icon={User} label="Contact Person" value={details.contact_name} />
                <DetailRow icon={Mail} label="Email" value={details.email} />
                <DetailRow icon={Phone} label="Phone" value={details.phone} />
                <DetailRow icon={Store} label="Parent Brand" value={details.parent_brand} />
                <DetailRow icon={Tag} label="Branch Name" value={details.branch_name} />
                <DetailRow icon={Tag} label="Merchant Type" value={details.merchant_type} />
                <DetailRow icon={Tag} label="Business Type" value={details.business_type} />
                <DetailRow
                  icon={Percent}
                  label="Discount %"
                  value={details.default_total_discount_pct}
                />

                <SectionTitle>Settlement Account</SectionTitle>
                <DetailRow icon={Landmark} label="Bank Name" value={details.bank_name} />
                <DetailRow icon={User} label="Account Holder" value={details.account_holder_name} />
                <DetailRow icon={Hash} label="Account Number" value={details.account_number} />
                <DetailRow icon={Hash} label="Branch Code" value={details.branch_code} />
                <DetailRow
                  icon={MapPin}
                  label="Physical Address"
                  value={details.physical_address}
                />
                <DetailRow icon={MapPin} label="City" value={details.city} />
                <DetailRow icon={MapPin} label="Province" value={details.province} />
              </div>

              {/* Column 2 */}
              <div>
                <SectionTitle>Compliance Details</SectionTitle>
                <DetailRow
                  icon={FileText}
                  label="Reg. Number"
                  value={details.registration_number}
                />
                <DetailRow icon={Hash} label="Tax / VAT Number" value={details.tax_number} />
                <DetailRow
                  icon={FileText}
                  label="Pharmacy License"
                  value={details.pharmacy_license_number}
                />
                <DetailRow
                  icon={User}
                  label="Responsible Pharmacist"
                  value={details.responsible_pharmacist_name}
                />
                <DetailRow icon={Hash} label="Owner ID Number" value={details.owner_id_number} />
                <DetailRow
                  icon={FileText}
                  label="Proof of Premises"
                  value={details.proof_of_premises}
                />

                <SectionTitle>Onboarding Status</SectionTitle>
                <DetailRow icon={ShieldCheck} label="Status" value={details.status} />
                <DetailRow
                  icon={ShieldCheck}
                  label="Vetting Status"
                  value={details.vetting_status}
                />
                <DetailRow
                  icon={CheckCircle2}
                  label="Email Verified"
                  value={details.email_verified}
                />
                <DetailRow
                  icon={CheckCircle2}
                  label="Phone Verified"
                  value={details.phone_verified}
                />
                <DetailRow
                  icon={Banknote}
                  label="Onboarding Fee Paid"
                  value={details.onboarding_fee_paid}
                />
                <DetailRow
                  icon={Banknote}
                  label="Charity Donation"
                  value={formatMoney(details.charity_donation_amount)}
                />

                <SectionTitle>Timeline</SectionTitle>
                <DetailRow icon={Clock} label="Created" value={formatDate(details.created_at)} />
                <DetailRow icon={Clock} label="Approved" value={formatDate(details.approved_at)} />
                <DetailRow
                  icon={Clock}
                  label="Onboarding Completed"
                  value={formatDate(details.onboarding_completed_at)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-50 px-8 py-4 rounded-b-2xl border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Role-Protected & Audited
            </span>
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
