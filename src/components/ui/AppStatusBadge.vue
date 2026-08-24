<script setup>
import { computed } from "vue";
const props = defineProps({
  status: { type: [String, Boolean], default: "unknown" },
});
const value = computed(() => String(props.status));
const tone = computed(() => {
  if (
    [
      "true",
      "active",
      "published",
      "synced",
      "sent",
      "completed",
      "processed",
      "paid_live",
    ].includes(value.value)
  )
    return "success";
  if (
    [
      "failed",
      "critical",
      "revoked",
      "verification_failed",
      "mismatch",
    ].includes(value.value)
  )
    return "error";
  if (
    [
      "warning",
      "pending",
      "pending_sync",
      "sending",
      "leased",
      "timed_early_access",
    ].includes(value.value)
  )
    return "warning";
  return "info";
});
</script>
<template>
  <span class="status-badge" :class="tone"
    ><span aria-hidden="true" class="badge-dot" />{{
      value.replaceAll("_", " ")
    }}</span
  >
</template>
