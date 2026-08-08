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

        <section v-if="activeTab === 'users' || activeTab === 'audit'" class="panel">
          <h3>{{ activeTab === "users" ? "Users" : "Audit Log" }}</h3>
          <p class="helper">
            Read/write controls stay behind the commercial-admin Edge Function.
            Financial records are intentionally not shown here.
          </p>
        </section>
      </template>
    </section>
  </main>
</template>
