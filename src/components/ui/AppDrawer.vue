<script setup>
import AppModal from "./AppModal.vue";
defineProps({ open: Boolean, title: String, description: String });
defineEmits(["close"]);
</script>
<template>
  <AppModal
    :open="open"
    :title="title"
    :description="description"
    @close="$emit('close')"
    ><div class="drawer-content"><slot /></div
  ></AppModal>
</template>
