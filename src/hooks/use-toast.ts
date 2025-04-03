
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 1  // Strictly limit to 1 toast at a time
const TOAST_REMOVE_DELAY = 2000  // 2 seconds

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  duration?: number
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string, duration: number = TOAST_REMOVE_DELAY) => {
  if (toastTimeouts.has(toastId)) {
    clearTimeout(toastTimeouts.get(toastId))
    toastTimeouts.delete(toastId)
  }
  
  // Don't set a timeout for toast with duration 0 (these are meant to be dismissed instantly)
  if (duration === 0) {
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, duration)

  toastTimeouts.set(toastId, timeout)
}

// Clear all existing toasts
const clearAllToasts = () => {
  toastTimeouts.forEach((timeout) => {
    clearTimeout(timeout)
  })
  toastTimeouts.clear()
  dispatch({
    type: "REMOVE_TOAST",
  })
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
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
          dispatch({ type: "DISMISS_TOAST", toastId: toast.id })
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
        toasts: [action.toast].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
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
    case "REMOVE_TOAST":
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

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

function toast({ id, ...props }: Toast & { id?: string }) {
  // Duration of 0 means dismiss immediately (useful for clearing toasts)
  const duration = props.duration === 0 ? 0 : props.duration || TOAST_REMOVE_DELAY
  
  // Generate a toast ID if not provided
  const toastId = id || genId()

  // If there's already a toast with this ID, dismiss it first
  if (id) {
    memoryState.toasts.forEach(t => {
      if (t.id === id) {
        dispatch({ type: "DISMISS_TOAST", toastId: id })
      }
    })
    
    // If duration is 0, we're just trying to clear this toast, so no need to add a new one
    if (duration === 0) {
      return {
        id: toastId,
        dismiss: () => dispatch({ type: "DISMISS_TOAST", toastId }),
        update: () => {}, // No-op for dismissed toasts
      }
    }
    
    // Wait for the dismiss animation
    setTimeout(() => {
      dispatchAddToast({ ...props, id: toastId, duration })
    }, 100)
  } else {
    dispatchAddToast({ ...props, id: toastId, duration })
  }

  return {
    id: toastId,
    dismiss: () => dispatch({ type: "DISMISS_TOAST", toastId }),
    update: (props: ToasterToast) =>
      dispatch({
        type: "UPDATE_TOAST",
        toast: { ...props, id: toastId },
      }),
  }
}

function dispatchAddToast(props: ToasterToast) {
  // Dismiss any existing toasts with the same ID first
  if (props.id) {
    memoryState.toasts.forEach(t => {
      if (t.id === props.id) {
        dispatch({ type: "DISMISS_TOAST", toastId: props.id })
      }
    })
  }
  
  // Add the new toast
  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id: props.id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dispatch({ type: "DISMISS_TOAST", toastId: props.id })
      },
    },
  })
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

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
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
