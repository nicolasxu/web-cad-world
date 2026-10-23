import { ref } from 'vue'
import { defineStore } from 'pinia'

/** Transient UI state: live tool hints, hover highlight, snap preferences. */
export const useUiStore = defineStore('ui', () => {
  const statusMessage = ref('')

  function setStatus(message: string): void {
    statusMessage.value = message
  }

  return {
    statusMessage,
    setStatus,
  }
})
