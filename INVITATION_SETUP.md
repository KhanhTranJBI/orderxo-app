# OrderXO invitation onboarding (development)

## Roles
- `orderxo-main`: lead capture only.
- `orderxo-admin-api`: creates draft organizations, invitations, verifies acceptance.
- `orderxo-app`: invitation, owner login/signup, dashboard.

## Admin API environment
`MONGODB_URI`, `NEXTAUTH_SECRET` (>=32 characters), `MAILGUN_DOMAIN`, `MAILGUN_API_KEY`, `MAILGUN_FROM`, `OWNER_WEB_URL=https://app.orderxo.com`, `ORDERXO_INTERNAL_API_KEY` (random >=32 characters).

## App environment
`ORDERXO_ADMIN_API_URL=https://admin-api.orderxo.com` (or local URL).

## Creating an invitation (internal trusted staff only)
`POST /api/internal/invitations/create` on admin-api with header `x-orderxo-internal-key: <secret>` and JSON `{ "restaurantName":"Demo Poke", "restaurantSlug":"demo-poke", "locationName":"Main Location", "ownerEmail":"owner@example.com", "plan":"starter" }`.
**Never expose ORDERXO_INTERNAL_API_KEY in frontend, browser or NEXT_PUBLIC_* variables.** Use a private server-side tool to create invites. Protect this endpoint with rate limits, staff SSO and audit logs before production.

## Acceptance
1. Staff creates invite. API creates draft Organization (suspended), inactive Location, incomplete Subscription and pending invitation; emails a 7-day link.
2. Owner opens `/invite/<token>` and signs up or signs in with the invited email.
3. Owner verifies email and signs in. Login returns to invite page.
4. Owner clicks Accept; membership becomes active, invitation becomes accepted.
5. Owner lands on dashboard. Organization remains suspended, location inactive and subscription incomplete until Stripe Billing, setup review and activation are implemented.

`ALLOW_PUBLIC_ONBOARDING` defaults disabled; do not enable it for invitation-only operation.

## Security and deployment notes
- MongoDB transactions require a replica set (MongoDB Atlas).
- Invitation token is SHA-256 hashed at rest, random and single use; do not log tokens or URLs.
- Login/signup remain reachable for creating an owner account; invitation is required to create an organization.
- Frontend owner session uses HttpOnly cookie. Complete CSRF protection, server-side route authorization, rate limiting and account recovery before production.
- The current internal invitation creation API creates a **new** organization; duplicate slugs return 409. No resend/revoke UI yet.
- Mailgun failure after database commit can leave a pending invitation; add a secure resend/revoke workflow.
- The proposed subdomain is not live until DNS/tenant routing is configured.
- No Stripe Billing charges are performed in this patch.
