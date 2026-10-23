import type { Tool } from '../types'

/** Select: click a part to select it, click empty space to deselect. */
export const selectTool: Tool = {
  metadata: {
    id: 'select',
    label: 'Select',
    category: 'select',
    description: 'Click an object to select it. Click empty space to deselect.',
    cursor: 'default',
  },

  onActivate(ctx) {
    ctx.setStatus('Click an object to select it. Click empty space to deselect.')
  },

  onDeactivate() {},

  onPointerDown(e, ctx) {
    if (e.button !== 0) return
    ctx.select(ctx.pickEntity(e))
  },

  onPointerMove() {},

  onPointerUp() {},

  onKeyDown() {},
}
