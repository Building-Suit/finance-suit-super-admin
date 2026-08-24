import { readonly, ref } from "vue";

const allowed = ["light", "dark", "system"];
const appearance = ref(
  allowed.includes(localStorage.getItem("fs-admin-appearance"))
    ? localStorage.getItem("fs-admin-appearance")
    : "system",
);
let media;

function applyAppearance() {
  media ||= window.matchMedia("(prefers-color-scheme: dark)");
  const resolved =
    appearance.value === "system"
      ? media.matches
        ? "dark"
        : "light"
      : appearance.value;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
}

export function initializeAppearance() {
  applyAppearance();
  media.addEventListener?.(
    "change",
    () => appearance.value === "system" && applyAppearance(),
  );
}

export function useAppearance() {
  function setAppearance(value) {
    if (!allowed.includes(value)) return;
    appearance.value = value;
    localStorage.setItem("fs-admin-appearance", value);
    applyAppearance();
  }
  return { appearance: readonly(appearance), setAppearance, choices: allowed };
}
