import type { Tool, ToolId } from './types'
import { selectTool } from './tools/select'

/**
 * The tool registry. Adding a new tool = create `tools/tools/<id>.ts` and register
 * it here. Nothing else in the app needs to change.
 */
const toolFactories: Partial<Record<ToolId, () => Tool>> = {
  select: () => selectTool,
  // Phase 1: erase, line, rectangle, rotated-rectangle, circle, polygon, pie,
  //          arc-2point, arc-3point, arc-center, freehand.
  // Phase 2: push-pull.
  // Phase 3: move, rotate.
}

/** Ordered list of the tools currently shown in the toolbar. */
const TOOL_ORDER: ToolId[] = [
  'select',
  'erase',
  'line',
  'rectangle',
  'rotated-rectangle',
  'circle',
  'polygon',
  'pie',
  'arc-2point',
  'arc-3point',
  'arc-center',
  'freehand',
  'push-pull',
  'move',
  'rotate',
]

export function getTool(id: ToolId): Tool | null {
  const factory = toolFactories[id]
  return factory ? factory() : null
}

export function registeredTools(): Tool[] {
  return TOOL_ORDER.map((id) => getTool(id)).filter((tool): tool is Tool => tool !== null)
}
