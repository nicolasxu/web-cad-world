import * as THREE from 'three'
import type { Plane, Vec3 } from '../model/geometry'

export interface Ray {
  origin: THREE.Vector3
  direction: THREE.Vector3
}

/** Build a world-space ray from normalized device coordinates. */
export function ndcToRay(camera: THREE.Camera, ndcX: number, ndcY: number): Ray {
  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera)
  return { origin: raycaster.ray.origin, direction: raycaster.ray.direction }
}

/** Intersect a ray with a work plane; returns the world-space hit point or null. */
export function rayToWorkPlane(ray: Ray, plane: Plane): Vec3 | null {
  const normal = new THREE.Vector3(plane.normal.x, plane.normal.y, plane.normal.z)
  const point = new THREE.Vector3(plane.origin.x, plane.origin.y, plane.origin.z)
  const plane3 = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, point)

  const target = new THREE.Vector3()
  const hit = new THREE.Ray(ray.origin, ray.direction).intersectPlane(plane3, target)
  if (!hit) return null
  return { x: hit.x, y: hit.y, z: hit.z }
}
