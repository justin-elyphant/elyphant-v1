
import { TOAST_REMOVE_DELAY } from "./constants"
import { dispatch } from "./toast-reducer"
import { actionTypes } from "./types"

// Toast timeouts management
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

export const addToRemoveQueue = (toastId: string, duration: number = TOAST_REMOVE_DELAY) => {
  if (toastTimeouts.has(toastId)) {
    clearTimeout(toastTimeouts.get(toastId))
    toastTimeouts.delete(toastId)
  }
  
  // Don't set a timeout for toast with duration 0 (these are meant to be dismissed instantly)
  if (duration === 0) {
    dispatch({
      type: actionTypes.REMOVE_TOAST,
      toastId: toastId,
    })
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: actionTypes.REMOVE_TOAST,
      toastId: toastId,
    })
  }, duration)

  toastTimeouts.set(toastId, timeout)
}

export const clearAllToasts = () => {
  toastTimeouts.forEach((timeout) => {
    clearTimeout(timeout)
  })
  toastTimeouts.clear()
  dispatch({
    type: actionTypes.REMOVE_TOAST,
  })
}
