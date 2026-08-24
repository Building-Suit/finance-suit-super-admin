<script setup>
import { useToast } from "../../app/composables/useToast";
const { toasts, dismiss } = useToast();
</script>
<template>
  <div class="toast-region" aria-live="polite" aria-atomic="false">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="toast"
      :class="toast.tone"
    >
      <span>{{ toast.message }}</span
      ><button type="button" aria-label="Dismiss" @click="dismiss(toast.id)">
        ×
      </button>
    </div>
  </div>
</template>
