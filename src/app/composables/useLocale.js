import { readonly, ref } from "vue";

const locale = ref(
  localStorage.getItem("fs-admin-locale") === "ar" ? "ar" : "en",
);
const dictionaries = {
  en: {
    overview: "Overview",
    users: "Users",
    commercial: "Commercial",
    catalog: "Catalog",
    operations: "Operations",
    governance: "Governance",
    refresh: "Refresh",
    signOut: "Sign out",
    superAdmin: "Super Admin",
    controlPlane: "Operational control plane",
    menu: "Open menu",
    close: "Close",
    loading: "Loading",
    retry: "Retry",
    signIn: "Sign in",
    email: "Email",
    password: "Password",
    authLead: "Use an account registered as an active Super Admin.",
    authProduct: "Super Admin control plane",
    authDescription: "Secure commercial, catalog, and platform operations.",
    missingConfig: "Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your local environment.",
    authBoundary: "Authentication uses Supabase Auth. The protected admin function verifies authorization again.",
    accessRequired: "Super Admin access is required.",
  },
  ar: {
    overview: "نظرة عامة",
    users: "المستخدمون",
    commercial: "التجاري",
    catalog: "الكتالوج",
    operations: "العمليات",
    governance: "الحوكمة",
    refresh: "تحديث",
    signOut: "تسجيل الخروج",
    superAdmin: "المشرف العام",
    controlPlane: "مركز التحكم التشغيلي",
    menu: "فتح القائمة",
    close: "إغلاق",
    loading: "جارٍ التحميل",
    retry: "إعادة المحاولة",
    signIn: "تسجيل الدخول",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    authLead: "استخدم حسابًا مسجلاً كمشرف عام نشط.",
    authProduct: "مركز تحكم المشرف العام",
    authDescription: "عمليات تجارية وتشغيلية وإدارة كتالوج آمنة.",
    missingConfig: "أضف VITE_SUPABASE_URL وVITE_SUPABASE_ANON_KEY إلى بيئة التشغيل المحلية.",
    authBoundary: "تتم المصادقة عبر Supabase Auth، ثم تتحقق وظيفة الإدارة المحمية من الصلاحية مرة أخرى.",
    accessRequired: "صلاحية المشرف العام مطلوبة.",
  },
};

function applyLocale() {
  document.documentElement.lang = locale.value;
  document.documentElement.dir = locale.value === "ar" ? "rtl" : "ltr";
}

export function initializeLocale() {
  applyLocale();
}
export function useLocale() {
  function setLocale(value) {
    locale.value = value === "ar" ? "ar" : "en";
    localStorage.setItem("fs-admin-locale", locale.value);
    applyLocale();
  }
  return {
    locale: readonly(locale),
    setLocale,
    t: (key) => dictionaries[locale.value][key] || key,
  };
}
