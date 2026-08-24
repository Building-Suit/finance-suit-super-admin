<script setup>
defineProps({
  tone: { type: String, default: "secondary" },
  loading: Boolean,
  type: { type: String, default: "button" },
});
</script>
<template>
  <button :type="type" class="button" :class="tone" :disabled="loading">
    <span v-if="loading" class="spinner" aria-hidden="true" /> <slot />
  </button>
</template>
