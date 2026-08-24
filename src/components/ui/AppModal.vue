<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from "vue";
const props = defineProps({
  open: Boolean,
  title: { type: String, required: true },
  description: String,
});
const emit = defineEmits(["close"]);
const panel = ref(null);
const previousFocus = ref(null);
watch(
  () => props.open,
  async (open) => {
    document.body.classList.toggle("modal-is-open", open);
    if (open) {
      previousFocus.value = document.activeElement;
      await nextTick();
      panel.value?.focus();
    } else previousFocus.value?.focus?.();
  },
);
onBeforeUnmount(() => document.body.classList.remove("modal-is-open"));
function keydown(event) {
  if (event.key === "Escape") {
    emit("close");
    return;
  }
  if (event.key !== "Tab") return;
  const items = [
    ...panel.value.querySelectorAll(
      'button,input,select,textarea,[tabindex]:not([tabindex="-1"])',
    ),
  ];
  if (!items.length) return;
  const first = items[0];
  const last = items.at(-1);
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
  <Teleport to="body"
    ><div v-if="open" class="modal-layer" @mousedown.self="$emit('close')">
      <section
        ref="panel"
        class="modal"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="`${title}-title`"
        tabindex="-1"
        @keydown="keydown"
      >
        <header>
          <div>
            <h2 :id="`${title}-title`">{{ title }}</h2>
            <p v-if="description">{{ description }}</p>
          </div>
          <button
            class="button icon-only ghost"
            type="button"
            aria-label="Close"
            @click="$emit('close')"
          >
            ×
          </button>
        </header>
        <slot />
      </section></div
  ></Teleport>
</template>
