import type { Axis, Profile, Vec3 } from './geometry'

/** Legacy primitive kinds kept available until sketch tools + revolve land. */
export type PrimitiveKind = 'box' | 'sphere' | 'cylinder'

/**
 * A single step in a part's parametric history.
 *
 * - `extrude` turns a planar profile into a solid (Push/Pull).
 * - `revolve` sweeps a profile around an axis (Phase 4).
 * - `primitive` is a temporary stand-in for the original box/sphere/cylinder
 *   primitives until they are expressed as extrude/revolve features.
 */
export type Feature =
  | { id: string; kind: 'extrude'; profile: Profile; depth: number }
  | { id: string; kind: 'revolve'; profile: Profile; axis: Axis; angle: number }
  | { id: string; kind: 'primitive'; primitive: PrimitiveKind; size: Vec3 }
