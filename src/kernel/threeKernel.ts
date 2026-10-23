import * as THREE from 'three'
import type { Curve, Profile, Vec2, Vec3 } from '../model/geometry'
import { NotImplementedError, type BodyHandle, type Kernel } from './kernel'

const CIRCLE_SEGMENTS = 64
const ARC_SEGMENTS = 48

function sampleCircle(center: Vec2, radius: number, segments: number): Vec2[] {
  const points: Vec2[] = []
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    points.push({ x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius })
  }
  return points
}

function sampleArc(
  center: Vec2,
  radius: number,
  startAngle: number,
  endAngle: number,
  segments: number,
): Vec2[] {
  const sweep = endAngle - startAngle
  const steps = Math.max(1, Math.ceil((Math.abs(sweep) / (Math.PI * 2)) * segments))
  const points: Vec2[] = []
  for (let i = 0; i <= steps; i++) {
    const angle = startAngle + sweep * (i / steps)
    points.push({ x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius })
  }
  return points
}

/**
 * three.js + CSG kernel (Phase 0 / v1). Extrude and the primitive constructors are
 * implemented; the mechanical operations are stubbed until Phase 4.
 */
export class ThreeKernel implements Kernel {
  private readonly bodies = new Map<string, THREE.BufferGeometry>()
  private counter = 0

  private register(geometry: THREE.BufferGeometry): BodyHandle {
    this.counter += 1
    const id = `body-${this.counter}`
    this.bodies.set(id, geometry)
    return { id }
  }

  createBox(size: Vec3): BodyHandle {
    return this.register(new THREE.BoxGeometry(size.x, size.y, size.z))
  }

  createSphere(radius: number): BodyHandle {
    return this.register(new THREE.SphereGeometry(radius, 48, 48))
  }

  createCylinder(radius: number, height: number): BodyHandle {
    return this.register(new THREE.CylinderGeometry(radius, radius, height, 48))
  }

  extrude(profile: Profile, depth: number): BodyHandle {
    const shape = this.buildShape(profile)
    const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false })
    // Profile XY → world XZ (ground plane); extrusion +Z → world +Y (up).
    geometry.rotateX(-Math.PI / 2)
    return this.register(geometry)
  }

  revolve(): BodyHandle {
    throw new NotImplementedError('revolve')
  }

  boolean(): BodyHandle {
    throw new NotImplementedError('boolean')
  }

  fillet(): BodyHandle {
    throw new NotImplementedError('fillet')
  }

  chamfer(): BodyHandle {
    throw new NotImplementedError('chamfer')
  }

  shell(): BodyHandle {
    throw new NotImplementedError('shell')
  }

  tessellate(body: BodyHandle): THREE.BufferGeometry {
    const geometry = this.bodies.get(body.id)
    if (!geometry) throw new Error(`Unknown body handle: ${body.id}`)
    return geometry
  }

  private buildShape(profile: Profile): THREE.Shape {
    const outer = profile.loops[0]
    if (!outer || outer.length === 0) throw new Error('Profile must have an outer loop')

    const points = outer.flatMap((curve) => this.sampleCurve(curve))
    // Negate Y so the subsequent rotateX(-90°) maps the profile onto the XZ ground
    // plane without mirroring it (verified: top cap normal = +Y).
    const shape = new THREE.Shape(points.map((p) => new THREE.Vector2(p.x, -p.y)))
    shape.autoClose = true
    // TODO(Phase 1): add hole loops (profile.loops[1..]) via shape.holes with the
    // correct opposite winding.
    return shape
  }

  private sampleCurve(curve: Curve): Vec2[] {
    switch (curve.kind) {
      case 'line':
        return [curve.start, curve.end]
      case 'circle':
        return sampleCircle(curve.center, curve.radius, CIRCLE_SEGMENTS)
      case 'arc-center':
        return sampleArc(curve.center, curve.radius, curve.startAngle, curve.endAngle, ARC_SEGMENTS)
      case 'arc-3point':
        // TODO(Phase 1): sample a true circular arc through the three points.
        return [curve.start, curve.mid, curve.end]
      case 'arc-2point':
        // TODO(Phase 1): sample a true bulge arc.
        return [curve.start, curve.end]
      case 'spline':
        return curve.points
      default: {
        const exhaustive: never = curve
        return [exhaustive]
      }
    }
  }
}
