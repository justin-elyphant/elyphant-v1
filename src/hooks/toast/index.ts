
import * as React from "react"
import { State, Toast, Action, actionTypes } from "./types"
import { reducer, dispatch, getMemoryState, getListeners } from "./toast-reducer"
import { createToast } from "./toast-utils"
export { clearAllToasts } from "./toast-timeouts"
export { actionTypes } from "./types"

// Re-export types
export type { Toast, Action, State } from "./types"

// Export the toast function
export const toast = createToast

export function useToast() {
  const [state, setState] = React.useState<State>(getMemoryState())
  const listeners = getListeners()

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
  }
}
