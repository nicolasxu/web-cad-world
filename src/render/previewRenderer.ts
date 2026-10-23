import { shallowRef, type ShallowRef } from 'vue'
import type { PreviewGeometry } from '../tools/types'

export interface PreviewState {
  items: ShallowRef<PreviewGeometry[]>
  show(items: PreviewGeometry[]): void
  clear(): void
}

/**
 * Holds in-progress tool previews (rubber bands, ghost geometry) outside the
 * document. Rendering of these items lands in Phase 1; the seam exists now so tools
 * can already emit previews.
 */
export function createPreviewState(): PreviewState {
  const items = shallowRef<PreviewGeometry[]>([])

  return {
    items,
    show(next) {
      items.value = next
    },
    clear() {
      items.value = []
    },
  }
}
