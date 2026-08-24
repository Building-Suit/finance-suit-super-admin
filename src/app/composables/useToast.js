import { readonly, ref } from "vue";

const toasts = ref([]);
let nextId = 1;
export function useToast() {
  function push(message, tone = "info") {
    const id = nextId++;
    toasts.value.push({ id, message, tone });
    window.setTimeout(() => dismiss(id), 5000);
    return id;
  }
  function dismiss(id) {
    toasts.value = toasts.value.filter((item) => item.id !== id);
  }
  return { toasts: readonly(toasts), push, dismiss };
}
