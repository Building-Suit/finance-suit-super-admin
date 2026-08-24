<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { HugeiconsIcon } from "@hugeicons/vue";
import {
  ChartColumnIcon,
  DollarCircleIcon,
  Settings02Icon,
  Shield01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { useLocale } from "../../app/composables/useLocale";

const props = defineProps({ open: Boolean });
const emit = defineEmits(["update:open"]);
const route = useRoute();
const { t } = useLocale();
const drawer = ref(null);
const previousFocus = ref(null);

const groups = [
  {
    label: "overview",
    items: [{ to: "/overview", label: "overview", icon: ChartColumnIcon }],
  },
  {
    label: "users",
    items: [{ to: "/users", label: "users", icon: UserGroupIcon }],
  },
  {
    label: "commercial",
    items: [
      {
        to: "/commercial/plans",
        label: "Plans & Features",
        icon: DollarCircleIcon,
      },
      { to: "/commercial/pricing", label: "Pricing", icon: DollarCircleIcon },
      {
        to: "/commercial/campaigns",
        label: "Trials & Campaigns",
        icon: DollarCircleIcon,
      },
      {
        to: "/commercial/monetization",
        label: "Monetization",
        icon: DollarCircleIcon,
      },
      {
        to: "/commercial/billing",
        label: "Billing & Google Play",
        icon: DollarCircleIcon,
      },
    ],
  },
  {
    label: "catalog",
    items: [
      {
        to: "/catalog/overview",
        label: "Catalog Overview",
        icon: ChartColumnIcon,
      },
      {
        to: "/catalog/products",
        label: "Products & Markets",
        icon: ChartColumnIcon,
      },
      { to: "/catalog/queue", label: "Research Queue", icon: ChartColumnIcon },
      { to: "/catalog/runs", label: "Research Runs", icon: ChartColumnIcon },
      {
        to: "/catalog/settings",
        label: "Catalog Settings",
        icon: Settings02Icon,
      },
    ],
  },
  {
    label: "operations",
    items: [
      {
        to: "/operations/config",
        label: "App Configuration",
        icon: Settings02Icon,
      },
      {
        to: "/operations/announcements",
        label: "Announcements",
        icon: Settings02Icon,
      },
      {
        to: "/operations/notifications",
        label: "Notification Health",
        icon: Settings02Icon,
      },
      {
        to: "/operations/admins",
        label: "Platform Admins",
        icon: Shield01Icon,
      },
    ],
  },
  {
    label: "governance",
    items: [{ to: "/audit", label: "Audit Log", icon: Shield01Icon }],
  },
];

watch(
  () => props.open,
  async (open) => {
    document.body.classList.toggle("drawer-is-open", open);
    if (open) {
      previousFocus.value = document.activeElement;
      await nextTick();
      drawer.value?.querySelector("a")?.focus();
    } else previousFocus.value?.focus?.();
  },
);
onBeforeUnmount(() => document.body.classList.remove("drawer-is-open"));

function onKeydown(event) {
  if (event.key === "Escape") {
    emit("update:open", false);
    return;
  }
  if (event.key !== "Tab") return;
  const focusable = [
    ...drawer.value.querySelectorAll(
      'a,button,[tabindex]:not([tabindex="-1"])',
    ),
  ];
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
</script>

<template>
  <button
    v-if="open"
    class="drawer-backdrop"
    type="button"
    aria-label="Close navigation"
    @click="$emit('update:open', false)"
  />
  <aside
    ref="drawer"
    class="floating-sidebar"
    :class="{ open }"
    aria-label="Primary navigation"
    @keydown="onKeydown"
  >
    <div class="brand-lockup">
      <img
        class="brand-logo logo-light"
        src="/building-suit-logo-dark.png"
        alt="Building Suit"
      />
      <img
        class="brand-logo logo-dark"
        src="/building-suit-logo-light.png"
        alt="Building Suit"
      />
      <div>
        <span>Finance Suit</span><strong>{{ t("superAdmin") }}</strong>
      </div>
    </div>
    <nav class="admin-nav">
      <section v-for="group in groups" :key="group.label" class="nav-group">
        <h2>{{ t(group.label) }}</h2>
        <RouterLink
          v-for="item in group.items"
          :key="item.to"
          :to="item.to"
          :aria-current="route.path === item.to ? 'page' : undefined"
        >
          <HugeiconsIcon
            :icon="item.icon"
            :size="20"
            aria-hidden="true"
          /><span>{{ t(item.label) }}</span>
        </RouterLink>
      </section>
    </nav>
    <div class="sidebar-context">
      <span class="status-dot" />Protected server actions<strong
        >Finance Suit</strong
      >
    </div>
  </aside>
</template>
