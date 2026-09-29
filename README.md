# OrderXO App — Owner Portal

This repository powers **app.orderxo.com**, the restaurant-owner portal.

## Pages
- `/signup`, `/login`, `/verify-email`: owner authentication
- `/onboarding`: restaurant onboarding
- `/dashboard`: restaurant dashboard
- `/dashboard/settings/billing`: subscription information
- `/dashboard/settings/domains`: location websites and domains

**Not included:** marketing home, features, pricing, contact, get-started, and lead capture. Those belong in `orderxo-main` at `orderxo.com`.

## Run
```bash
npm install
cp .env.example .env.local
npm run dev
```
Set `ORDERXO_ADMIN_API_URL` in `.env.local` to the URL of `orderxo-admin-api`. See `ORDERXO_APP_SETUP.md` for details.

**Development status:** Stripe billing operations and automatic domain provisioning are not yet fully implemented.
