<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useEditorStore } from '../stores/editor'

const store = useEditorStore()
const { selectedObject } = storeToRefs(store)

const UNIT = 'mm'

function setName(event: Event): void {
  const object = selectedObject.value
  if (!object) return
  store.updateObject(object.id, { name: (event.target as HTMLInputElement).value })
}

function setColor(event: Event): void {
  const object = selectedObject.value
  if (!object) return
  store.updateObject(object.id, { color: (event.target as HTMLInputElement).value })
}

function setPosition(key: 'x' | 'y' | 'z', event: Event): void {
  const object = selectedObject.value
  if (!object) return
  const value = Number((event.target as HTMLInputElement).value)
  if (!Number.isFinite(value)) return
  store.updateObject(object.id, { position: { ...object.position, [key]: value } })
}

function setDimension(key: 'width' | 'height' | 'depth', event: Event): void {
  const object = selectedObject.value
  if (!object) return
  const value = Number((event.target as HTMLInputElement).value)
  if (!Number.isFinite(value)) return
  store.updateObject(object.id, { dimensions: { ...object.dimensions, [key]: value } })
}
</script>

<template>
  <aside class="panel properties">
    <div class="panel__header">Properties</div>
    <div class="panel__body">
      <div v-if="selectedObject">
        <div class="field">
          <label>Name</label>
          <input type="text" :value="selectedObject.name" @input="setName" />
        </div>

        <div class="field">
          <label>Position</label>
          <div class="row">
            <div class="col">
              <span>X</span>
              <input
                type="number"
                step="0.1"
                :value="selectedObject.position.x"
                @input="setPosition('x', $event)"
              />
            </div>
            <div class="col">
              <span>Y</span>
              <input
                type="number"
                step="0.1"
                :value="selectedObject.position.y"
                @input="setPosition('y', $event)"
              />
            </div>
            <div class="col">
              <span>Z</span>
              <input
                type="number"
                step="0.1"
                :value="selectedObject.position.z"
                @input="setPosition('z', $event)"
              />
            </div>
          </div>
        </div>

        <div class="field">
          <label>Dimensions</label>
          <template v-if="selectedObject.type === 'box'">
            <div class="row">
              <div class="col">
                <span>Width</span>
                <div class="input-with-unit">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    :value="selectedObject.dimensions.width"
                    @input="setDimension('width', $event)"
                  />
                  <span class="unit">{{ UNIT }}</span>
                </div>
              </div>
              <div class="col">
                <span>Height</span>
                <div class="input-with-unit">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    :value="selectedObject.dimensions.height"
                    @input="setDimension('height', $event)"
                  />
                  <span class="unit">{{ UNIT }}</span>
                </div>
              </div>
              <div class="col">
                <span>Depth</span>
                <div class="input-with-unit">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    :value="selectedObject.dimensions.depth"
                    @input="setDimension('depth', $event)"
                  />
                  <span class="unit">{{ UNIT }}</span>
                </div>
              </div>
            </div>
          </template>
          <template v-else-if="selectedObject.type === 'sphere'">
            <div class="row">
              <div class="col">
                <span>Diameter</span>
                <div class="input-with-unit">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    :value="selectedObject.dimensions.width"
                    @input="setDimension('width', $event)"
                  />
                  <span class="unit">{{ UNIT }}</span>
                </div>
              </div>
            </div>
          </template>
          <template v-else-if="selectedObject.type === 'cylinder'">
            <div class="row">
              <div class="col">
                <span>Diameter</span>
                <div class="input-with-unit">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    :value="selectedObject.dimensions.width"
                    @input="setDimension('width', $event)"
                  />
                  <span class="unit">{{ UNIT }}</span>
                </div>
              </div>
              <div class="col">
                <span>Height</span>
                <div class="input-with-unit">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    :value="selectedObject.dimensions.height"
                    @input="setDimension('height', $event)"
                  />
                  <span class="unit">{{ UNIT }}</span>
                </div>
              </div>
            </div>
          </template>
        </div>

        <div class="field">
          <label>Color</label>
          <input type="color" :value="selectedObject.color" @input="setColor" />
        </div>
      </div>

      <div v-else class="empty-state">No object selected</div>
    </div>
  </aside>
</template>
