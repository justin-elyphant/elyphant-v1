
import { Action, State, actionTypes } from "./types"

// Constants moved to a separate file
import { TOAST_REMOVE_DELAY } from "./constants"

// Timeouts management moved to a separate file
import { addToRemoveQueue } from "./toast-timeouts"

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      // If toast with same ID exists and has duration 0, remove it immediately
      if (action.toast.id && action.toast.duration === 0) {
        return {
          ...state,
          toasts: state.toasts.filter(t => t.id !== action.toast.id)
        }
      }
      
      // For regular toasts, first dismiss all existing toasts
      state.toasts.forEach((toast) => {
        if (toast.open) {
          dispatch({ type: actionTypes.DISMISS_TOAST, toastId: toast.id })
        }
      })
      
      // If we already have a toast with this ID, update it instead of adding a new one
      const hasToastWithId = state.toasts.some(t => 
        action.toast.id && t.id === action.toast.id
      )
      
      if (hasToastWithId) {
        return {
          ...state,
          toasts: state.toasts.map((t) =>
            t.id === action.toast.id ? { ...t, ...action.toast, open: true } : t
          ),
        }
      }
      
      // Add the new toast
      return {
        ...state,
        toasts: [action.toast].slice(0, 1), // Using constant 1 instead of TOAST_LIMIT
      }

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action

      // Side effects - add to remove queue
      if (toastId) {
        const toast = state.toasts.find(t => t.id === toastId)
        addToRemoveQueue(toastId, toast?.duration)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id, toast.duration)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case actionTypes.REMOVE_TOAST:
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

// State management
const listeners: Array<(state: State) => void> = []
let memoryState: State = { toasts: [] }

export function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

export function getMemoryState() {
  return memoryState;
}

export function getListeners() {
  return listeners;
}
