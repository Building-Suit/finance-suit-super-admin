import { createApp } from "vue";
import App from "./App.vue";
import router from "./app/router";
import "./building-suit-colors.css";
import "./styles/building-suit-tokens.css";
import "./styles/base.css";
import "./styles/shell.css";
import "./styles/utilities.css";

createApp(App).use(router).mount("#app");
