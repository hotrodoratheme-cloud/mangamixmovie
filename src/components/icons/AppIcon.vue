<template>
  <svg
    class="app-icon"
    :class="[`app-icon--${name}`, { 'app-icon--filled': filled }]"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    :fill="filled ? 'currentColor' : 'none'"
    :stroke="filled ? 'none' : 'currentColor'"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="name === 'play'">
      <polygon points="9 7 17 12 9 17 9 7" :fill="filled ? 'currentColor' : 'none'" />
    </template>

    <template v-else-if="name === 'film'">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 5v14M17 5v14M3 10h4M3 14h4M17 10h4M17 14h4" />
    </template>

    <template v-else-if="name === 'book'">
      <path d="M12 7v14" />
      <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16H7.5A2.5 2.5 0 0 0 5 21.5Z" />
      <path d="M5 5.5A2.5 2.5 0 0 0 7.5 8H19" />
    </template>

    <template v-else-if="name === 'books'">
      <path d="M8 3h9a2 2 0 0 1 2 2v13H9a2 2 0 0 0-2 2V5a2 2 0 0 1 2-2Z" />
      <path d="M6 7H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h1" />
    </template>

    <template v-else-if="name === 'history'">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
      <path d="M12 7v6l3 2" />
    </template>

    <template v-else-if="name === 'search'">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </template>

    <template v-else-if="name === 'sun'">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </template>

    <template v-else-if="name === 'moon'">
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 7 7 0 1 0 20 14.5Z" />
    </template>

    <template v-else-if="name === 'menu'">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </template>

    <template v-else-if="name === 'close'">
      <path d="m6 6 12 12M18 6 6 18" />
    </template>

    <template v-else-if="name === 'chevron-left'">
      <path d="m14 6-6 6 6 6" />
    </template>

    <template v-else-if="name === 'chevron-right'">
      <path d="m10 6 6 6-6 6" />
    </template>

    <template v-else-if="name === 'arrow-left'">
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </template>

    <template v-else-if="name === 'user'">
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </template>

    <template v-else-if="name === 'info'">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v6" />
      <path d="M12 7h.01" />
    </template>

    <template v-else-if="name === 'heart'">
      <path
        d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.5-7 10-7 10Z"
        :fill="filled ? 'currentColor' : 'none'"
      />
    </template>
  </svg>
</template>

<script setup>
defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 20 },
  strokeWidth: { type: [Number, String], default: 2 },
  filled: { type: Boolean, default: false },
})
</script>
