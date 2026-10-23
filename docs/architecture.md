# Web CAD World — Architecture Design Doc

> Status: **In progress** — Phase 0 (foundation) complete.
> Last updated: 2026-10-22

## Progress

- [x] **Phase 0 — Foundation** — swappable `Kernel` seam (`threeKernel`), parametric document
      model (`Part` / `Feature` / `Profile`), tool framework + Select tool, interaction pipeline
      (pointer → work-plane → snap), OrbitControls remap (left button → tool), snapshot undo/redo.
      Verified: `npm run build` passes + dev-server smoke test.
- [ ] **Phase 1 — Sketch tools** — Line, Rectangle, Rotated rect, Circle, Polygon, Pie,
      Arc 2pt, Arc 3pt, Arc center, Freehand.
- [ ] **Phase 2 — Solid** — Push/Pull = Extrude feature; feature-tree edits.
- [ ] **Phase 3 — Edit tools** — Erase, Move (gizmo), Rotate (gizmo).
- [ ] **Phase 4 — Mechanical** — Revolve, Boolean (CSG), Fillet/Chamfer → `occtKernel` swap.
- [ ] **Phase 5 — Parametric depth** — constraints/dimensions, patterns, assemblies, STEP.

## 1. Overview & goals

**Objective:** design real industrial parts and complex things — e.g. a motorcycle, an
electric motor casing, a building. The app must support precision mechanical modeling, not
just quick conceptual massing.

**Working method:** features are built **one at a time**. The architecture exists so that
adding a new tool is a small, isolated change (one new file + one registry entry), never a
rewrite of the core.

The requested tool set is:

> Select, Erase, Rectangle, Push & Pull (extrude), Move, Rotate, Circle, 2-point arc, arc,
> Polygon, 3-point arc, Pie, Freehand, Rotated rectangle.

## 2. Current state

**Stack:** Vue 3 (`<script setup>`) + TypeScript + TresJS/three.js + Pinia + Vite.

**Document model** (`src/types.ts`): `SceneObject { id, name, type, position, dimensions,
color, visible }`. Plain, serializable data, kept separate from the Three.js scene. The store
owns the data; `Viewport.vue` maps it declaratively to `<Tres*>` components.

**Current limitations:**

- Primitives are auto-spawned in a grid; there is no interactive drawing.
- `type` is a closed union (`'box' | 'sphere' | 'cylinder'`) and cannot express rotation,
  extruded profiles, or freeform shapes.
- `OrbitControls` is mapped so **left-drag = orbit**. Every CAD tool needs left-click/drag on
  the canvas, so this mapping must be changed before any interactive tool can work.

## 3. Modeling paradigm decision

**Chosen paradigm: parametric, feature-based modeling** (SolidWorks / Fusion 360 / FreeCAD
style). This is the industry standard for mechanical design and is the right model for motor
casings and machine components.

Direct (SketchUp-style) modeling was rejected for the core because it makes precise mechanical
edits painful. A motor casing requires **revolve, extrude, fillet/chamfer, hole + circular
pattern, and shell** — all of which are naturally re-editable *features* in parametric CAD.

The requested tool list maps cleanly onto parametric vocabulary:

| Requested tool | Parametric equivalent |
| --- | --- |
| Rectangle, Circle, Polygon, Pie, arcs ×3, Freehand, Rotated rect | **Sketch tools** (draw a 2D profile) |
| Push & Pull | **Extrude feature** (sketch → 3D solid) |
| Select, Erase, Move, Rotate | General editing (sketch editing / body transform) |

The architecture therefore has two layers:

1. **UX layer** — direct manipulation: click/drag on the canvas, rubber-band previews, gizmos.
2. **Engine layer** — parametric document: sketches → features → solid bodies, with a history
   tree and regeneration.

## 4. Kernel strategy

The geometry kernel is the single most important dependency. Real parts (fillets, chamfers,
shell, booleans, revolve) are very hard to build correctly from scratch.

**Decision:** design a **swappable `Kernel` interface** now. Start with a three.js + CSG
implementation (e.g. `three-bvh-csg`) to ship the first features, and adopt a proven CAD kernel
compiled to WASM (OpenCascade.js / replicad) when fillets/chamfers become necessary.

- v1: `threeKernel.ts` — three.js `Shape`/`ExtrudeGeometry` + CSG.
- v2: `occtKernel.ts` — OpenCascade.js (WASM). Implements the identical interface; nothing above
  the seam changes.

## 5. Directory layout

```
src/
  model/
    geometry.ts        # Vec2/Vec3, Plane, Axis, Curve (line/arc×3/circle/spline), Profile
    feature.ts         # Feature = Extrude | Revolve | (future: Fillet/Chamfer/Hole/Pattern)
    component.ts       # Part { features[], transform, color, visible } + Document
  kernel/
    kernel.ts          # Kernel interface (the swappable seam)
    threeKernel.ts     # v1: three.js Shape/Extrude + three-bvh-csg
    occtKernel.ts      # v2: OpenCascade.js (WASM) — added later
  tools/
    types.ts           # Tool, ToolContext, ToolPointerEvent, ToolMetadata, ToolId
    registry.ts        # ordered tool list + metadata + factory map
    ToolController.ts  # active-tool lifecycle + event routing
    stateMachine.ts    # shared "collect points" draw-state-machine base
    tools/             # one file per tool
      select.ts  erase.ts  line.ts  rectangle.ts  rotatedRect.ts
      circle.ts  polygon.ts  pie.ts  arc2Point.ts  arc3Point.ts  arcCenter.ts
      freehand.ts  pushPull.ts  move.ts  rotate.ts
  interaction/
    PointerTracker.ts  # DOM pointer → normalized events (px, NDC, button, modifiers)
    plane.ts           # ray ↔ work-plane intersection (ground = XZ @ y=0)
    snap.ts            # grid snap, endpoint/midpoint/center, angle inference
    raycast.ts         # screen → pick entity / face / edge
    gizmos/            # translate.ts, rotate.ts (Phase 3)
  render/
    previewRenderer.ts # rubber-band / in-progress preview + gizmos
    materials.ts       # shared default/hover/selected/preview materials
  stores/
    editor.ts          # document + selection + active tool + history
    ui.ts              # hover highlight, status hint, snap prefs
  components/
    Toolbar.vue  Viewport.vue  SceneTree.vue  PropertiesPanel.vue
    StatusBar.vue  GuidanceAxes.vue  ToolOptions.vue
```

## 6. Document model

The document stores **only plain, serializable data** (never three.js objects or raw geometry).
Rendering is derived from this model.

```ts
// model/geometry.ts
export interface Vec2 { x: number; y: number }
export interface Vec3 { x: number; y: number; z: number }

export interface Plane {
  origin: Vec3
  normal: Vec3
}

export interface Axis {
  origin: Vec3
  direction: Vec3
}

export type Curve =
  | { kind: 'line'; start: Vec2; end: Vec2 }
  | { kind: 'arc-2point'; start: Vec2; end: Vec2; bulge: number }
  | { kind: 'arc-3point'; start: Vec2; mid: Vec2; end: Vec2 }
  | { kind: 'arc-center'; center: Vec2; radius: number; startAngle: number; endAngle: number }
  | { kind: 'circle'; center: Vec2; radius: number }
  | { kind: 'spline'; points: Vec2[] }                     // freehand

export interface Profile {
  id: string
  plane: Plane                                            // ground = XZ @ y=0 for v1
  loops: Curve[][]                                        // outer loop + hole loops
}
```

```ts
// model/feature.ts
export type Feature =
  | { id: string; kind: 'extrude'; profile: Profile; depth: number }
  | { id: string; kind: 'revolve'; profile: Profile; axis: Axis; angle: number }
  // future: fillet, chamfer, hole, pattern, ...
```

```ts
// model/component.ts
export interface Transform {
  position: Vec3
  rotation: Vec3          // Euler radians
  scale: Vec3
}

export interface Part {
  id: string
  name: string
  features: Feature[]     // ordered history — the "feature tree"
  transform: Transform    // position + rotation (+ scale later)
  color: string
  visible: boolean
}

export interface Document {
  id: string
  parts: Part[]           // later: Component/Assembly tree
}
```

Migration notes:

- Draw tools (rectangle/circle/arcs/polygon/pie/freehand) build `Curve`s and `Profile`s.
- Push/Pull adds an `Extrude` feature referencing a profile.
- Existing primitives migrate: box → extruded rectangle, cylinder → extruded circle, sphere →
  temporary primitive feature until `revolve` lands.

## 7. Kernel interface

The kernel is the swappable seam. The document stores only opaque `BodyHandle`s; the render
layer asks the kernel to tessellate on demand (cached + invalidated on edit).

```ts
// kernel/kernel.ts
export type BooleanOp = 'union' | 'subtract' | 'intersect'
export interface BodyHandle { id: string }          // opaque; kernel owns real geometry
export interface EdgeRef { body: BodyHandle; index: number }
export interface FaceRef { body: BodyHandle; index: number }

export interface Kernel {
  extrude(profile: Profile, depth: number): BodyHandle
  revolve(profile: Profile, axis: Axis, angle: number): BodyHandle          // Phase 4
  boolean(op: BooleanOp, a: BodyHandle, b: BodyHandle): BodyHandle          // Phase 4
  fillet(body: BodyHandle, edge: EdgeRef, radius: number): BodyHandle       // Phase 4+
  chamfer(body: BodyHandle, edge: EdgeRef, distance: number): BodyHandle
  shell(body: BodyHandle, faces: FaceRef[], thickness: number): BodyHandle
  tessellate(body: BodyHandle): THREE.BufferGeometry                         // render path
}
```

- `threeKernel.ts` implements `extrude` now; the rest are stubs that throw
  `NotImplementedError`.
- `occtKernel.ts` later implements the identical interface; nothing above the seam changes.

## 8. Tool framework

Every tool implements the same interface, so the framework drives it uniformly. The core idea:
tools are **isolated, pluggable state machines** that talk to the app only through a narrow
`ToolContext`. Adding a feature = one new file in `tools/tools/` + one registry entry +
(optionally) one kernel branch.

```ts
// tools/types.ts
export type ToolId =
  | 'select' | 'erase'
  | 'line' | 'rectangle' | 'rotated-rectangle'
  | 'circle' | 'polygon' | 'pie'
  | 'arc-2point' | 'arc-3point' | 'arc-center'
  | 'freehand'
  | 'push-pull' | 'move' | 'rotate'

export interface ToolMetadata {
  id: ToolId
  label: string
  category: 'select' | 'draw' | 'edit' | 'erase'
  shortcut?: string          // 'r', 'm', 'q', …
  cursor?: string
  description: string        // shown as a live status hint
}

export interface ToolPointerEvent {
  position: { x: number; y: number }   // CSS px
  world: Vec3                          // un-snapped point on the work plane
  snapped: Vec3                        // after grid/endpoint snap
  button: number
  shiftKey: boolean
  ctrlKey: boolean
  altKey: boolean
}

export interface ToolContext {
  setStatus(message: string): void
  showPreview(geometry: PreviewGeometry[]): void
  clearPreview(): void
  commit(object: SceneObject): void       // one undoable command
  updateObject(id: string, patch: Partial<SceneObject>): void
  pickFace(event: ToolPointerEvent): FaceRef | null   // for push/pull
  pickEntity(event: ToolPointerEvent): string | null
  cancel(): void                          // Escape
  finish(): void                          // return to select tool
}

export interface Tool {
  metadata: ToolMetadata
  onActivate(ctx: ToolContext): void
  onDeactivate(ctx: ToolContext): void
  onPointerDown(e: ToolPointerEvent, ctx: ToolContext): void
  onPointerMove(e: ToolPointerEvent, ctx: ToolContext): void
  onPointerUp(e: ToolPointerEvent, ctx: ToolContext): void
  onKeyDown(e: KeyboardEvent, ctx: ToolContext): void
  onDoubleClick?(e: ToolPointerEvent, ctx: ToolContext): void
}
```

`ToolController` handles the lifecycle: activate the tool, route pointer/key events from
`PointerTracker`, and cancel on Escape. The store only knows `activeTool: ToolId`; it never
imports tool implementations directly (the registry handles that).

### Shared draw state machine

Most draw tools (rectangle, circle, polygon, arcs, pie, freehand) are just "click N points,
show a rubber-band preview, commit on the Nth click." A shared base captures this so each tool
stays tiny:

```ts
// tools/stateMachine.ts
abstract class PointCollectionTool implements Tool {
  private points: Vec3[] = []
  private cursor: Vec3 | null = null
  abstract minPoints: number
  abstract maxPoints: number          // Infinity for polygon / freehand
  abstract buildPreview(points: Vec3[], cursor: Vec3 | null): PreviewGeometry[]
  abstract commit(points: Vec3[]): SceneObject
  // generic onPointerDown/Move/Up, Escape-to-pop-point, double-click-to-close (polygon)
}
```

A Rectangle tool ends up ~30 lines (2 points → `profile: { kind: 'rectangle', a, b }`); the
generic base does all the preview/commit plumbing.

## 9. Interaction pipeline

```
DOM pointer → PointerTracker → work-plane raycast (plane.ts) → snap.ts → active tool
```

- `PointerTracker` attaches to the TresCanvas DOM element and normalizes pointer input (CSS px
  + NDC + buttons + modifiers + drag threshold).
- `plane.ts` raycasts the cursor against the **work plane** — the ground plane is **XZ at y=0**
  (per `GuidanceAxes.vue`, up = +Y). Returns world coords; profiles map (x, z) → 2D (x, y).
- `snap.ts` applies grid snap (matching the `Grid` `:cell-size="0.5"`), then
  endpoint/midpoint/center snaps, then angle inference for rotate.
- `raycast.ts` maps a `THREE.Raycaster` hit back to an entity id (and, later, a face id) for
  select/erase/push-pull.
- `gizmos/` render translate/rotate handles as plain Three objects that intercept pointer events
  and emit deltas.

### OrbitControls remapping (required)

Left-button events are routed to the active tool; orbit/pan move to other buttons:

- Left-drag → active tool (or disabled when not needed)
- Middle-drag → orbit
- Right-drag → pan
- Wheel → zoom
- Shift+left-drag → orbit as a fallback

This is a hard prerequisite before any interactive tool can work.

## 10. Rendering

- Tessellation goes through `kernel.tessellate(body)`, cached per `BodyHandle` and invalidated
  on edit. `Viewport.vue` maps document parts → `<TresMesh>` declaratively.
- `previewRenderer.ts` draws rubber-band previews and gizmos **outside** the document (never
  committed until the tool finishes).
- `materials.ts` provides shared default/hover/selected/preview materials.

## 11. Selection & history

- **Select:** click to select; Shift+click toggles into `selectedIds`; marquee rectangle-select;
  keep a "primary" selection for the Properties panel.
- **History:** every `commit()`/`updateObject()` goes through snapshot-based history → Ctrl+Z /
  Ctrl+Shift+Z + toolbar buttons. Drawing tools need this on day one.
- **Status:** `ToolContext.setStatus()` feeds dynamic hints ("Rectangle: click first corner")
  into the StatusBar.

## 12. Incremental roadmap

**Phase 0 — Foundation (the only "big" step)** ✅ done

- Create: `kernel/kernel.ts`, `kernel/threeKernel.ts`, `model/*`, `tools/*` framework
  (+ Select tool), `interaction/*`, `render/*`, `stores/ui.ts`.
- Edit: `types.ts` → re-export from `model/`; migrate `stores/editor.ts` to `parts: Part[]` +
  history; route pointer events in `Viewport.vue`; remap OrbitControls; render the Toolbar from
  the registry; feature tree in SceneTree; Part/Feature fields in PropertiesPanel; dynamic hint
  in StatusBar.
- Exit criteria: app builds + runs, primitives still work (now as features), Select works through
  the new framework, left-drag no longer orbits, and adding a tool touches only `tools/tools/` +
  the registry.

**Phase 1 — Sketch tools (one file each):** Line → Rectangle → Rotated rectangle → Circle →
Polygon → Pie → Arc 2pt → Arc 3pt → Arc center → Freehand.

**Phase 2 — Solid:** Push/Pull = Extrude feature; feature-tree edits.

**Phase 3 — Edit tools:** Erase, Move (gizmo), Rotate (gizmo).

**Phase 4 — Mechanical:** Revolve, Boolean (CSG), Fillet/Chamfer → swap point for `occtKernel`.

**Phase 5 — Parametric depth:** constraints/dimensions, patterns, assemblies, STEP import/export.

## 13. Risks & open questions

- **Topological naming** — when an earlier feature is edited, downstream face/edge references
  break. This is *the* hard problem in parametric CAD. Initial approach: regenerate from scratch
  + best-effort references; defer a full solution.
- **Constraint solver** — dimensional/geometric constraints are a large separate component;
  sketching works without it initially.
- **Fidelity / STEP** — STEP import/export and assembly mates are a later phase.
- **Kernel swap migration** — moving from three.js+CSG to OpenCascade.js requires a clean
  `BodyHandle` abstraction and a re-tessellation path (already designed above).
