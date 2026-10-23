import type * as THREE from 'three'
import type { Axis, Profile, Vec3 } from '../model/geometry'

export type BooleanOp = 'union' | 'subtract' | 'intersect'

/**
 * An opaque handle to a solid body owned by a kernel implementation.
 * The document stores these (via the render layer), never raw geometry.
 */
export interface BodyHandle {
  id: string
}

export interface EdgeRef {
  body: BodyHandle
  index: number
}

export interface FaceRef {
  body: BodyHandle
  index: number
}

export class NotImplementedError extends Error {
  constructor(operation: string) {
    super(`Kernel operation not implemented: ${operation}`)
    this.name = 'NotImplementedError'
  }
}

/**
 * The swappable geometry kernel seam.
 *
 * Phase 0 ships `threeKernel.ts` (extrude + primitives). Phase 4 adds the
 * mechanical ops and swaps in `occtKernel.ts` (OpenCascade.js) behind the same
 * interface — nothing above this seam changes.
 */
export interface Kernel {
  createBox(size: Vec3): BodyHandle
  createSphere(radius: number): BodyHandle
  createCylinder(radius: number, height: number): BodyHandle
  extrude(profile: Profile, depth: number): BodyHandle
  revolve(profile: Profile, axis: Axis, angle: number): BodyHandle
  boolean(op: BooleanOp, a: BodyHandle, b: BodyHandle): BodyHandle
  fillet(body: BodyHandle, edge: EdgeRef, radius: number): BodyHandle
  chamfer(body: BodyHandle, edge: EdgeRef, distance: number): BodyHandle
  shell(body: BodyHandle, faces: FaceRef[], thickness: number): BodyHandle
  tessellate(body: BodyHandle): THREE.BufferGeometry
}
