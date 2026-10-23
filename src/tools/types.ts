import type { FaceRef } from '../kernel/kernel'
import type { Part } from '../model/component'
import type { Vec3 } from '../model/geometry'

export type ToolCategory = 'select' | 'draw' | 'edit' | 'erase'

export type ToolId =
  | 'select'
  | 'erase'
  | 'line'
  | 'rectangle'
  | 'rotated-rectangle'
  | 'circle'
  | 'polygon'
  | 'pie'
  | 'arc-2point'
  | 'arc-3point'
  | 'arc-center'
  | 'freehand'
  | 'push-pull'
  | 'move'
  | 'rotate'

export interface ToolMetadata {
  id: ToolId
  label: string
  category: ToolCategory
  shortcut?: string
  cursor?: string
  description: string
}

/** A pointer event normalized and resolved onto the active work plane. */
export interface ToolPointerEvent {
  /** Canvas-relative pixel position. */
  position: { x: number; y: number }
  /** Normalized device coordinates (-1..1). */
  ndc: { x: number; y: number }
  /** Un-snapped world point on the work plane (null if the ray missed). */
  world: Vec3 | null
  /** Grid/endpoint-snapped world point (null if `world` is null). */
  snapped: Vec3 | null
  button: number
  shiftKey: boolean
  ctrlKey: boolean
  altKey: boolean
}

/** In-progress drawing preview geometry (rendered by the preview renderer, Phase 1). */
export interface PreviewGeometry {
  id: string
  kind: 'polyline' | 'points'
  points: Vec3[]
  color?: string
}

/**
 * The narrow surface tools use to interact with the app. Tools never import the
 * store, kernel, or viewport directly — they operate through this context.
 */
export interface ToolContext {
  setStatus(message: string): void
  showPreview(items: PreviewGeometry[]): void
  clearPreview(): void
  commit(part: Part): void
  updatePart(id: string, patch: Partial<Omit<Part, 'id'>>): void
  select(id: string | null): void
  removePart(id: string): void
  pickEntity(event: ToolPointerEvent): string | null
  pickFace(event: ToolPointerEvent): FaceRef | null
  cancel(): void
  finish(): void
}

/** A pluggable tool: an isolated state machine driven by the framework. */
export interface Tool {
  metadata: ToolMetadata
  onActivate(ctx: ToolContext): void
  onDeactivate(ctx: ToolContext): void
  onPointerDown(e: ToolPointerEvent, ctx: ToolContext): void
  onPointerMove(e: ToolPointerEvent, ctx: ToolContext): void
  onPointerUp(e: ToolPointerEvent, ctx: ToolContext): void
  onKeyDown(e: KeyboardEvent, ctx: ToolContext): void
  onDoubleClick?(e: ToolPointerEvent, ctx: ToolContext): void
}
