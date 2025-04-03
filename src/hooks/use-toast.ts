
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 1  // Strictly limit to 1 toast at a time
const TOAST_REMOVE_DELAY = 2000  // 2 seconds (even shorter than before)

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
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

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

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
      // First, dismiss all existing toasts
      state.toasts.forEach((toast) => {
        if (toast.open) {
          dispatch({ type: "DISMISS_TOAST", toastId: toast.id })
        }
      })
      
      // Wait a tiny bit to avoid flicker
      setTimeout(() => {
        // If we already have a toast with this ID, don't add a new one
        const hasToastWithId = state.toasts.some(t => 
          action.toast.id && t.id === action.toast.id
        )
        
        if (hasToastWithId) {
          return
        }
        
        // Add the new toast
        dispatch({
          type: "UPDATE_TOAST",
          toast: { ...action.toast, open: true }
        })
      }, 10)
      
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
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
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
  // Allow the caller to specify a custom id
  const toastId = id || genId()

  // If there's already a toast with this ID, dismiss it first
  if (id) {
    memoryState.toasts.forEach(t => {
      if (t.id === id) {
        dispatch({ type: "DISMISS_TOAST", toastId: id })
      }
    })
    
    // Wait for the dismiss animation
    setTimeout(() => {
      dispatchAddToast({ ...props, id: toastId })
    }, 100)
  } else {
    dispatchAddToast({ ...props, id: toastId })
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
  // Dismiss any existing toasts first
  clearAllToasts()
  
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
