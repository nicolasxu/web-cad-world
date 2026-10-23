/** Normalized pointer state produced by `PointerTracker`. */
export interface PointerState {
  /** Canvas-relative pixel position. */
  x: number
  y: number
  /** Normalized device coordinates (-1..1), Y up. */
  ndcX: number
  ndcY: number
  button: number
  shiftKey: boolean
  ctrlKey: boolean
  altKey: boolean
}

/**
 * Attaches low-level pointer listeners to the canvas DOM element and normalizes
 * them into `PointerState`s. It does not know about three.js, the camera, or tools
 * — those are composed by the viewport.
 */
export class PointerTracker {
  onDown: ((state: PointerState) => void) | null = null
  onMove: ((state: PointerState) => void) | null = null
  onUp: ((state: PointerState) => void) | null = null

  private readonly element: HTMLElement

  constructor(element: HTMLElement) {
    this.element = element
  }

  attach(): void {
    this.element.addEventListener('pointerdown', this.handleDown)
    this.element.addEventListener('pointermove', this.handleMove)
    this.element.addEventListener('pointerup', this.handleUp)
    this.element.addEventListener('pointercancel', this.handleCancel)
  }

  detach(): void {
    this.element.removeEventListener('pointerdown', this.handleDown)
    this.element.removeEventListener('pointermove', this.handleMove)
    this.element.removeEventListener('pointerup', this.handleUp)
    this.element.removeEventListener('pointercancel', this.handleCancel)
  }

  private handleDown = (event: PointerEvent): void => {
    this.onDown?.(this.toState(event))
  }

  private handleMove = (event: PointerEvent): void => {
    this.onMove?.(this.toState(event))
  }

  private handleUp = (event: PointerEvent): void => {
    this.onUp?.(this.toState(event))
  }

  private handleCancel = (event: PointerEvent): void => {
    this.onUp?.(this.toState(event))
  }

  private toState(event: PointerEvent): PointerState {
    const rect = this.element.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    return {
      x,
      y,
      ndcX: (x / rect.width) * 2 - 1,
      ndcY: -(y / rect.height) * 2 + 1,
      button: event.button,
      shiftKey: event.shiftKey,
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
    }
  }
}
