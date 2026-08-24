<script setup>
defineProps({ title: String, description: String });
</script>
<template>
  <section class="card">
    <header v-if="title || $slots.actions" class="card-header">
      <div>
        <h2 v-if="title">{{ title }}</h2>
        <p v-if="description">{{ description }}</p>
      </div>
      <div v-if="$slots.actions" class="card-actions">
        <slot name="actions" />
      </div>
    </header>
    <slot />
  </section>
</template>
