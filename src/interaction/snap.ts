import type { Vec3 } from '../model/geometry'

/**
 * Snap a world point to a grid aligned with the work plane.
 * Phase 0: grid snap only. Endpoint/midpoint/center and angle inference land later.
 */
export function snapToGrid(point: Vec3, cellSize: number): Vec3 {
  return {
    x: Math.round(point.x / cellSize) * cellSize,
    y: Math.round(point.y / cellSize) * cellSize,
    z: Math.round(point.z / cellSize) * cellSize,
  }
}
