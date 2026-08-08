# Finance Suit Super Admin

Separate web dashboard for Finance Suit platform administration.

Uses Building Suit tokens and logo assets from:

- `/home/tareq/Dev/building-suit/.docs/building-suit-brand-guidelines`
- `/home/tareq/Dev/building-suit/prototype/.design-system-control`

## Run

```bash
cp .env.example .env
npm install
npm run dev
```

## Required backend

Deploy these Finance Suit Edge Functions:

- `commercial-admin`
- `google-play-billing`
- `google-play-rtdn`

Bootstrap the first admin in Supabase:

```sql
insert into app_commercial.platform_admins (user_id, role, status)
values ('<AUTH_USER_ID>', 'super_admin', 'active');
```
