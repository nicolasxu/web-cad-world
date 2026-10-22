<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useEditorStore } from '../stores/editor'

const store = useEditorStore()
const { activeTool, objectCount, selectedObject } = storeToRefs(store)
</script>

<template>
  <footer class="status-bar">
    <span>Tool: {{ activeTool }}</span>
    <span class="spacer" />
    <span v-if="selectedObject">Selected: {{ selectedObject.name }} ({{ selectedObject.type }})</span>
    <span v-else>Nothing selected</span>
    <span class="spacer" />
    <span>{{ objectCount }} object{{ objectCount === 1 ? '' : 's' }}</span>
  </footer>
</template>
