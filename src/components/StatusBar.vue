<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useEditorStore } from '../stores/editor'
import { useUiStore } from '../stores/ui'

const store = useEditorStore()
const ui = useUiStore()
const { activeTool, partCount, selectedPart } = storeToRefs(store)
const { statusMessage } = storeToRefs(ui)
</script>

<template>
  <footer class="status-bar">
    <span>Tool: {{ activeTool }}</span>
    <span v-if="statusMessage" class="hint">{{ statusMessage }}</span>
    <span class="spacer" />
    <span v-if="selectedPart">Selected: {{ selectedPart.name }}</span>
    <span v-else>Nothing selected</span>
    <span class="spacer" />
    <span>{{ partCount }} part{{ partCount === 1 ? '' : 's' }}</span>
  </footer>
</template>
