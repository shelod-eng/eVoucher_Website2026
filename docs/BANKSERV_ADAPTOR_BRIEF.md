# eVoucher BankServ Adaptor Brief

## Purpose

The eVoucher BankServ Adaptor is a separate settlement portal and processing engine that operates behind `www.evoucher.co.za`. It is not a replacement for the consumer portal or the merchant portal. Its purpose is to receive post-checkout settlement events, aggregate them into BankServ-compliant payout batches, submit them through FNB as the sponsoring bank, reconcile responses, and update merchant payout visibility.

In the eVoucher operating model:

- Consumers browse, pay, and receive vouchers on `www.evoucher.co.za`.
- Merchants manage products, onboarding, and payout visibility through the merchant portal.
- The BankServ Adaptor handles downstream settlement orchestration after successful payment.

## Design Position

The adaptor sits behind checkout as the settlement layer for merchant payouts.

High-level flow:

1. Consumer completes checkout on `www.evoucher.co.za`.
2. Payment rail confirms success.
3. Order is marked `PAID`.
4. Voucher issuance completes.
5. A settlement event is published to the adaptor.
6. The adaptor assigns the transaction to the correct payout batch.
7. The batch is validated, wrapped, and submitted to BankServ/PCH using FNB sponsor credentials.
8. ACK/NACK and settlement outcomes are processed.
9. Merchant payout status is updated in the merchant-facing payout experience.

## Why This Module Exists

eVoucher is a South African voucher marketplace that separates consumer payment collection from merchant settlement. The platform must ensure that every successful purchase creates a compliant settlement path for the merchant. The BankServ Adaptor is the dedicated module that makes that possible across EFT, card-funded, and other payout scenarios.

This design aligns with:

- FNB as sponsoring bank
- BankServ Africa / PCH operating model
- PASA clearing rules
- SARB-aligned settlement controls
- POPIA and PCI-aware handling of financial data

## Business Model Context

The eVoucher pricing model reflected in the existing platform and supporting specs is:

- Merchant funds the discount budget.
- Consumer receives a savings benefit.
- eVoucher earns a platform fee from the checkout spread.
- Merchant receives the net receivable after the agreed discount structure.

Example model:

- Face value: `R100.00`
- Discount budget: `5.00%`
- Consumer saving: `2.50%`
- Platform fee: `2.50%`
- Merchant receives: `R95.00`

The adaptor must therefore settle the merchant's receivable amount, not the face value and not necessarily the raw consumer payment amount.

## Relationship To Existing eVoucher Portals

### Consumer Portal

The consumer portal remains responsible for:

- shopping and cart
- payment method selection
- checkout
- wallet use
- voucher receipt and redemption visibility

### Merchant Portal

The merchant portal remains responsible for:

- merchant onboarding
- KYB/compliance progress
- product creation and management
- sales and analytics
- payout history and settlement status

### BankServ Settlement Portal

The separate BankServ portal should be responsible for:

- transaction ingestion
- rail-based batch queues
- start-of-day controls
- batch validation
- ISO 20022 envelope generation
- BankServ submission tracking
- ACK/NACK and reject handling
- reconciliation
- settlement calendar and liquidity projection

## Supported Payment And Settlement Sources

The adaptor must support the current eVoucher payment experience and future payment integrations.

Consumer payment options currently visible or implied in the platform:

- `Debit / Credit Card`
- `PayFast`
- `EFT`
- `eVoucher Wallet`

Future integration targets should remain pluggable:

- `Peach Payments`
- `NetCash`
- future FNB acquiring and PCH-linked rails

Important design rule:

Every successful consumer purchase must generate a merchant settlement event, even if the consumer used a non-BankServ-facing payment method such as wallet or PayFast.

## Batch Types

### Start-of-Day (SOD)

- Purpose: initialise the operating day and prepare the BankServ session
- Trigger: system startup or first qualifying transaction of the day
- File reference: `ESGBZ1C`
- Result: BankServ readiness confirmed through ACK/handshake process

### EFT Batch

- Purpose: group merchant payout transactions intended for EFT settlement
- Trigger: successful purchases routed to EFT settlement processing
- File reference: `ESGB001D`
- Settlement expectation: typically `T+1` business day under PASA ACB rules

### Card Batch

- Purpose: group merchant payout transactions funded by successful card payments
- Trigger: successful purchases on card rails
- File reference: `ESGC001D`
- Settlement expectation: typically `T+1` via card network settlement and sponsor-bank flow

## ISO 20022 Requirement

Each batch must be wrapped in an `ISO 20022 pain.001.001.03` envelope before submission.

The adaptor must:

- generate a valid XML envelope
- inject FNB sponsor identity and submission credentials into `GrpHdr`
- validate control sum and batch totals
- keep a submission hash for auditability
- store rendered output for support and reconciliation

## Post-Checkout Trigger Model

Once `order.status = PAID`, the payment completion flow must publish a settlement ingestion message.

Suggested message contract:

```ts
{
  orderId: string;
  transactionId: string;
  rail: 'EFT' | 'CARD' | 'RTC' | 'NAEDO' | 'SAMOS' | 'WALLET' | 'PAYFAST';
  amount: number;
  merchant: {
    id: string;
    businessName: string;
    bankAccount: string;
    branchCode: string;
    bankName?: string;
  };
  fnbSponsor: {
    merchantId: string;
    terminalId?: string;
    settlementAccountNo: string;
  };
}
```

Recommended IBM MQ queue:

- `BANKSERV.PCH.INGEST`

## Batch Aggregation Rules

The adaptor should maintain separate rail queues and open batches, for example:

- `EFT_BATCH_QUEUE`
- `CARD_BATCH_QUEUE`

Recommended operating rules:

- aggregate by settlement rail
- enforce one active open batch per rail at a time
- cap batch size at `5,000` transactions
- apply cut-off scheduling per rail
- reject invalid merchant banking records before submission
- deduplicate using idempotency key or transaction reference

Suggested cut-off rules from the provided design direction:

- `EFT`: `14:00 SAST`
- `Card`: `23:59 SAST`

Additional rails may later include:

- `RTC`
- `NAEDO`
- `SAMOS / RTGS`

## Batch State Machine

The recommended state model is:

`CREATED -> VALIDATED -> SUBMITTED -> CLEARING -> SETTLED`

Failure path:

`ANY -> REJECTED`

State meanings:

- `CREATED`: batch exists and is collecting transactions
- `VALIDATED`: control totals, structure, and bank details passed validation
- `SUBMITTED`: transmitted to BankServ / sponsor endpoint
- `CLEARING`: BankServ/FNB has accepted processing and settlement is in progress
- `SETTLED`: merchant payout confirmed
- `REJECTED`: batch or items failed validation or were NACKed

## Submission And Acknowledgment

Submission should support:

- `SFTP` and/or `HTTPS`
- FNB sponsor credentials
- TLS `1.3`
- mutual TLS where required

On response:

- `ACK`: advance batch toward `CLEARING` or `SETTLED`
- `NACK`: mark failed items or batch as `REJECTED`
- publish to `BANKSERV.PCH.REJECT` for analyst review and correction

## Merchant Settlement Outcome

Once BankServ/FNB confirms settlement:

- mark the internal settlement record as settled
- update merchant payout balance/history
- reflect the result in the merchant portal payout dashboard
- publish `SETTLEMENT.NOTIFY`

Recommended merchant-facing outcome data:

- payout batch reference
- settlement date
- payout amount
- rail used
- status
- reference / acknowledgment id

## Reconciliation Module

The separate BankServ portal should include a reconciliation component that:

- imports or generates BankServ statement files
- compares statement entries to internal settlement records
- matches by reference and amount
- flags exceptions such as missing references, amount variances, or duplicates
- stores an audit trail of each reconciliation run

This should support both:

- mock/demo CSV workflows
- live statement ingestion when available

## Security And Compliance

The adaptor must be designed with the following controls:

- PCI-conscious architecture: never store raw card data
- tokenised card flow only
- AES-256 encryption for PII and bank account data
- POPIA-aligned retention and access controls
- JWT or equivalent auth for internal portal access
- immutable audit logging for settlement actions
- idempotency controls for payment and batch ingestion

## Suggested Queue Topology

- `BANKSERV.PCH.INGEST` for post-checkout settlement trigger
- `BANKSERV.PCH.REJECT` for rejected batches/items
- `SETTLEMENT.NOTIFY` for merchant settlement notifications
- `VOUCHER.ISSUE` for voucher issuance commands
- optional rail-specific event queues such as:
  - `CARD.PAYMENT.EVENTS`
  - `EFT.PAYMENT.EVENTS`
  - `WALLET.PAYMENT.EVENTS`

## Recommended Platform Responsibilities

### eVoucher Core Platform

- capture checkout intent
- complete consumer payment
- issue vouchers
- persist order and transaction ledger data
- publish post-payment settlement event

### BankServ Adaptor

- consume settlement events
- build payout batches
- generate `SOD`, `EFT`, and `Card` submission artefacts
- submit to FNB / BankServ
- track ACK/NACK lifecycle
- reconcile external results
- drive merchant payout visibility

## Build Priorities

Recommended order of delivery:

1. Payment success -> settlement event trigger
2. Batch ingestion and state model
3. SOD / EFT / Card file generation
4. FNB-sponsored submission adapter
5. Reject handling and re-queue flow
6. Merchant payout dashboard linkage
7. Reconciliation module
8. Hardening for live sponsor-bank and BankServ integration

## Sponsor Narrative

The eVoucher BankServ Adaptor is the dedicated post-checkout settlement engine for the eVoucher platform. It ensures that every successful purchase on `www.evoucher.co.za` results in a compliant merchant payout process, routed through FNB as the sponsoring bank and submitted in BankServ/PCH-compliant batch format. By separating settlement operations from the consumer and merchant portals, eVoucher gains stronger control over payout batching, compliance, reconciliation, and operational scalability as it prepares for integrations with BankServ Africa, PASA, SARB, FNB, Peach Payments, NetCash, and other payment gatekeepers.

## Implementation Note For This Repository

Within the current codebase, the adaptor should be developed as an explicit backend and portal capability that integrates with:

- existing payment transaction records
- voucher purchase completion flow
- billing settlement tables
- merchant payout reporting
- existing BankServ and FNB scaffolding already present in the repository

The payment gateway integration and the BankServ settlement integration should remain decoupled, but connected through reliable post-checkout event orchestration.
