# Billing Engine Portal (Base44 import)

This is the **Billing Engine admin portal UI** imported from Base44 into this repo under `billing-engine-portal/`.

It’s a **separate Vite + React app** so we can deploy it independently (e.g. later to `billing.evoucher.co.za`) without risking the live `www.evoucher.co.za` website.

## Local dev

```bash
cd billing-engine-portal
npm install
npm run dev
```

## Deploy to Vercel (separate project)

1. In Vercel, click **Add New → Project** and import this GitHub repo.
2. In **Project Settings** (during setup), set:
   - **Root Directory**: `billing-engine-portal`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Deploy.

## Notes

- This portal currently uses Base44 SDK wiring (see `billing-engine-portal/src/api/base44Client.js`). We’ll replace this with eVoucher backend APIs/Supabase once the data model + auth approach is finalized.
