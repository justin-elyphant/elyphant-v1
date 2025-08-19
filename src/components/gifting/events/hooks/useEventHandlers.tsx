
import { useEventActions } from "./useEventActions";
import { useAutoGiftToggle } from "./useAutoGiftToggle";
import { useEventEdit } from "./useEventEdit";
import { useEventCRUD } from "./useEventCRUD";
import { useEventArchive } from "./useEventArchive";
// Nicole auto-gifting hook removed - using unified service directly

export const useEventHandlers = () => {
  const { handleSendGift, handleVerifyEvent, handleEventClick } = useEventActions();
  const { handleToggleAutoGift } = useAutoGiftToggle();
  const { handleEditEvent } = useEventEdit();
  const { handleSaveEvent, handleDeleteEvent, handleCreateEvent } = useEventCRUD();
  const { 
    archiveDialogOpen,
    setArchiveDialogOpen,
    eventToArchive,
    handleArchiveEvent,
    confirmArchive,
    handleUnarchiveEvent 
  } = useEventArchive();

  return {
    handleSendGift,
    handleToggleAutoGift,
    handleVerifyEvent,
    handleEditEvent,
    handleSaveEvent,
    handleDeleteEvent,
    handleCreateEvent,
    handleEventClick,
    handleArchiveEvent,
    handleUnarchiveEvent,
    archiveDialogOpen,
    setArchiveDialogOpen,
    eventToArchive,
    confirmArchive
  };
};
