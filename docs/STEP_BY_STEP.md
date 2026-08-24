# Deployment checklist

1. Confirm the dashboard and authoritative Finance Suit integration branches.
2. Apply the additive Super Admin migration after the repository's latest one.
3. Deploy `commercial-admin`, `catalog-admin`, and `operations-admin`.
4. Configure secrets required by the existing Google Play billing,
   authenticated RTDN, and notification-worker documentation.
5. Make Play products/base plans/prices match the published Finance Suit
   commercial catalog. Do not copy prices from this document.
6. Complete real test purchases and RTDN delivery before provider sync is ready.
7. Bootstrap the first `super_admin` through secure SQL access.
8. Set only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the dashboard.
9. Run `npm ci`, `npm test`, and `npm run build`.
10. Verify auth rejection/expiry, Light/Dark/System, EN/AR RTL, Reduced Motion,
    keyboard navigation, and the documented responsive viewports.
11. Exercise high-impact mutations only in a safe test environment.
12. Confirm audit events and verify no secret/private financial payload appears.
