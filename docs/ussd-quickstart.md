# USSD Quickstart (Scaffold)

This scaffold gives you:
- A menu state machine
- Session handling
- Simulator endpoint
- Twilio-compatible webhook adapter
- MSISDN-based customer lookup (via `user_profiles.phone`)

## Endpoints

- `POST /api/v1/ussd/session`
- `GET /api/v1/ussd/simulator`
- `POST /api/v1/ussd/simulator`
- `POST /api/v1/ussd/providers/twilio`

## Simulator test

```bash
curl -X POST http://localhost:4028/api/v1/ussd/simulator \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"sim-001\",\"msisdn\":\"+27710000000\",\"text\":\"\"}"
```

Then continue same session:

```bash
curl -X POST http://localhost:4028/api/v1/ussd/simulator \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"sim-001\",\"msisdn\":\"+27710000000\",\"text\":\"1\"}"
```

For your number, use:

```bash
curl -X POST http://localhost:4028/api/v1/ussd/simulator \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"sim-lebo-001\",\"msisdn\":\"27780589029\",\"text\":\"\"}"
```

## Current real flow

- Main menu:
  - `1. Register`
  - `2. Login / Continue`
  - `3. Shop`
  - `4. Wallet`
  - `5. Redeem`
- Registration flow:
  - First name -> surname -> province -> create 4-digit PIN -> confirm PIN
- Login flow:
  - Enter 4-digit PIN
- Shop:
  - Merchant list -> product list -> purchase intent capture
- Wallet:
  - Balance from active `customer_vouchers.current_balance`
- Redeem:
  - Voucher code capture

> Note: For local demos when DB access is unavailable, simulator fallback merchants/products are shown.

## Twilio note

Twilio can help as a webhook bridge during early testing, but for **true South African USSD** with MTN/Vodacom you typically integrate with a local USSD aggregator.  
This scaffold keeps provider mapping isolated so we can plug in MTN/Vodacom aggregator payloads next.
