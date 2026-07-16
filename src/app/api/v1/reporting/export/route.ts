import { jsonNoStore } from '@/server/services/billing/no-store';
import { requirePortalUser } from '@/server/services/billing/portal-guard';
import { getReportingOverview } from '@/server/reporting/reporting-suite';
import { resolveRequestIp } from '@/server/utils/request-ip';

function escapeCsv(value: string | number | null | undefined) {
  const stringValue = String(value ?? '');
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function csvResponse(fileName: string, rows: string[]) {
  return new Response(rows.join('\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
    },
  });
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { allowed } = await requirePortalUser(request, ['admin', 'finance_approver', 'auditor']);
  if (!allowed) return jsonNoStore({ error: 'Forbidden' }, { status: 403 });

  try {
    const overview = await getReportingOverview();
    const report = new URL(request.url).searchParams.get('report') ?? 'executive';
    const stamp = new Date().toISOString().slice(0, 10);
    const requesterIpAddress = resolveRequestIp(request.headers);

    if (report === 'r1') {
      return csvResponse(`evoucher_r1_daily_transaction_summary_${stamp}.csv`, [
        'metric,value',
        `transaction_count,${overview.reports.dailyTransactionSummary.transactionCount}`,
        `completed_count,${overview.reports.dailyTransactionSummary.completedCount}`,
        `failed_count,${overview.reports.dailyTransactionSummary.failedCount}`,
        `failed_rate_pct,${overview.reports.dailyTransactionSummary.failedRatePct}`,
        `total_volume,${overview.reports.dailyTransactionSummary.totalVolume}`,
        `average_transaction_value,${overview.reports.dailyTransactionSummary.averageTransactionValue}`,
        '',
        'payment_method,count,amount,percentage',
        ...overview.reports.dailyTransactionSummary.paymentMethodSplit.map((row) =>
          [escapeCsv(row.method), row.count, row.amount.toFixed(2), row.percentage.toFixed(2)].join(
            ','
          )
        ),
      ]);
    }

    if (report === 'r2') {
      return csvResponse(`evoucher_r2_merchant_performance_${stamp}.csv`, [
        'merchant_name,transaction_count,gross_revenue,consumer_savings,platform_revenue,avg_discount_pct,net_merchant_payable',
        ...overview.reports.merchantPerformance.topMerchants.map((row) =>
          [
            escapeCsv(row.merchantName),
            row.transactionCount,
            row.grossRevenue.toFixed(2),
            row.consumerSavings.toFixed(2),
            row.platformRevenue.toFixed(2),
            row.avgDiscountPct.toFixed(2),
            row.netMerchantPayable.toFixed(2),
          ].join(',')
        ),
      ]);
    }

    if (report === 'r3') {
      return csvResponse(`evoucher_r3_consumer_impact_${stamp}.csv`, [
        'metric,value',
        `consumer_count,${overview.reports.consumerImpact.consumerCount}`,
        `unique_purchasing_consumers,${overview.reports.consumerImpact.uniquePurchasingConsumers}`,
        `total_savings,${overview.reports.consumerImpact.totalSavings}`,
        `average_savings_per_consumer,${overview.reports.consumerImpact.averageSavingsPerConsumer}`,
        `wallet_savings_balance,${overview.reports.consumerImpact.walletSavingsBalance}`,
        '',
        'channel,count,percentage',
        ...overview.reports.consumerImpact.channelSplit.map((row) =>
          [escapeCsv(row.label), row.value, Number(row.percentage ?? 0).toFixed(2)].join(',')
        ),
        '',
        'segment,count,percentage',
        ...overview.reports.consumerImpact.segmentSplit.map((row) =>
          [escapeCsv(row.label), row.value, Number(row.percentage ?? 0).toFixed(2)].join(',')
        ),
      ]);
    }

    if (report === 'r4') {
      return csvResponse(`evoucher_r4_settlement_ledger_${stamp}.csv`, [
        'metric,value',
        `pending_amount,${overview.reports.settlementLedger.pendingAmount}`,
        `settled_amount,${overview.reports.settlementLedger.settledAmount}`,
        `failed_batch_count,${overview.reports.settlementLedger.failedBatchCount}`,
        `batch_count,${overview.reports.settlementLedger.batchCount}`,
        `average_batch_processing_days,${overview.reports.settlementLedger.averageBatchProcessingDays ?? ''}`,
        '',
        'status,count,percentage',
        ...overview.reports.settlementLedger.settlementStatusSplit.map((row) =>
          [escapeCsv(row.label), row.value, Number(row.percentage ?? 0).toFixed(2)].join(',')
        ),
      ]);
    }

    if (report === 'r5') {
      return csvResponse(`evoucher_r5_compliance_audit_${stamp}.csv`, [
        'metric,value',
        `popia_consent_rate_pct,${overview.reports.complianceAudit.popiaConsentRatePct ?? ''}`,
        `fraud_flag_rate_pct,${overview.reports.complianceAudit.fraudFlagRatePct ?? ''}`,
        `audit_event_count,${overview.reports.complianceAudit.auditEventCount}`,
        `open_fraud_alert_count,${overview.reports.complianceAudit.openFraudAlertCount}`,
        `verified_popia_merchant_count,${overview.reports.complianceAudit.verifiedPopiaMerchantCount}`,
        `requester_ip_address,${escapeCsv(requesterIpAddress)}`,
        '',
        'audit_action,count,percentage',
        ...overview.reports.complianceAudit.auditActionSplit.map((row) =>
          [escapeCsv(row.label), row.value, Number(row.percentage ?? 0).toFixed(2)].join(',')
        ),
      ]);
    }

    return csvResponse(`evoucher_r6_executive_summary_${stamp}.csv`, [
      'metric,value',
      `merchant_count,${overview.executiveSummary.merchantCount}`,
      `approved_merchant_count,${overview.executiveSummary.approvedMerchantCount}`,
      `consumer_count,${overview.executiveSummary.consumerCount}`,
      `active_product_count,${overview.executiveSummary.activeProductCount}`,
      `transaction_count,${overview.executiveSummary.transactionCount}`,
      `total_volume,${overview.executiveSummary.totalVolume}`,
      `total_savings,${overview.executiveSummary.totalSavings}`,
      `platform_revenue,${overview.executiveSummary.platformRevenue}`,
      `pending_payouts,${overview.executiveSummary.pendingPayouts}`,
      `settled_to_merchants,${overview.executiveSummary.settledToMerchants}`,
      `requester_ip_address,${escapeCsv(requesterIpAddress)}`,
      `summary_line,${escapeCsv(overview.reports.executiveSponsorSummary.summaryLine)}`,
    ]);
  } catch (error: any) {
    return jsonNoStore(
      { error: error?.message || 'Failed to export reporting data.' },
      { status: 500 }
    );
  }
}
