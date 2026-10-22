<script setup lang="ts">
import { shallowRef } from 'vue'
import { useLoop, useTresContext } from '@tresjs/core'
import type { TresObject } from '@tresjs/core'
import * as THREE from 'three'

const { camera } = useTresContext()
const { onBeforeRender } = useLoop()

const xArrow = shallowRef<TresObject | null>(null)
const yArrow = shallowRef<TresObject | null>(null)
const zArrow = shallowRef<TresObject | null>(null)
const xLabel = shallowRef<TresObject | null>(null)
const yLabel = shallowRef<TresObject | null>(null)
const zLabel = shallowRef<TresObject | null>(null)

const ORIGIN = new THREE.Vector3(0, 0.02, 0)
const HEAD_LENGTH_RATIO = 0.12
const HEAD_WIDTH_RATIO = 0.06
// Fraction of the viewport height the arrows span.
const LENGTH_FACTOR = 0.7
const LABEL_OFFSET = 1.2
const LABEL_SIZE = 0.3

// Z points up (perpendicular to the plane); X and Y lie on the plane.
const X_DIR = new THREE.Vector3(1, 0, 0)
const Y_DIR = new THREE.Vector3(0, 0, 1)
const Z_DIR = new THREE.Vector3(0, 1, 0)

type AxisArgs = [THREE.Vector3, THREE.Vector3, number, number, number, number]

const X_ARROW_ARGS: AxisArgs = [X_DIR, ORIGIN, 1, 0xef4444, HEAD_LENGTH_RATIO, HEAD_WIDTH_RATIO]
const Y_ARROW_ARGS: AxisArgs = [Y_DIR, ORIGIN, 1, 0x22c55e, HEAD_LENGTH_RATIO, HEAD_WIDTH_RATIO]
const Z_ARROW_ARGS: AxisArgs = [Z_DIR, ORIGIN, 1, 0x3b82f6, HEAD_LENGTH_RATIO, HEAD_WIDTH_RATIO]

function createLabelTexture(text: string, color: string): THREE.CanvasTexture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (context) {
    context.font = 'bold 88px system-ui, sans-serif'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillStyle = color
    context.fillText(text, size / 2, size / 2)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.minFilter = THREE.LinearFilter
  return texture
}

const X_LABEL_TEXTURE = createLabelTexture('X', '#ef4444')
const Y_LABEL_TEXTURE = createLabelTexture('Y', '#22c55e')
const Z_LABEL_TEXTURE = createLabelTexture('Z', '#3b82f6')

function setArrowLength(arrow: unknown, length: number, headLength: number, headWidth: number): void {
  const helper = arrow as THREE.ArrowHelper | null
  helper?.setLength(length, headLength, headWidth)
}

function placeLabel(label: unknown, direction: THREE.Vector3, length: number): void {
  const sprite = label as THREE.Sprite | null
  if (!sprite) return
  sprite.position.copy(direction).multiplyScalar(length * LABEL_OFFSET).add(ORIGIN)
  sprite.scale.setScalar(length * LABEL_SIZE)
}

onBeforeRender(() => {
  const cam = camera.activeCamera.value as THREE.PerspectiveCamera | undefined
  if (!cam) return

  // Keep the arrows at a constant fraction of the viewport height,
  // independent of zoom: visibleHeight at origin = 2 * distance * tan(fov / 2).
  const distance = cam.position.length()
  const length = distance * Math.tan((cam.fov * Math.PI) / 360) * LENGTH_FACTOR
  const headLength = length * HEAD_LENGTH_RATIO
  const headWidth = length * HEAD_WIDTH_RATIO

  setArrowLength(xArrow.value, length, headLength, headWidth)
  setArrowLength(yArrow.value, length, headLength, headWidth)
  setArrowLength(zArrow.value, length, headLength, headWidth)

  placeLabel(xLabel.value, X_DIR, length)
  placeLabel(yLabel.value, Y_DIR, length)
  placeLabel(zLabel.value, Z_DIR, length)
})
</script>

<template>
  <!-- Guidance axes: X (red), Y (green), Z (blue, up / perpendicular to the plane) -->
  <TresArrowHelper ref="xArrow" :args="X_ARROW_ARGS" />
  <TresArrowHelper ref="yArrow" :args="Y_ARROW_ARGS" />
  <TresArrowHelper ref="zArrow" :args="Z_ARROW_ARGS" />

  <TresSprite ref="xLabel">
    <TresSpriteMaterial :map="X_LABEL_TEXTURE" :depth-test="false" :transparent="true" />
  </TresSprite>
  <TresSprite ref="yLabel">
    <TresSpriteMaterial :map="Y_LABEL_TEXTURE" :depth-test="false" :transparent="true" />
  </TresSprite>
  <TresSprite ref="zLabel">
    <TresSpriteMaterial :map="Z_LABEL_TEXTURE" :depth-test="false" :transparent="true" />
  </TresSprite>
</template>
