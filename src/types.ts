export type PrimitiveType = 'box' | 'sphere' | 'cylinder'

export type ToolId = 'select' | PrimitiveType

export interface Vec3 {
  x: number
  y: number
  z: number
}

/**
 * Semantic bounding-box dimensions for a primitive.
 * The meaning of each axis depends on the primitive type:
 * - box:      width / height / depth
 * - sphere:   width = diameter (height & depth are ignored)
 * - cylinder: width = diameter, height = height (depth is ignored)
 */
export interface Dimensions {
  width: number
  height: number
  depth: number
}

export interface SceneObject {
  id: string
  name: string
  type: PrimitiveType
  position: Vec3
  dimensions: Dimensions
  color: string
  visible: boolean
}
