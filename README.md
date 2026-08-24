# Finance Suit Super Admin

Finance Suit's Vue 3 operational control plane for commercial configuration,
catalog curation, notification health, user entitlements, and governance.

The browser is an untrusted client. It authenticates with Supabase Auth using a
publishable/anon key, then every admin read or mutation is authorized again by
one of three protected Edge Functions. Service-role, Google Play, Firebase,
purchase-token, and provider payload secrets never enter the browser bundle.

## Architecture

- Vue 3 + Vite with lazy route views and browser-history navigation.
- `commercial-admin`: users, entitlements, commercial lifecycle, app config,
  announcements, platform admins, billing diagnostics, and audit log.
- `catalog-admin`: sanitized catalog reads and guarded queue/config operations.
- `operations-admin`: aggregate notification health and a self-only test event.
- Supabase Auth session persistence; `super_admin` is the only operational role
  until Finance Suit defines a complete role/action matrix.
- Building Suit semantic tokens, Light/Dark/System appearance, EN/AR shell, RTL,
  Reduced Motion, keyboard focus, and a responsive navigation drawer.

## Local setup

```bash
cp .env.example .env
npm ci
npm run dev
```

Only public browser configuration is allowed:

```dotenv
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Never add `SUPABASE_SERVICE_ROLE_KEY`, Google service-account JSON, OAuth/FCM
credentials, RTDN credentials, or provider tokens to `VITE_*` variables.

## Backend deployment

From the authoritative `Building-Suit/finance-suit` integration branch:

1. Apply the additive Super Admin migration after all earlier migrations.
2. Deploy `commercial-admin`, `catalog-admin`, and `operations-admin`.
3. Keep gateway JWT verification disabled for these functions: each function
   verifies the bearer token with Supabase Auth and checks
   `app_commercial.platform_admins` server-side.
4. Bootstrap the first administrator through secure SQL access:

```sql
insert into app_commercial.platform_admins (user_id, role, status)
values ('<AUTH_USER_ID>', 'super_admin', 'active');
```

All later administrator changes use a transactional function that prevents
self-revocation and removal of the last active Super Admin.

## Building Suit design-system source

- Repository: `tareq-abdelwhap/building-suit`
- `.docs/building-suit-brand-guidelines/07-design-tokens/design-tokens.json`
- `.docs/building-suit-brand-guidelines/07-design-tokens/colors.css`
- `.docs/building-suit-brand-guidelines/04-ui-system/02_COMPONENT_STYLE_GUIDE.md`

`src/building-suit-colors.css` is a vendored canonical color file.
`src/styles/building-suit-tokens.css` records the upstream commit and maps the
canonical typography, spacing, radius, elevation, and motion values. To sync,
copy the generated color file, update aliases from the canonical JSON, update
the source SHA comment, then run the checks and visual QA. No absolute local
path is required at runtime.

## Checks and production safety

```bash
npm test
npm run build
```

Use a dedicated test project for mutations. Do not start monetization,
transition to Paid Live, publish a price, or send notifications on production
merely to test a button.

Google Play Console, authenticated Pub/Sub RTDN, Android Publisher permissions,
Firebase credentials, and Supabase secrets remain manual external setup. A
price remains `pending_sync` until real provider validation succeeds; the
dashboard has no control that fabricates a `synced` state.

See [Admin capability matrix](docs/ADMIN_CAPABILITY_MATRIX.md) and
[Deployment checklist](docs/STEP_BY_STEP.md).
