<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useEditorStore } from '../stores/editor'
import type { Part } from '../model'

const store = useEditorStore()
const { parts, selectedId } = storeToRefs(store)

function featureLabel(part: Part): string {
  const feature = part.features[0]
  if (!feature) return 'empty'
  switch (feature.kind) {
    case 'primitive':
      return feature.primitive
    case 'extrude':
      return 'extrude'
    case 'revolve':
      return 'revolve'
  }
}
</script>

<template>
  <aside class="panel scene-tree">
    <div class="panel__header">Scene</div>
    <div class="panel__body">
      <div
        v-for="part in parts"
        :key="part.id"
        class="tree-row"
        :class="{ selected: selectedId === part.id }"
        @click="store.selectPart(part.id)"
      >
        <span class="badge">{{ featureLabel(part) }}</span>
        <span class="name">{{ part.name }}</span>
        <button
          class="icon-btn"
          :title="part.visible ? 'Hide' : 'Show'"
          @click.stop="store.toggleVisibility(part.id)"
        >
          {{ part.visible ? '👁' : '◌' }}
        </button>
        <button class="icon-btn danger" title="Delete" @click.stop="store.removePart(part.id)">
          ✕
        </button>
      </div>

      <div v-if="parts.length === 0" class="empty-state">
        Empty scene.<br />Use the toolbar to add primitives.
      </div>
    </div>
  </aside>
</template>
