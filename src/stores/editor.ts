import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Feature, Part, PrimitiveKind, Vec3 } from '../model'
import type { ToolId } from '../tools/types'

const PRIMITIVE_LABELS: Record<PrimitiveKind, string> = {
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
const MAX_HISTORY = 100

let idCounter = 0

function nextId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${idCounter}`
}

function defaultSize(kind: PrimitiveKind): Vec3 {
  switch (kind) {
    case 'box':
      return { x: 2, y: 2, z: 2 }
    case 'sphere':
      return { x: 2, y: 2, z: 2 }
    case 'cylinder':
      return { x: 2, y: 3, z: 2 }
  }
}

function defaultColor(index: number): string {
  return PALETTE[index % PALETTE.length] ?? '#3b82f6'
}

function spawnPosition(index: number, size: Vec3): Vec3 {
  const column = index % SPAWN_PER_ROW
  const row = Math.floor(index / SPAWN_PER_ROW)
  return {
    x: (column - (SPAWN_PER_ROW - 1) / 2) * SPAWN_SPACING,
    y: size.y / 2,
    z: row * SPAWN_SPACING,
  }
}

function primitiveOf(part: Part): PrimitiveKind | null {
  const feature = part.features[0]
  return feature && feature.kind === 'primitive' ? feature.primitive : null
}

function clonePart(part: Part): Part {
  return JSON.parse(JSON.stringify(part)) as Part
}

export const useEditorStore = defineStore('editor', () => {
  const parts = ref<Part[]>([])
  const selectedId = ref<string | null>(null)
  const activeTool = ref<ToolId>('select')

  const undoStack = ref<Part[][]>([])
  const redoStack = ref<Part[][]>([])

  const selectedPart = computed<Part | null>(
    () => parts.value.find((part) => part.id === selectedId.value) ?? null,
  )
  const partCount = computed(() => parts.value.length)
  const canUndo = computed(() => undoStack.value.length > 0)
  const canRedo = computed(() => redoStack.value.length > 0)

  function snapshot(): Part[] {
    return parts.value.map((part) => clonePart(part))
  }

  function recordHistory(): void {
    undoStack.value.push(snapshot())
    if (undoStack.value.length > MAX_HISTORY) undoStack.value.shift()
    redoStack.value = []
  }

  function setTool(tool: ToolId): void {
    activeTool.value = tool
  }

  function selectPart(id: string | null): void {
    selectedId.value = id
  }

  function addPart(part: Part): Part {
    recordHistory()
    parts.value.push(part)
    selectedId.value = part.id
    return part
  }

  function addPrimitive(kind: PrimitiveKind): Part {
    const index = parts.value.length
    const size = defaultSize(kind)
    const count = parts.value.filter((part) => primitiveOf(part) === kind).length + 1
    const part: Part = {
      id: nextId('part'),
      name: `${PRIMITIVE_LABELS[kind]} ${count}`,
      features: [{ id: nextId('feature'), kind: 'primitive', primitive: kind, size }],
      transform: {
        position: spawnPosition(index, size),
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      color: defaultColor(index),
      visible: true,
    }
    return addPart(part)
  }

  function updatePart(id: string, patch: Partial<Omit<Part, 'id'>>): void {
    const part = parts.value.find((p) => p.id === id)
    if (!part) return
    recordHistory()
    Object.assign(part, patch)
  }

  function updateFeature(partId: string, featureId: string, patch: Partial<Feature>): void {
    const part = parts.value.find((p) => p.id === partId)
    const feature = part?.features.find((f) => f.id === featureId)
    if (!part || !feature) return
    recordHistory()
    Object.assign(feature, patch)
  }

  function removePart(id: string): void {
    recordHistory()
    parts.value = parts.value.filter((p) => p.id !== id)
    if (selectedId.value === id) selectedId.value = null
  }

  function duplicatePart(id: string): void {
    const source = parts.value.find((p) => p.id === id)
    if (!source) return
    recordHistory()
    const copy = clonePart(source)
    copy.id = nextId('part')
    copy.name = `${source.name} copy`
    copy.features = copy.features.map((feature) => ({ ...feature, id: nextId('feature') }))
    copy.transform = {
      ...copy.transform,
      position: { ...copy.transform.position, x: copy.transform.position.x + SPAWN_SPACING },
    }
    parts.value.push(copy)
    selectedId.value = copy.id
  }

  function toggleVisibility(id: string): void {
    const part = parts.value.find((p) => p.id === id)
    if (!part) return
    recordHistory()
    part.visible = !part.visible
  }

  function clearScene(): void {
    recordHistory()
    parts.value = []
    selectedId.value = null
    activeTool.value = 'select'
  }

  function undo(): void {
    const previous = undoStack.value.pop()
    if (!previous) return
    redoStack.value.push(snapshot())
    parts.value = previous
    if (selectedId.value && !previous.some((part) => part.id === selectedId.value)) {
      selectedId.value = null
    }
  }

  function redo(): void {
    const next = redoStack.value.pop()
    if (!next) return
    undoStack.value.push(snapshot())
    parts.value = next
    if (selectedId.value && !next.some((part) => part.id === selectedId.value)) {
      selectedId.value = null
    }
  }

  return {
    parts,
    selectedId,
    activeTool,
    selectedPart,
    partCount,
    canUndo,
    canRedo,
    setTool,
    selectPart,
    addPart,
    addPrimitive,
    updatePart,
    updateFeature,
    removePart,
    duplicatePart,
    toggleVisibility,
    clearScene,
    undo,
    redo,
  }
})
