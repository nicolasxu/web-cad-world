<script setup lang="ts">
import { Grid, OrbitControls } from '@tresjs/cientos'
import { TresCanvas } from '@tresjs/core'
import { DoubleSide, MOUSE } from 'three'
import GuidanceAxes from './GuidanceAxes.vue'
import SceneContent from './SceneContent.vue'

const MAX_POLAR_ANGLE = Math.PI

// Left button belongs to the active tool (routed in SceneContent). Orbit lives on
// middle-drag, pan on right-drag, zoom on wheel (OrbitControls default).
const MOUSE_BUTTONS = {
  LEFT: -1, // disable left so tools own it
  MIDDLE: MOUSE.ROTATE,
  RIGHT: MOUSE.PAN,
}
</script>

<template>
  <main class="viewport">
    <TresCanvas clear-color="#eef0f2">
      <TresPerspectiveCamera :position="[8, 6, 8]" :look-at="[0, 0, 0]" :fov="45" />

      <OrbitControls
        make-default
        :enable-damping="false"
        :mouse-buttons="MOUSE_BUTTONS"
        :max-polar-angle="MAX_POLAR_ANGLE"
      />

      <TresAmbientLight :intensity="0.65" />
      <TresDirectionalLight :position="[6, 10, 4]" :intensity="1.2" />
      <TresDirectionalLight :position="[-6, 4, -6]" :intensity="0.4" />

      <Grid
        :infinite-grid="true"
        :fade-distance="150"
        :cell-size="0.5"
        :cell-color="'#d6d9dc'"
        :section-size="5"
        :section-color="'#9aa0a6'"
        :side="DoubleSide"
      />

      <GuidanceAxes />

      <SceneContent />
    </TresCanvas>
  </main>
</template>
