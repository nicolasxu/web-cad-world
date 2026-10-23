import type { Tool, ToolContext, ToolPointerEvent } from './types'

/**
 * Owns the active tool's lifecycle and routes events to it. The store only knows
 * the active `ToolId`; this controller resolves it through the registry and drives
 * the tool instance.
 */
export class ToolController {
  private tool: Tool | null = null
  private readonly ctx: ToolContext

  constructor(ctx: ToolContext) {
    this.ctx = ctx
  }

  activate(tool: Tool): void {
    if (this.tool === tool) return
    this.tool?.onDeactivate(this.ctx)
    this.tool = tool
    this.tool.onActivate(this.ctx)
  }

  deactivate(): void {
    this.tool?.onDeactivate(this.ctx)
    this.tool = null
  }

  get active(): Tool | null {
    return this.tool
  }

  pointerDown(event: ToolPointerEvent): void {
    this.tool?.onPointerDown(event, this.ctx)
  }

  pointerMove(event: ToolPointerEvent): void {
    this.tool?.onPointerMove(event, this.ctx)
  }

  pointerUp(event: ToolPointerEvent): void {
    this.tool?.onPointerUp(event, this.ctx)
  }

  keyDown(event: KeyboardEvent): void {
    this.tool?.onKeyDown(event, this.ctx)
  }

  doubleClick(event: ToolPointerEvent): void {
    this.tool?.onDoubleClick?.(event, this.ctx)
  }
}
