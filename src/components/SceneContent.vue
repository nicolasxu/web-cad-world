<script setup lang="ts">
import { onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useTresContext } from '@tresjs/core'
import * as THREE from 'three'
import { useEditorStore } from '../stores/editor'
import { useUiStore } from '../stores/ui'
import { PointerTracker, type PointerState } from '../interaction/PointerTracker'
import { ndcToRay, rayToWorkPlane } from '../interaction/plane'
import { snapToGrid } from '../interaction/snap'
import { ThreeKernel } from '../kernel/threeKernel'
import type { BodyHandle, Kernel } from '../kernel/kernel'
import { ToolController } from '../tools/ToolController'
import { getTool } from '../tools/registry'
import type { ToolContext, ToolPointerEvent } from '../tools/types'
import { createPreviewState } from '../render/previewRenderer'
import {
  DEFAULT_METALNESS,
  DEFAULT_ROUGHNESS,
  SELECT_EMISSIVE,
  SELECT_EMISSIVE_INTENSITY,
  UNSELECTED_EMISSIVE,
  UNSELECTED_EMISSIVE_INTENSITY,
} from '../render/materials'
import { GROUND_PLANE, type Feature, type Part } from '../model'

const GRID_CELL_SIZE = 0.5
const PARTS_GROUP_NAME = '__parts__'

const store = useEditorStore()
const ui = useUiStore()
const { parts, selectedId, activeTool } = storeToRefs(store)

const { scene, camera, renderer } = useTresContext()

const kernel: Kernel = new ThreeKernel()
const preview = createPreviewState()
const pointerTracker = shallowRef<PointerTracker | null>(null)

const geometryCache = new Map<string, { signature: string; geometry: THREE.BufferGeometry }>()

const controller = new ToolController(buildToolContext())

function buildToolContext(): ToolContext {
  return {
    setStatus: (message) => ui.setStatus(message),
    showPreview: (items) => preview.show(items),
    clearPreview: () => preview.clear(),
    commit: (part) => store.addPart(part),
    updatePart: (id, patch) => store.updatePart(id, patch),
    select: (id) => store.selectPart(id),
    removePart: (id) => store.removePart(id),
    pickEntity: (event) => pickPart(event.ndc),
    pickFace: () => null,
    cancel: () => store.setTool('select'),
    finish: () => store.setTool('select'),
  }
}

function pickPart(ndc: { x: number; y: number }): string | null {
  const group = scene.value.getObjectByName(PARTS_GROUP_NAME) as THREE.Group | null
  const cam = camera.activeCamera.value
  if (!group || !cam) return null

  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(new THREE.Vector2(ndc.x, ndc.y), cam)
  const hits = raycaster.intersectObjects(group.children, false)
  const hit = hits.find((h) => (h.object as THREE.Mesh).isMesh)
  return hit ? hit.object.name : null
}

function bodyFromFeature(feature: Feature): BodyHandle {
  switch (feature.kind) {
    case 'primitive':
      if (feature.primitive === 'box') return kernel.createBox(feature.size)
      if (feature.primitive === 'sphere') return kernel.createSphere(feature.size.x / 2)
      return kernel.createCylinder(feature.size.x / 2, feature.size.y)
    case 'extrude':
      return kernel.extrude(feature.profile, feature.depth)
    case 'revolve':
      return kernel.revolve(feature.profile, feature.axis, feature.angle)
  }
}

function geometryForPart(part: Part): THREE.BufferGeometry {
  const signature = JSON.stringify(part.features)
  const cached = geometryCache.get(part.id)
  if (cached && cached.signature === signature) return cached.geometry

  const feature = part.features[0]
  const geometry = feature
    ? kernel.tessellate(bodyFromFeature(feature))
    : new THREE.BufferGeometry()
  geometryCache.set(part.id, { signature, geometry })
  return geometry
}

function toToolPointerEvent(state: PointerState): ToolPointerEvent {
  const cam = camera.activeCamera.value
  const world = cam ? rayToWorkPlane(ndcToRay(cam, state.ndcX, state.ndcY), GROUND_PLANE) : null
  return {
    position: { x: state.x, y: state.y },
    ndc: { x: state.ndcX, y: state.ndcY },
    world,
    snapped: world ? snapToGrid(world, GRID_CELL_SIZE) : null,
    button: state.button,
    shiftKey: state.shiftKey,
    ctrlKey: state.ctrlKey,
    altKey: state.altKey,
  }
}

function attachPointerTracker(): void {
  const canvas = renderer.instance?.domElement
  if (!canvas || pointerTracker.value) return

  const tracker = new PointerTracker(canvas)
  tracker.onDown = (state) => controller.pointerDown(toToolPointerEvent(state))
  tracker.onMove = (state) => controller.pointerMove(toToolPointerEvent(state))
  tracker.onUp = (state) => controller.pointerUp(toToolPointerEvent(state))
  tracker.attach()
  pointerTracker.value = tracker
}

function onKeyDown(event: KeyboardEvent): void {
  const mod = event.ctrlKey || event.metaKey
  if (mod && event.key.toLowerCase() === 'z') {
    event.preventDefault()
    if (event.shiftKey) store.redo()
    else store.undo()
    return
  }
  if (event.key === 'Escape') controller.keyDown(event)
}

watch(
  () => renderer.isInitialized.value,
  (ready) => {
    if (ready) attachPointerTracker()
  },
  { immediate: true },
)

watch(
  () => activeTool.value,
  (toolId) => {
    const tool = getTool(toolId)
    if (tool) controller.activate(tool)
    else controller.deactivate()
  },
  { immediate: true },
)

onMounted(() => {
  attachPointerTracker()
  window.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
  pointerTracker.value?.detach()
  controller.deactivate()
})
</script>

<template>
  <TresGroup :name="PARTS_GROUP_NAME">
    <template v-for="part in parts" :key="part.id">
      <TresMesh
        v-if="part.visible"
        :name="part.id"
        :geometry="geometryForPart(part)"
        :position="[part.transform.position.x, part.transform.position.y, part.transform.position.z]"
        :rotation="[part.transform.rotation.x, part.transform.rotation.y, part.transform.rotation.z]"
        :scale="[part.transform.scale.x, part.transform.scale.y, part.transform.scale.z]"
      >
        <TresMeshStandardMaterial
          :color="part.color"
          :roughness="DEFAULT_ROUGHNESS"
          :metalness="DEFAULT_METALNESS"
          :emissive="selectedId === part.id ? SELECT_EMISSIVE : UNSELECTED_EMISSIVE"
          :emissive-intensity="selectedId === part.id ? SELECT_EMISSIVE_INTENSITY : UNSELECTED_EMISSIVE_INTENSITY"
        />
      </TresMesh>
    </template>
  </TresGroup>

  <!-- TODO(Phase 1): render `preview.items` (rubber-band previews) here. -->
</template>

