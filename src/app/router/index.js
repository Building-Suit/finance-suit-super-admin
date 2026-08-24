import { createRouter, createWebHistory } from "vue-router";
import {
  initializeAdminSession,
  useAdminSession,
} from "../composables/useAdminSession";
import { initializeAppearance } from "../composables/useAppearance";
import { initializeLocale } from "../composables/useLocale";
import { routes } from "./routes";

initializeAppearance();
initializeLocale();

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});
router.beforeEach(async (to) => {
  await initializeAdminSession();
  const { isAuthorized } = useAdminSession();
  if (!to.meta.public && !isAuthorized.value)
    return { name: "sign-in", query: { redirect: to.fullPath } };
  if (to.name === "sign-in" && isAuthorized.value) return { name: "overview" };
  return true;
});
router.afterEach((to) => {
  document.title = `${to.meta.title || "Admin"} · Finance Suit`;
});

export default router;
