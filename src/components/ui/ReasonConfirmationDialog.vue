<script setup>
import { computed, ref, watch } from "vue";
import AppModal from "./AppModal.vue";
const props = defineProps({
  open: Boolean,
  title: String,
  consequence: String,
  confirmLabel: { type: String, default: "Confirm" },
  destructive: Boolean,
  loading: Boolean,
});
const emit = defineEmits(["close", "confirm"]);
const reason = ref("");
watch(
  () => props.open,
  (open) => {
    if (open) reason.value = "";
  },
);
const valid = computed(
  () => reason.value.trim().length >= 6 && reason.value.trim().length <= 1000,
);
</script>
<template>
  <AppModal
    :open="open"
    :title="title"
    :description="consequence"
    @close="$emit('close')"
    ><label class="field"
      ><span>Administrative reason</span
      ><textarea
        v-model="reason"
        rows="4"
        minlength="6"
        maxlength="1000"
        required
      /><small
        >Required · 6–1000 characters · recorded in the audit log</small
      ></label
    >
    <footer class="modal-actions">
      <button class="button secondary" type="button" @click="$emit('close')">
        Cancel</button
      ><button
        class="button"
        :class="destructive ? 'danger' : 'primary'"
        type="button"
        :disabled="!valid || loading"
        @click="$emit('confirm', reason.trim())"
      >
        <span v-if="loading" class="spinner" />{{ confirmLabel }}
      </button>
    </footer></AppModal
  >
</template>
