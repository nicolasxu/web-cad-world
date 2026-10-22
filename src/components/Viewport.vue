<script setup lang="ts">
import { onMounted, onUnmounted, shallowRef } from 'vue'
import { storeToRefs } from 'pinia'
import { Grid, OrbitControls } from '@tresjs/cientos'
import { TresCanvas } from '@tresjs/core'
import { DoubleSide, MOUSE } from 'three'
import { useEditorStore } from '../stores/editor'
import type { SceneObject } from '../types'
import GuidanceAxes from './GuidanceAxes.vue'

const store = useEditorStore()
const { objects, selectedId } = storeToRefs(store)

const MAX_POLAR_ANGLE = Math.PI

// Mouse mapping: middle-drag rotates, wheel zooms, Shift+middle-drag pans.
const MOUSE_BUTTONS = {
  LEFT: MOUSE.ROTATE,
  MIDDLE: MOUSE.ROTATE,
  RIGHT: MOUSE.PAN,
}

interface ControlsHandle {
  instance: { value: { mouseButtons: Record<string, number> } | null }
}

const controls = shallowRef<ControlsHandle | null>(null)

function setMiddleAction(action: number): void {
  const instance = controls.value?.instance.value
  if (instance) instance.mouseButtons.MIDDLE = action
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Shift') setMiddleAction(MOUSE.PAN)
}

function onKeyUp(event: KeyboardEvent): void {
  if (event.key === 'Shift') setMiddleAction(MOUSE.ROTATE)
}

function resetMiddleAction(): void {
  setMiddleAction(MOUSE.ROTATE)
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('blur', resetMiddleAction)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('blur', resetMiddleAction)
})

function boxArgs(object: SceneObject): [number, number, number] {
  const { width, height, depth } = object.dimensions
  return [width, height, depth]
}

function sphereArgs(object: SceneObject): [number, number, number] {
  return [object.dimensions.width / 2, 48, 48]
}

function cylinderArgs(object: SceneObject): [number, number, number, number] {
  const { width, height } = object.dimensions
  return [width / 2, width / 2, height, 48]
}
</script>

<template>
  <main class="viewport">
    <TresCanvas clear-color="#eef0f2" @pointermissed="store.selectObject(null)">
      <TresPerspectiveCamera :position="[8, 6, 8]" :look-at="[0, 0, 0]" :fov="45" />

      <OrbitControls
        ref="controls"
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

      <template v-for="object in objects" :key="object.id">
        <TresMesh
          v-if="object.visible"
          :position="[object.position.x, object.position.y, object.position.z]"
          :name="object.name"
          @click="store.selectObject(object.id)"
        >
          <TresBoxGeometry v-if="object.type === 'box'" :args="boxArgs(object)" />
          <TresSphereGeometry v-else-if="object.type === 'sphere'" :args="sphereArgs(object)" />
          <TresCylinderGeometry v-else-if="object.type === 'cylinder'" :args="cylinderArgs(object)" />
          <TresMeshStandardMaterial
            :color="object.color"
            :roughness="0.35"
            :metalness="0.05"
            :emissive="selectedId === object.id ? '#ffffff' : '#000000'"
            :emissive-intensity="selectedId === object.id ? 0.35 : 0"
          />
        </TresMesh>
      </template>
    </TresCanvas>
  </main>
</template>
