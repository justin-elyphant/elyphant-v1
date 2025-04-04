
import { Toast, ToasterToast } from "./types";
import { dispatch, actionTypes } from "./index";
import { TOAST_REMOVE_DELAY } from "./constants";

// Counter for generating unique IDs
let count = 0

export function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

export function dispatchAddToast(props: ToasterToast) {
  // Dismiss any existing toasts with the same ID first
  if (props.id) {
    dispatch({
      type: actionTypes.DISMISS_TOAST,
      toastId: props.id
    })
  }
  
  // Add the new toast
  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      ...props,
      id: props.id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dispatch({ type: actionTypes.DISMISS_TOAST, toastId: props.id })
      },
    },
  })
}

export function createToast({ id, ...props }: Toast & { id?: string }) {
  // Duration of 0 means dismiss immediately (useful for clearing toasts)
  const duration = props.duration === 0 ? 0 : props.duration || TOAST_REMOVE_DELAY
  
  // Generate a toast ID if not provided
  const toastId = id || genId()

  // If there's already a toast with this ID, dismiss it first
  if (id) {
    dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id })
    
    // If duration is 0, we're just trying to clear this toast, so no need to add a new one
    if (duration === 0) {
      return {
        id: toastId,
        dismiss: () => dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
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
    dismiss: () => dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
    update: (props: ToasterToast) =>
      dispatch({
        type: actionTypes.UPDATE_TOAST,
        toast: { ...props, id: toastId },
      }),
  }
}
