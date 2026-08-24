<script setup>
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { hasConfig } from "../../supabase";
import { useAdminSession } from "../../app/composables/useAdminSession";
import { useAppearance } from "../../app/composables/useAppearance";
import { useLocale } from "../../app/composables/useLocale";

const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);
const route = useRoute();
const router = useRouter();
const { status, accessError, signIn } = useAdminSession();
const { appearance, setAppearance } = useAppearance();
const { locale, setLocale, t } = useLocale();
async function submit() {
  loading.value = true;
  error.value = "";
  try {
    const allowed = await signIn(email.value, password.value);
    if (allowed) router.replace(String(route.query.redirect || "/overview"));
  } catch (value) {
    error.value = value.message || "Sign in failed";
  } finally {
    loading.value = false;
  }
}
</script>
<template>
  <main class="auth-page">
    <section class="auth-brand">
      <img
        class="brand-logo logo-light"
        src="/building-suit-logo-dark.png"
        alt="Building Suit"
      /><img
        class="brand-logo logo-dark"
        src="/building-suit-logo-light.png"
        alt="Building Suit"
      />
      <p>Finance Suit</p>
      <h1>{{ t("authProduct") }}</h1>
      <span>{{ t("authDescription") }}</span>
    </section>
    <section class="auth-card">
      <div class="auth-toolbar">
        <select
          :value="locale"
          aria-label="Language"
          @change="setLocale($event.target.value)"
        >
          <option value="en">EN</option>
          <option value="ar">العربية</option>
        </select>
        <select
          :value="appearance"
          aria-label="Appearance"
          @change="setAppearance($event.target.value)"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
      </div>
      <h2>{{ t("signIn") }}</h2>
      <p>{{ t("authLead") }}</p>
      <div v-if="!hasConfig" class="notice error" role="alert">
        {{ t("missingConfig") }}
      </div>
      <div v-if="status === 'forbidden'" class="notice error" role="alert">
        {{ accessError?.message || t("accessRequired") }}
      </div>
      <div v-if="error" class="notice error" role="alert">{{ error }}</div>
      <form @submit.prevent="submit">
        <label class="field"
          ><span>{{ t("email") }}</span
          ><input
            v-model="email"
            type="email"
            autocomplete="email"
            required /></label
        ><label class="field"
          ><span>{{ t("password") }}</span
          ><input
            v-model="password"
            type="password"
            autocomplete="current-password"
            required /></label
        ><button
          class="button primary"
          type="submit"
          :disabled="!hasConfig || loading"
        >
          <span v-if="loading" class="spinner" />{{ t("signIn") }}
        </button>
      </form>
      <small>{{ t("authBoundary") }}</small>
    </section>
  </main>
</template>
<style scoped>
.auth-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(360px, 520px);
  gap: 48px;
  align-items: center;
  padding: clamp(24px, 6vw, 96px);
  background: var(--bs-background);
}
.auth-brand {
  max-width: 560px;
}
.auth-brand .brand-logo {
  width: 180px;
  margin-bottom: 48px;
}
.auth-brand p {
  margin: 0;
  color: var(--bs-accent);
  font-weight: 700;
}
.auth-brand h1 {
  font-size: clamp(34px, 5vw, 58px);
  line-height: 1.05;
  margin: 10px 0 18px;
}
.auth-brand span {
  font-size: 17px;
  color: var(--bs-text-muted);
}
.auth-card {
  position: relative;
  border: 1px solid var(--bs-border);
  border-radius: var(--bs-radius-large);
  background: var(--bs-surface);
  box-shadow: var(--bs-shadow-3);
  padding: 32px;
}
.auth-card h2 {
  font-size: 24px;
  margin: 0;
}
.auth-card form {
  display: grid;
  gap: 16px;
  margin: 22px 0;
}
.auth-card form .button {
  min-height: 48px;
}
.auth-toolbar {
  position: absolute;
  inset-block-start: 18px;
  inset-inline-end: 18px;
  display: flex;
  gap: 6px;
}
.auth-toolbar select {
  min-height: 40px;
  border: 1px solid var(--bs-border);
  border-radius: var(--bs-radius-button);
  background: var(--bs-surface-raised);
  color: var(--bs-text);
}
.auth-card small {
  color: var(--bs-text-muted);
}
@media (max-width: 760px) {
  .auth-page {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  .auth-brand .brand-logo {
    margin-bottom: 24px;
  }
  .auth-brand h1 {
    font-size: 32px;
  }
  .auth-card {
    padding: 24px;
  }
}
@media (max-width: 390px) {
  .auth-page {
    padding: 16px;
  }
  .auth-brand h1 {
    font-size: 28px;
  }
}
</style>
