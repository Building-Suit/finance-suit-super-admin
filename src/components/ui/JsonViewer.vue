<script setup>
import { computed } from "vue";
const props = defineProps({
  value: { type: [Object, Array, String, Number, Boolean], default: null },
});
const redacted = computed(() =>
  JSON.stringify(
    props.value,
    (key, value) =>
      /token|secret|credential|password|service.?account|authorization/i.test(
        key,
      )
        ? "[REDACTED]"
        : value,
    2,
  ),
);
</script>
<template>
  <pre class="json-viewer" dir="ltr"><code>{{ redacted }}</code></pre>
</template>
