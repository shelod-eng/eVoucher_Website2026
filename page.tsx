/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Loader2, CheckCircle2, AlertCircle, Store, Package, DollarSign, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Product {
  name: string;
  value: number;
  active: boolean;
}

interface PayoutTelemetry {
  status: string;
  lastSettlement: string | null;
  batchRef: string;
}

interface MerchantReportEntry {
  merchantName: string;
  email: string;
  onboardingStatus: string;
  productCount: number;
  productCatalogue: Product[];
  payoutTelemetry: PayoutTelemetry;
  isSponsorReady: boolean;
}

export default function MerchantProductReportPage() {
  const { session, isAdmin, loading: authLoading } = useAdminAuth();
  const router = useRouter();
  const [reportData, setReportData] = useState<MerchantReportEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    if (!session || !isAdmin) {
      setError('Unauthorized access. Please log in as an admin.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/admin/merchant-report');
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setReportData(data.report);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch merchant report.');
      console.error('Failed to fetch merchant report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (!session || !isAdmin) {
      router.push('/portal/login'); // Redirect to login if not authenticated or not admin
      return;
    }

    fetchReport();
    const interval = setInterval(fetchReport, 60000); // Refresh every 60 seconds

    return () => clearInterval(interval);
  }, [session, isAdmin, authLoading, router]);

  if (authLoading || loading && !reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-2 text-gray-600">Loading report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-red-700 mb-2">Error Loading Report</h2>
        <p className="text-gray-600 text-center mb-6">{error}</p>
        <Button onClick={fetchReport} className="bg-primary text-primary-foreground">
          <RefreshCw className="w-4 h-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Card className="max-w-full mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Store className="w-6 h-6 text-primary" /> Merchant Product Report
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Overview of all merchants, their onboarding status, product offerings, and payout telemetry.
            Refreshes every 60 seconds.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Merchant Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Payout Status</TableHead>
                  <TableHead>Sponsor Ready</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData?.map((merchant, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{merchant.merchantName}</TableCell>
                    <TableCell>
                      <Badge variant={merchant.onboardingStatus === 'active' ? 'default' : 'secondary'}>
                        {merchant.onboardingStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {merchant.productCount > 0 ? (
                        <span className="flex items-center gap-1">
                          <Package className="w-4 h-4 text-gray-500" /> {merchant.productCount} products
                        </span>
                      ) : (
                        <span className="text-muted-foreground">No products</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={merchant.payoutTelemetry.status === 'SETTLED' ? 'default' : 'outline'}>
                        {merchant.payoutTelemetry.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {merchant.isSponsorReady ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}