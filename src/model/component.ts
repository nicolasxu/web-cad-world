import type { Feature } from './feature'
import type { Vec3 } from './geometry'

export interface Transform {
  position: Vec3
  rotation: Vec3 // Euler angles in radians
  scale: Vec3
}

/**
 * A part: an ordered list of features (the "feature tree") plus a transform that
 * places it in the document. Plain, serializable data — never three.js objects.
 */
export interface Part {
  id: string
  name: string
  features: Feature[]
  transform: Transform
  color: string
  visible: boolean
}

/** The root document. Later this grows into a component/assembly tree. */
export interface Document {
  id: string
  parts: Part[]
}

export function defaultTransform(): Transform {
  return {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
  }
}
