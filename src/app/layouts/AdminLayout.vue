<script setup>
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import FloatingSidebar from "../../components/shell/FloatingSidebar.vue";
import FloatingTopHeader from "../../components/shell/FloatingTopHeader.vue";
import AppToast from "../../components/ui/AppToast.vue";

const route = useRoute();
const router = useRouter();
const drawerOpen = ref(false);
watch(
  () => route.fullPath,
  () => {
    drawerOpen.value = false;
  },
);
function refresh() {
  router.replace({ query: { ...route.query, refresh: Date.now().toString() } });
}
</script>

<template>
  <div class="admin-shell">
    <FloatingSidebar v-model:open="drawerOpen" />
    <main class="admin-workspace">
      <FloatingTopHeader @menu="drawerOpen = true" @refresh="refresh" />
      <div class="page-stage">
        <RouterView :key="`${route.path}:${route.query.refresh || ''}`" />
      </div>
    </main>
    <AppToast />
  </div>
</template>
