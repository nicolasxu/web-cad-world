<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '../stores/editor'
import type { Feature } from '../model'

type PrimitiveFeature = Extract<Feature, { kind: 'primitive' }>

const store = useEditorStore()
const { selectedPart } = storeToRefs(store)

const UNIT = 'mm'

const primitiveFeature = computed<PrimitiveFeature | null>(() => {
  const part = selectedPart.value
  if (!part) return null
  return part.features.find((feature): feature is PrimitiveFeature => feature.kind === 'primitive') ?? null
})

function setName(event: Event): void {
  const part = selectedPart.value
  if (!part) return
  store.updatePart(part.id, { name: (event.target as HTMLInputElement).value })
}

function setColor(event: Event): void {
  const part = selectedPart.value
  if (!part) return
  store.updatePart(part.id, { color: (event.target as HTMLInputElement).value })
}

function setPosition(key: 'x' | 'y' | 'z', event: Event): void {
  const part = selectedPart.value
  if (!part) return
  const value = Number((event.target as HTMLInputElement).value)
  if (!Number.isFinite(value)) return
  store.updatePart(part.id, {
    transform: { ...part.transform, position: { ...part.transform.position, [key]: value } },
  })
}

function setSize(key: 'x' | 'y' | 'z', event: Event): void {
  const part = selectedPart.value
  const feature = primitiveFeature.value
  if (!part || !feature) return
  const value = Number((event.target as HTMLInputElement).value)
  if (!Number.isFinite(value)) return
  store.updateFeature(part.id, feature.id, { size: { ...feature.size, [key]: value } })
}
</script>

<template>
  <aside class="panel properties">
    <div class="panel__header">Properties</div>
    <div class="panel__body">
      <div v-if="selectedPart">
        <div class="field">
          <label>Name</label>
          <input type="text" :value="selectedPart.name" @input="setName" />
        </div>

        <div class="field">
          <label>Position</label>
          <div class="row">
            <div class="col">
              <span>X</span>
              <input
                type="number"
                step="0.1"
                :value="selectedPart.transform.position.x"
                @input="setPosition('x', $event)"
              />
            </div>
            <div class="col">
              <span>Y</span>
              <input
                type="number"
                step="0.1"
                :value="selectedPart.transform.position.y"
                @input="setPosition('y', $event)"
              />
            </div>
            <div class="col">
              <span>Z</span>
              <input
                type="number"
                step="0.1"
                :value="selectedPart.transform.position.z"
                @input="setPosition('z', $event)"
              />
            </div>
          </div>
        </div>

        <div class="field">
          <label>Dimensions</label>
          <template v-if="primitiveFeature && primitiveFeature.primitive === 'box'">
            <div class="row">
              <div class="col">
                <span>Width</span>
                <div class="input-with-unit">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    :value="primitiveFeature.size.x"
                    @input="setSize('x', $event)"
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
                    :value="primitiveFeature.size.y"
                    @input="setSize('y', $event)"
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
                    :value="primitiveFeature.size.z"
                    @input="setSize('z', $event)"
                  />
                  <span class="unit">{{ UNIT }}</span>
                </div>
              </div>
            </div>
          </template>
          <template v-else-if="primitiveFeature && primitiveFeature.primitive === 'sphere'">
            <div class="row">
              <div class="col">
                <span>Diameter</span>
                <div class="input-with-unit">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    :value="primitiveFeature.size.x"
                    @input="setSize('x', $event)"
                  />
                  <span class="unit">{{ UNIT }}</span>
                </div>
              </div>
            </div>
          </template>
          <template v-else-if="primitiveFeature && primitiveFeature.primitive === 'cylinder'">
            <div class="row">
              <div class="col">
                <span>Diameter</span>
                <div class="input-with-unit">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    :value="primitiveFeature.size.x"
                    @input="setSize('x', $event)"
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
                    :value="primitiveFeature.size.y"
                    @input="setSize('y', $event)"
                  />
                  <span class="unit">{{ UNIT }}</span>
                </div>
              </div>
            </div>
          </template>
          <template v-else>
            <span class="unit">No editable dimensions for this feature.</span>
          </template>
        </div>

        <div class="field">
          <label>Color</label>
          <input type="color" :value="selectedPart.color" @input="setColor" />
        </div>
      </div>

      <div v-else class="empty-state">No object selected</div>
    </div>
  </aside>
</template>

