import type { Vec3 } from '../model/geometry'
import type { PreviewGeometry, Tool, ToolContext, ToolMetadata, ToolPointerEvent } from './types'

/**
 * Shared base for "collect N points, show a rubber-band preview, commit on the last
 * click" draw tools (rectangle, circle, polygon, arcs, pie, freehand). Each concrete
 * tool only defines its point count and how to build geometry from the points.
 */
export abstract class PointCollectionTool implements Tool {
  abstract metadata: ToolMetadata
  abstract minPoints: number
  abstract maxPoints: number

  protected points: Vec3[] = []
  protected cursor: Vec3 | null = null

  abstract buildPreview(points: Vec3[], cursor: Vec3 | null): PreviewGeometry[]
  abstract commitPoints(points: Vec3[], ctx: ToolContext): void

  onActivate(ctx: ToolContext): void {
    this.reset()
    ctx.setStatus(this.metadata.description)
  }

  onDeactivate(ctx: ToolContext): void {
    this.reset()
    ctx.clearPreview()
  }

  onPointerMove(e: ToolPointerEvent, ctx: ToolContext): void {
    this.cursor = e.snapped
    ctx.showPreview(this.buildPreview(this.points, this.cursor))
  }

  onPointerDown(e: ToolPointerEvent, ctx: ToolContext): void {
    if (e.button !== 0) return
    const point = e.snapped
    if (!point) return

    this.points.push(point)
    if (this.points.length >= this.maxPoints) {
      this.commitPoints(this.points, ctx)
      this.reset()
      ctx.clearPreview()
    } else {
      ctx.showPreview(this.buildPreview(this.points, this.cursor))
    }
  }

  onPointerUp(): void {}

  onKeyDown(e: KeyboardEvent, ctx: ToolContext): void {
    if (e.key === 'Escape') {
      if (this.points.length > 0) {
        this.points.pop()
        ctx.showPreview(this.buildPreview(this.points, this.cursor))
      } else {
        ctx.cancel()
      }
    }
  }

  onDoubleClick(_e: ToolPointerEvent, ctx: ToolContext): void {
    if (this.points.length >= this.minPoints) {
      this.commitPoints(this.points, ctx)
      this.reset()
      ctx.clearPreview()
    }
  }

  private reset(): void {
    this.points = []
    this.cursor = null
  }
}
