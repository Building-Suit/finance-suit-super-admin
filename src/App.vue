<script setup>
import { computed, onMounted, ref } from "vue";
import { HugeiconsIcon } from "@hugeicons/vue";
import {
  Alert02Icon,
  ArrowReloadHorizontalIcon,
  ChartColumnIcon,
  CheckmarkCircle02Icon,
  DollarCircleIcon,
  Logout03Icon,
  Settings02Icon,
  Shield01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { hasConfig, invokeAdmin, supabase } from "./supabase";

const session = ref(null);
const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);
const overview = ref(null);
const activeTab = ref("overview");
const dir = ref(localStorage.getItem("fs-admin-dir") || "ltr");
const theme = ref(localStorage.getItem("fs-admin-theme") || "light");

const tabs = [
  ["overview", "Overview"],
  ["users", "Users"],
  ["billing", "Plans & Billing"],
  ["promotions", "Trials & Promotions"],
  ["config", "App Configuration"],
  ["provider", "Google Play"],
  ["audit", "Audit Log"],
];

const metrics = computed(() => overview.value?.overview || {});
const campaigns = computed(() => overview.value?.campaigns || []);
const prices = computed(() => overview.value?.prices || []);
const provider = computed(() => overview.value?.provider || []);
const config = computed(() => overview.value?.config || []);
const monetization = computed(() => overview.value?.monetization || null);
const users = ref([]);
const selectedUser = ref(null);
const userQuery = ref("");
const adminReason = ref("");
const grantPermanent = ref(true);
const grantEndsAt = ref("");
const submitting = ref(false);
const auditEvents = ref([]);

onMounted(async () => {
  document.documentElement.dataset.theme = theme.value;
  document.documentElement.dir = dir.value;
  if (!hasConfig) return;
  const { data } = await supabase.auth.getSession();
  session.value = data.session;
  supabase.auth.onAuthStateChange((_event, next) => {
    session.value = next;
    if (next) loadOverview();
  });
  if (session.value) await loadOverview();
});

async function signIn() {
  loading.value = true;
  error.value = "";
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  });
  if (signInError) error.value = signInError.message;
  loading.value = false;
}

async function signOut() {
  await supabase.auth.signOut();
  overview.value = null;
}

async function loadOverview() {
  loading.value = true;
  error.value = "";
  try {
    overview.value = await invokeAdmin("overview");
  } catch (loadError) {
    error.value = loadError.message || "Super Admin access failed";
  } finally {
    loading.value = false;
  }
}

async function loadUsers() {
  loading.value = true;
  try { const result = await invokeAdmin("users", { query: userQuery.value }); users.value = result.users; }
  catch (e) { error.value = e.message || "Could not load users"; }
  finally { loading.value = false; }
}

async function openUser(user) {
  loading.value = true;
  try { selectedUser.value = await invokeAdmin("user_detail", { userId: user.id }); }
  catch (e) { error.value = e.message || "Could not load user"; }
  finally { loading.value = false; }
}

async function grantPro() {
  if (!selectedUser.value || adminReason.value.trim().length < 6) return;
  submitting.value = true;
  try {
    await invokeAdmin("grant_pro", { userId: selectedUser.value.profile.id, permanent: grantPermanent.value, endsAt: grantPermanent.value ? undefined : new Date(grantEndsAt.value).toISOString(), reason: adminReason.value });
    adminReason.value = ""; await openUser(selectedUser.value.profile);
  } catch (e) { error.value = e.message || "Could not grant Pro"; }
  finally { submitting.value = false; }
}

async function endGrant(grantId) {
  const reason = window.prompt("Reason for ending this grant (at least 6 characters):");
  if (!reason) return;
  try { await invokeAdmin("end_grant", { grantId, reason }); await openUser(selectedUser.value.profile); }
  catch (e) { error.value = e.message || "Could not end grant"; }
}

async function setBillingTestAccess(enabled) {
  if (!selectedUser.value) return;
  const reason = window.prompt(`${enabled ? "Enable" : "Disable"} Billing Test Access. Enter an administrative reason (at least 6 characters):`);
  if (!reason || reason.trim().length < 6) return;
  if (!window.confirm(`${enabled ? "Enable" : "Disable"} Billing Test Access for this user? This only exposes test checkout and does not grant Pro.`)) return;
  submitting.value = true;
  try {
    await invokeAdmin("set_billing_test_access", { userId: selectedUser.value.profile.id, enabled, reason });
    await openUser(selectedUser.value.profile);
  } catch (e) { error.value = e.message || "Could not update Billing Test Access"; }
  finally { submitting.value = false; }
}

async function startMonetizationCycle() {
  const reason = window.prompt("Starting the monetization cycle begins the 90-day Early Access countdown. Enter a reason to confirm:");
  if (!reason) return;
  try { await invokeAdmin("start_monetization_cycle", { reason }); await loadOverview(); }
  catch (e) { error.value = e.message || "Could not start the cycle"; }
}

async function loadAudit() {
  try { const result = await invokeAdmin("audit_log"); auditEvents.value = result.events; }
  catch (e) { error.value = e.message || "Could not load audit log"; }
}

function toggleTheme() {
  theme.value = theme.value === "dark" ? "light" : "dark";
  localStorage.setItem("fs-admin-theme", theme.value);
  document.documentElement.dataset.theme = theme.value;
}

function toggleDir() {
  dir.value = dir.value === "rtl" ? "ltr" : "rtl";
  localStorage.setItem("fs-admin-dir", dir.value);
  document.documentElement.dir = dir.value;
}

function money(row) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: row.currency_code,
  }).format(row.amount_minor / 100);
}
</script>

<template>
  <main class="app-shell">
    <aside class="rail">
      <img
        class="brand-logo light-logo"
        src="/building-suit-logo-dark.png"
        alt="Building Suit"
      />
      <img
        class="brand-logo dark-logo"
        src="/building-suit-logo-light.png"
        alt="Building Suit"
      />
      <p class="eyebrow">Finance Suit</p>
      <h1>Super Admin</h1>
      <nav v-if="session" class="tabs" aria-label="Admin sections">
        <button
          v-for="[key, label] in tabs"
          :key="key"
          :class="{ active: activeTab === key }"
          type="button"
          @click="activeTab = key"
        >
          {{ label }}
        </button>
      </nav>
    </aside>

    <section class="workspace">
      <header class="topbar">
        <div>
          <p class="eyebrow">Commercial control plane</p>
          <h2>{{ session ? tabs.find(([key]) => key === activeTab)?.[1] : "Sign in" }}</h2>
        </div>
        <div class="actions">
          <button class="icon-button" type="button" @click="toggleDir">AR</button>
          <button class="icon-button" type="button" @click="toggleTheme">
            {{ theme === "dark" ? "Light" : "Dark" }}
          </button>
          <button v-if="session" class="icon-button" type="button" @click="loadOverview">
            <HugeiconsIcon :icon="ArrowReloadHorizontalIcon" :size="20" />
          </button>
          <button v-if="session" class="icon-button danger" type="button" @click="signOut">
            <HugeiconsIcon :icon="Logout03Icon" :size="20" />
          </button>
        </div>
      </header>

      <p v-if="!hasConfig" class="notice error">
        Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.
      </p>
      <p v-if="error" class="notice error">{{ error }}</p>
      <p v-if="loading" class="notice">Loading…</p>

      <form v-if="hasConfig && !session" class="sign-in" @submit.prevent="signIn">
        <label>
          Email
          <input v-model="email" type="email" autocomplete="email" required />
        </label>
        <label>
          Password
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
          />
        </label>
        <button class="primary" type="submit" :disabled="loading">Sign in</button>
      </form>

      <template v-if="session && overview">
        <section v-if="activeTab === 'overview'" class="panel mode-panel">
          <div>
            <p class="eyebrow">Monetization mode</p>
            <h3>{{ monetization?.mode?.replaceAll('_', ' ') || 'Unknown' }}</h3>
            <p class="helper">Open Early Access provides Pro without a countdown or payment requirement.</p>
          </div>
          <button v-if="monetization?.mode === 'open_early_access'" class="primary" type="button" @click="startMonetizationCycle">
            Start Monetization Cycle
          </button>
        </section>
        <section v-if="activeTab === 'overview'" class="metric-grid">
          <article class="metric">
            <HugeiconsIcon :icon="UserGroupIcon" :size="24" />
            <span>Users</span>
            <strong>{{ metrics.totalUsers || 0 }}</strong>
          </article>
          <article class="metric">
            <HugeiconsIcon :icon="Shield01Icon" :size="24" />
            <span>Free</span>
            <strong>{{ metrics.freeUsers || 0 }}</strong>
          </article>
          <article class="metric">
            <HugeiconsIcon :icon="DollarCircleIcon" :size="24" />
            <span>Paid Pro</span>
            <strong>{{ metrics.paidProUsers || 0 }}</strong>
          </article>
          <article class="metric">
            <HugeiconsIcon :icon="CheckmarkCircle02Icon" :size="24" />
            <span>Early Access</span>
            <strong>{{ metrics.earlyAccessUsers || 0 }}</strong>
          </article>
          <article class="metric">
            <HugeiconsIcon :icon="ChartColumnIcon" :size="24" />
            <span>Trials</span>
            <strong>{{ metrics.standardTrialUsers || 0 }}</strong>
          </article>
          <article class="metric warning">
            <HugeiconsIcon :icon="Alert02Icon" :size="24" />
            <span>Provider failures</span>
            <strong>{{ metrics.providerVerificationFailures || 0 }}</strong>
          </article>
        </section>

        <section v-if="activeTab === 'billing'" class="panel">
          <h3>Published prices</h3>
          <table>
            <thead>
              <tr><th>Plan</th><th>Interval</th><th>Price</th><th>Provider</th><th>Sync</th></tr>
            </thead>
            <tbody>
              <tr v-for="row in prices" :key="row.id">
                <td>{{ row.plan_key }}</td>
                <td>{{ row.interval }}</td>
                <td>{{ money(row) }}</td>
                <td>{{ row.provider }}</td>
                <td><span class="badge">{{ row.provider_sync_status }}</span></td>
              </tr>
            </tbody>
          </table>
        </section>

        <section v-if="activeTab === 'promotions'" class="panel">
          <h3>Campaigns</h3>
          <div v-for="campaign in campaigns" :key="campaign.id" class="row-card">
            <div>
              <strong>{{ campaign.name }}</strong>
              <span>{{ campaign.campaign_type }} · {{ campaign.duration_days }} days</span>
            </div>
            <span class="badge" :class="{ good: campaign.active }">
              {{ campaign.active ? "active" : "inactive" }}
            </span>
          </div>
          <p class="helper">Changing defaults affects new grants only.</p>
          <button v-if="monetization?.mode === 'open_early_access'" class="primary" type="button" @click="startMonetizationCycle">Start Monetization Cycle</button>
        </section>

        <section v-if="activeTab === 'config'" class="panel">
          <h3>Published app config</h3>
          <div v-for="item in config" :key="item.key" class="row-card">
            <strong>{{ item.key }}</strong>
            <code>{{ item.value }}</code>
          </div>
        </section>

        <section v-if="activeTab === 'provider'" class="panel">
          <h3>Google Play</h3>
          <div v-for="item in provider" :key="item.provider" class="row-card">
            <div>
              <strong>{{ item.provider }}</strong>
              <span>{{ item.package_name }}</span>
            </div>
            <span class="badge">{{ item.status }}</span>
          </div>
        </section>

        <section v-if="activeTab === 'users'" class="panel">
          <h3>Users</h3>
          <form class="inline-form" @submit.prevent="loadUsers">
            <input v-model="userQuery" placeholder="Search by display name or user ID" />
            <button class="primary" type="submit">Search</button>
          </form>
          <div v-for="user in users" :key="user.id" class="row-card clickable" @click="openUser(user)">
            <div><strong>{{ user.display_name || 'Unnamed user' }}</strong><span>{{ user.id }}</span></div>
            <span class="badge">View</span>
          </div>
          <div v-if="selectedUser" class="detail-panel">
            <h3>{{ selectedUser.profile?.display_name || 'User' }}</h3>
            <p><strong>Effective plan:</strong> {{ selectedUser.entitlement?.effective_plan || 'Free' }} · {{ selectedUser.entitlement?.source || 'free' }}</p>
            <p><strong>Ends:</strong> {{ selectedUser.entitlement?.ends_at || 'No expiration' }}</p>
            <p v-if="selectedUser.billingTester?.enabled"><span class="badge good">Billing Tester</span></p>
            <button class="icon-button" type="button" :disabled="submitting" @click="setBillingTestAccess(!selectedUser.billingTester?.enabled)">
              {{ selectedUser.billingTester?.enabled ? 'Disable Billing Test Access' : 'Enable Billing Test Access' }}
            </button>
            <h4>Grant Complimentary Pro</h4>
            <label>Reason <input v-model="adminReason" required minlength="6" /></label>
            <label><input v-model="grantPermanent" type="checkbox" /> Permanent</label>
            <label v-if="!grantPermanent">Until date <input v-model="grantEndsAt" type="datetime-local" required /></label>
            <button class="primary" type="button" :disabled="submitting || adminReason.trim().length < 6" @click="grantPro">Grant Complimentary Pro</button>
            <h4>Grant history</h4>
            <div v-for="grant in selectedUser.grants" :key="grant.id" class="row-card">
              <div><strong>{{ grant.source }}</strong><span>{{ grant.status }} · {{ grant.ends_at || 'No expiration' }}</span></div>
              <button v-if="grant.source === 'admin_grant' && grant.status === 'active'" class="icon-button danger" type="button" @click="endGrant(grant.id)">End grant</button>
            </div>
          </div>
        </section>

        <section v-if="activeTab === 'audit'" class="panel">
          <h3>Audit Log</h3>
          <button class="icon-button" type="button" @click="loadAudit">Load audit events</button>
          <div v-for="event in auditEvents" :key="event.id" class="row-card">
            <div><strong>{{ event.action }}</strong><span>{{ event.created_at }} · {{ event.reason || 'No reason recorded' }}</span></div>
            <span class="badge">{{ event.target_type }}</span>
          </div>
        </section>
      </template>
    </section>
  </main>
</template>
