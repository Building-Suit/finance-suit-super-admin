<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { HugeiconsIcon } from "@hugeicons/vue";
import {
  ArrowReloadHorizontalIcon,
  Logout03Icon,
} from "@hugeicons/core-free-icons";
import { useAdminSession } from "../../app/composables/useAdminSession";
import { useAppearance } from "../../app/composables/useAppearance";
import { useLocale } from "../../app/composables/useLocale";

defineEmits(["menu", "refresh"]);
const route = useRoute();
const router = useRouter();
const { session, signOut } = useAdminSession();
const { appearance, setAppearance } = useAppearance();
const { locale, setLocale, t } = useLocale();
const title = computed(() =>
  locale.value === "ar" ? route.meta.titleAr : route.meta.title,
);
async function logout() {
  await signOut();
  router.replace("/sign-in");
}
</script>

<template>
  <header class="floating-header">
    <button
      class="menu-trigger button ghost"
      type="button"
      :aria-label="t('menu')"
      @click="$emit('menu')"
    >
      <span aria-hidden="true">☰</span>
    </button>
    <div class="page-heading">
      <span>{{ t("controlPlane") }}</span>
      <h1>{{ title }}</h1>
    </div>
    <div class="header-actions">
      <button
        class="button icon-only"
        type="button"
        :aria-label="t('refresh')"
        @click="$emit('refresh')"
      >
        <HugeiconsIcon :icon="ArrowReloadHorizontalIcon" :size="20" />
      </button>
      <label class="compact-select"
        ><span class="sr-only">Language</span
        ><select :value="locale" @change="setLocale($event.target.value)">
          <option value="en">EN</option>
          <option value="ar">العربية</option>
        </select></label
      >
      <label class="compact-select"
        ><span class="sr-only">Appearance</span
        ><select
          :value="appearance"
          @change="setAppearance($event.target.value)"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select></label
      >
      <div class="admin-identity">
        <span>{{ session?.user?.email }}</span
        ><strong>{{ t("superAdmin") }}</strong>
      </div>
      <button
        class="button icon-only danger-text"
        type="button"
        :aria-label="t('signOut')"
        @click="logout"
      >
        <HugeiconsIcon :icon="Logout03Icon" :size="20" />
      </button>
    </div>
  </header>
</template>
