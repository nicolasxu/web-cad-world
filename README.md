# web-cad-world

A browser-based CAD web application scaffold built with **Vue 3 + TypeScript + Three.js**, using the Vue ecosystem equivalents of a typical React/three.js stack.

## Stack

| Concern | Package |
| --- | --- |
| UI framework | [Vue 3](https://vuejs.org) (Composition API, `<script setup>`) |
| 3D rendering | [Three.js](https://threejs.org) via [TresJS](https://tresjs.org) (`@tresjs/core`) |
| Scene helpers | [@tresjs/cientos](https://tresjs.org) (OrbitControls, infinite grid, ...) |
| State management | [Pinia](https://pinia.vuejs.org) |
| Language | TypeScript |
| Tooling | Vite 8 + vue-tsc |

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check (vue-tsc) + production build
npm run preview  # preview the production build
```

## Project structure

```
src/
  main.ts                       # app entry (creates Pinia + mounts App)
  types.ts                      # shared document-model types
  stores/editor.ts              # Pinia store: scene document, selection, tools
  components/
    Toolbar.vue                 # tool buttons (select / add primitives, duplicate, delete, clear)
    Viewport.vue                # TresJS <TresCanvas> 3D viewport
    SceneTree.vue               # scene object list (select / toggle visibility / delete)
    PropertiesPanel.vue         # edit selected object properties
    StatusBar.vue               # active tool / selection / object count
```

## Architecture notes

- The **document model** (`SceneObject` in `types.ts`) is plain, serializable data kept separate from the Three.js scene. The Pinia store owns this data; `Viewport.vue` maps it declaratively to `<Tres*>` components.
- Three.js objects are never wrapped in deep reactive state — the store holds plain data and TresJS builds the scene graph.
- Adding a primitive from the toolbar inserts it into the store and the viewport re-renders reactively. Click a shape to select it (highlighted via emissive), click empty space to deselect.

## Next steps

- Raycast-based **click-to-place** (place primitives at the cursor on the ground plane) using `useTresContext()` + `THREE.Raycaster`.
- Undo/redo history stack (immutable document snapshots).
- Constraint & dimension (measurement) system.
- CSG booleans and import/export (STEP, glTF, OBJ).
