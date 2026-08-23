<template>
  <nav v-if="visibleItems.length" class="page-breadcrumb" aria-label="Breadcrumb">
    <ol class="page-breadcrumb-list">
      <li v-for="(item, index) in visibleItems" :key="`${item.label}-${index}`">
        <span v-if="index > 0" class="sep" aria-hidden="true">/</span>
        <router-link v-if="item.to" :to="item.to">{{ item.label }}</router-link>
        <span v-else class="current">{{ item.label }}</span>
      </li>
    </ol>
  </nav>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** @type {{ label: string, to?: string | object }[]} */
  items: {
    type: Array,
    default: () => [],
  },
})

const visibleItems = computed(() =>
  (props.items || []).filter((item) => item?.label && (item.to || !item.hidden))
)
</script>

<style scoped>
.page-breadcrumb {
  margin: 0 0 4px;
}

.page-breadcrumb-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0;
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.page-breadcrumb-list li {
  display: inline-flex;
  align-items: center;
}

.sep {
  margin: 0 8px;
  color: var(--text-muted);
  opacity: 0.55;
}

.page-breadcrumb a {
  color: var(--accent);
  font-weight: 700;
  transition: color 0.15s;
}

.page-breadcrumb a:hover {
  color: var(--accent-hover, var(--accent));
}

.current {
  color: var(--text-muted);
  font-weight: 600;
}
</style>
