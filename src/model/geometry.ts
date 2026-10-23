export interface Vec2 {
  x: number
  y: number
}

export interface Vec3 {
  x: number
  y: number
  z: number
}

/** A plane defined by an origin point and a unit normal. */
export interface Plane {
  origin: Vec3
  normal: Vec3
}

/** A rotation axis (used by the `revolve` feature, Phase 4). */
export interface Axis {
  origin: Vec3
  direction: Vec3
}

/**
 * A 2D curve in profile space. Profiles live on a `Plane`; the 2D coordinates are
 * mapped to that plane by the kernel when extruding/revolving.
 */
export type Curve =
  | { kind: 'line'; start: Vec2; end: Vec2 }
  | { kind: 'arc-2point'; start: Vec2; end: Vec2; bulge: number }
  | { kind: 'arc-3point'; start: Vec2; mid: Vec2; end: Vec2 }
  | { kind: 'arc-center'; center: Vec2; radius: number; startAngle: number; endAngle: number }
  | { kind: 'circle'; center: Vec2; radius: number }
  | { kind: 'spline'; points: Vec2[] }

/**
 * A closed, planar region: one outer loop plus optional hole loops.
 * Each loop is an ordered ring of curves.
 */
export interface Profile {
  id: string
  plane: Plane
  loops: Curve[][]
}

/**
 * The default drawing plane: the ground plane (XZ at y=0, up = +Y).
 * Profiles are expressed in (x, z) mapped to 2D (x, y).
 */
export const GROUND_PLANE: Plane = {
  origin: { x: 0, y: 0, z: 0 },
  normal: { x: 0, y: 1, z: 0 },
}

export function vec2(x: number, y: number): Vec2 {
  return { x, y }
}

export function vec3(x: number, y: number, z: number): Vec3 {
  return { x, y, z }
}
