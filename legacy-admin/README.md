# YoYo admin -> orderxo-app migration source

These are the admin features extracted from the original YoYo Poke app so they are not shipped in `orderxo-web`.

They are migration source, not a drop-in completed merge. Merge them into the current `orderxo-app` owner portal with organization/location selection and owner-session API proxies. Do not restore direct restaurant-admin JWT logic from the old single-tenant app.

Includes menu manager, orders, store settings, hero slides, promotions, financials, gift cards and user-management UI.
