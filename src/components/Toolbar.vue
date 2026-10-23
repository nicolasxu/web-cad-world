<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useEditorStore } from '../stores/editor'
import { registeredTools } from '../tools/registry'
import type { PrimitiveKind } from '../model'
import type { ToolId } from '../tools/types'

const store = useEditorStore()
const { activeTool, selectedId, canUndo, canRedo } = storeToRefs(store)

const tools = registeredTools()

const primitives: { id: PrimitiveKind; label: string }[] = [
  { id: 'box', label: 'Box' },
  { id: 'sphere', label: 'Sphere' },
  { id: 'cylinder', label: 'Cylinder' },
]

function onToolClick(id: ToolId): void {
  store.setTool(id)
}

function onDuplicate(): void {
  if (selectedId.value) store.duplicatePart(selectedId.value)
}

function onDelete(): void {
  if (selectedId.value) store.removePart(selectedId.value)
}
</script>

<template>
  <header class="toolbar">
    <div class="brand">web-cad-world</div>

    <div class="tools">
      <button
        v-for="tool in tools"
        :key="tool.metadata.id"
        class="tool"
        :class="{ active: activeTool === tool.metadata.id }"
        :title="tool.metadata.description"
        @click="onToolClick(tool.metadata.id)"
      >
        {{ tool.metadata.label }}
      </button>
    </div>

    <div class="tools">
      <button
        v-for="primitive in primitives"
        :key="primitive.id"
        class="tool"
        @click="store.addPrimitive(primitive.id)"
      >
        {{ primitive.label }}
      </button>
    </div>

    <div class="actions">
      <button class="tool" :disabled="!canUndo" @click="store.undo()">Undo</button>
      <button class="tool" :disabled="!canRedo" @click="store.redo()">Redo</button>
      <button class="tool" :disabled="!selectedId" @click="onDuplicate">Duplicate</button>
      <button class="tool danger" :disabled="!selectedId" @click="onDelete">Delete</button>
      <button class="tool" @click="store.clearScene()">Clear</button>
    </div>
  </header>
</template>
