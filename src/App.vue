<script setup lang="ts">
import PropertiesPanel from './components/PropertiesPanel.vue'
import SceneTree from './components/SceneTree.vue'
import StatusBar from './components/StatusBar.vue'
import Toolbar from './components/Toolbar.vue'
import Viewport from './components/Viewport.vue'
</script>

<template>
  <div class="app-shell">
    <Toolbar />
    <SceneTree />
    <Viewport />
    <PropertiesPanel />
    <StatusBar />
  </div>
</template>
