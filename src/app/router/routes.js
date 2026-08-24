import AdminLayout from "../layouts/AdminLayout.vue";

export const routes = [
  {
    path: "/sign-in",
    name: "sign-in",
    component: () => import("../../views/auth/SignInView.vue"),
    meta: { public: true, title: "Sign in" },
  },
  {
    path: "/",
    component: AdminLayout,
    children: [
      { path: "", redirect: "/overview" },
      {
        path: "overview",
        name: "overview",
        component: () => import("../../views/overview/OverviewView.vue"),
        meta: { title: "Overview", titleAr: "نظرة عامة" },
      },
      {
        path: "users",
        name: "users",
        component: () => import("../../views/users/UsersView.vue"),
        meta: { title: "Users", titleAr: "المستخدمون" },
      },
      {
        path: "commercial/:section(plans|pricing|campaigns|monetization|billing)",
        name: "commercial",
        component: () => import("../../views/commercial/CommercialView.vue"),
        props: true,
        meta: { title: "Commercial controls", titleAr: "التحكم التجاري" },
      },
      {
        path: "catalog/:section(overview|products|queue|runs|settings)",
        name: "catalog",
        component: () => import("../../views/catalog/CatalogView.vue"),
        props: true,
        meta: { title: "Catalog operations", titleAr: "عمليات الكتالوج" },
      },
      {
        path: "operations/:section(config|announcements|notifications|admins)",
        name: "operations",
        component: () => import("../../views/operations/OperationsView.vue"),
        props: true,
        meta: { title: "Platform operations", titleAr: "عمليات المنصة" },
      },
      {
        path: "audit",
        name: "audit",
        component: () => import("../../views/audit/AuditView.vue"),
        meta: { title: "Audit log", titleAr: "سجل التدقيق" },
      },
    ],
  },
  { path: "/:pathMatch(.*)*", redirect: "/overview" },
];
