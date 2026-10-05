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

## Owner portal API contracts added in October 2026

The owner portal now expects these authenticated/admin-api routes in addition to the existing organization/location APIs:

- `POST /api/auth/request-link` — send returning owner a one-time sign-in link to `https://app.orderxo.com/auth/verify?token=...`
- `POST /api/auth/verify-link` — consume login magic token and return `{ token, expiresIn, user }`
- `PATCH /api/domains` — body `{ organizationId, locationId, domain }`; save/verify a custom domain and return domain/location status
- `POST /api/billing/checkout` — body `{ organizationId, plan }`; create Stripe Billing Checkout Session and return `{ url }`
- `POST /api/billing/portal` — body `{ organizationId }`; create Stripe Customer Portal Session and return `{ url }`

The dashboard's OrderXO hostname uses the restaurant/organization slug (for example `yoyo-poke.orderxo.com`) rather than the location slug (`main.orderxo.com`). Additional locations use `<restaurant-slug>-<location-slug>.orderxo.com` in the current UI.

## Restaurant management migration
The owner dashboard now has a restaurant-scoped workspace at `/dashboard/restaurants/[organizationId]` for Orders, Menu, Store settings, Homepage slides, Promotions, Gift cards and Financials. The original YoYo Poke admin source is preserved under `legacy-admin/` for conversion. Do not expose those legacy components directly: they use the old single-tenant NextAuth/Redux APIs. New management requests should go through `/api/owner/manage/*` and include `organizationId`; the server proxy supplies the HttpOnly owner JWT to admin-api.
