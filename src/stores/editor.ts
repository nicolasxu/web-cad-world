import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Dimensions, PrimitiveType, SceneObject, ToolId, Vec3 } from '../types'

const PRIMITIVE_LABELS: Record<PrimitiveType, string> = {
  box: 'Box',
  sphere: 'Sphere',
  cylinder: 'Cylinder',
}

const PALETTE = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#f97316',
  '#84cc16',
]

const SPAWN_SPACING = 2.5
const SPAWN_PER_ROW = 4

let idCounter = 0

function nextId(): string {
  idCounter += 1
  return `object-${idCounter}`
}

function defaultDimensions(type: PrimitiveType): Dimensions {
  switch (type) {
    case 'box':
      return { width: 2, height: 2, depth: 2 }
    case 'sphere':
      return { width: 2, height: 2, depth: 2 }
    case 'cylinder':
      return { width: 2, height: 3, depth: 2 }
  }
}

function defaultColor(index: number): string {
  return PALETTE[index % PALETTE.length] ?? '#3b82f6'
}

function spawnPosition(index: number, dimensions: Dimensions): Vec3 {
  const column = index % SPAWN_PER_ROW
  const row = Math.floor(index / SPAWN_PER_ROW)
  return {
    x: (column - (SPAWN_PER_ROW - 1) / 2) * SPAWN_SPACING,
    y: dimensions.height / 2,
    z: row * SPAWN_SPACING,
  }
}

export const useEditorStore = defineStore('editor', () => {
  const objects = ref<SceneObject[]>([])
  const selectedId = ref<string | null>(null)
  const activeTool = ref<ToolId>('select')

  const selectedObject = computed<SceneObject | null>(() => {
    return objects.value.find((object) => object.id === selectedId.value) ?? null
  })

  const objectCount = computed(() => objects.value.length)

  function setTool(tool: ToolId): void {
    activeTool.value = tool
  }

  function addObject(type: PrimitiveType): SceneObject {
    const index = objects.value.length
    const dimensions = defaultDimensions(type)
    const object: SceneObject = {
      id: nextId(),
      name: `${PRIMITIVE_LABELS[type]} ${objects.value.filter((o) => o.type === type).length + 1}`,
      type,
      position: spawnPosition(index, dimensions),
      dimensions,
      color: defaultColor(index),
      visible: true,
    }
    objects.value.push(object)
    selectedId.value = object.id
    activeTool.value = type
    return object
  }

  function selectObject(id: string | null): void {
    selectedId.value = id
  }

  function updateObject(id: string, patch: Partial<Omit<SceneObject, 'id' | 'type'>>): void {
    const object = objects.value.find((o) => o.id === id)
    if (object) Object.assign(object, patch)
  }

  function removeObject(id: string): void {
    objects.value = objects.value.filter((o) => o.id !== id)
    if (selectedId.value === id) selectedId.value = null
  }

  function duplicateObject(id: string): void {
    const source = objects.value.find((o) => o.id === id)
    if (!source) return
    const copy: SceneObject = {
      ...source,
      id: nextId(),
      name: `${source.name} copy`,
      position: { ...source.position, x: source.position.x + SPAWN_SPACING },
    }
    objects.value.push(copy)
    selectedId.value = copy.id
  }

  function toggleVisibility(id: string): void {
    const object = objects.value.find((o) => o.id === id)
    if (object) object.visible = !object.visible
  }

  function clearScene(): void {
    objects.value = []
    selectedId.value = null
    activeTool.value = 'select'
  }

  return {
    objects,
    selectedId,
    activeTool,
    selectedObject,
    objectCount,
    setTool,
    addObject,
    selectObject,
    updateObject,
    removeObject,
    duplicateObject,
    toggleVisibility,
    clearScene,
  }
})
