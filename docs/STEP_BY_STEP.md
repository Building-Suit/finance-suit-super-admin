# Step-by-step

1. Create Play product: `finance_suit_pro`.
2. Add monthly base plan: `pro-monthly-egp`, EGP 60.
3. Add yearly base plan: `pro-yearly-egp`, EGP 600.
4. Deploy Supabase migration from Finance Suit.
5. Deploy Edge Functions:
   `commercial-admin`, `google-play-billing`, `google-play-rtdn`.
6. Set secrets:
   `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`,
   `GOOGLE_PLAY_PACKAGE_NAME`,
   `GOOGLE_PLAY_RTDN_SHARED_SECRET`.
7. Create your normal Supabase Auth user.
8. Run:
   `insert into app_commercial.platform_admins (user_id, role, status) values ('<AUTH_USER_ID>', 'super_admin', 'active');`
9. Copy `.env.example` to `.env`.
10. Fill `VITE_SUPABASE_URL`.
11. Fill `VITE_SUPABASE_ANON_KEY`.
12. Run `npm install`.
13. Run `npm run dev`.
14. Sign in.
15. Verify dashboard loads.
16. Keep Play provider status as `pending_sync` until Play matches Supabase.
17. Mark provider synced only after real Play test purchases pass.
