<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useEditorStore } from '../stores/editor'
import type { ToolId } from '../types'

const store = useEditorStore()
const { activeTool, selectedId } = storeToRefs(store)

const tools: { id: ToolId; label: string }[] = [
  { id: 'select', label: 'Select' },
  { id: 'box', label: 'Box' },
  { id: 'sphere', label: 'Sphere' },
  { id: 'cylinder', label: 'Cylinder' },
]

function onToolClick(id: ToolId): void {
  if (id === 'select') {
    store.setTool('select')
  } else {
    store.addObject(id)
  }
}

function onDuplicate(): void {
  if (selectedId.value) store.duplicateObject(selectedId.value)
}

function onDelete(): void {
  if (selectedId.value) store.removeObject(selectedId.value)
}
</script>

<template>
  <header class="toolbar">
    <div class="brand">web-cad-world</div>

    <div class="tools">
      <button
        v-for="tool in tools"
        :key="tool.id"
        class="tool"
        :class="{ active: activeTool === tool.id }"
        @click="onToolClick(tool.id)"
      >
        {{ tool.label }}
      </button>
    </div>

    <div class="actions">
      <button class="tool" :disabled="!selectedId" @click="onDuplicate">Duplicate</button>
      <button class="tool danger" :disabled="!selectedId" @click="onDelete">Delete</button>
      <button class="tool" @click="store.clearScene()">Clear</button>
    </div>
  </header>
</template>
