<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useEditorStore } from '../stores/editor'

const store = useEditorStore()
const { objects, selectedId } = storeToRefs(store)
</script>

<template>
  <aside class="panel scene-tree">
    <div class="panel__header">Scene</div>
    <div class="panel__body">
      <div
        v-for="object in objects"
        :key="object.id"
        class="tree-row"
        :class="{ selected: selectedId === object.id }"
        @click="store.selectObject(object.id)"
      >
        <span class="badge">{{ object.type }}</span>
        <span class="name">{{ object.name }}</span>
        <button
          class="icon-btn"
          :title="object.visible ? 'Hide' : 'Show'"
          @click.stop="store.toggleVisibility(object.id)"
        >
          {{ object.visible ? '👁' : '◌' }}
        </button>
        <button
          class="icon-btn danger"
          title="Delete"
          @click.stop="store.removeObject(object.id)"
        >
          ✕
        </button>
      </div>

      <div v-if="objects.length === 0" class="empty-state">
        Empty scene.<br />Use the toolbar to add primitives.
      </div>
    </div>
  </aside>
</template>
