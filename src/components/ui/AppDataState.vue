<script setup>
defineProps({
  loading: Boolean,
  error: Object,
  empty: Boolean,
  emptyTitle: { type: String, default: "Nothing to show" },
  emptyMessage: { type: String, default: "No records match the current view." },
});
defineEmits(["retry"]);
</script>
<template>
  <div v-if="loading" class="skeleton-stack" role="status" aria-label="Loading">
    <span v-for="i in 4" :key="i" class="skeleton" />
  </div>
  <div v-else-if="error" class="state-card error-state" role="alert">
    <strong>{{ error.message }}</strong
    ><span>{{ error.code }}</span
    ><button class="button secondary" type="button" @click="$emit('retry')">
      Retry
    </button>
  </div>
  <div v-else-if="empty" class="state-card">
    <strong>{{ emptyTitle }}</strong
    ><span>{{ emptyMessage }}</span>
  </div>
  <slot v-else />
</template>
