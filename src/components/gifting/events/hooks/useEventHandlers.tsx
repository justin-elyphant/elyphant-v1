
import { useEventActions } from "./useEventActions";
import { useAutoGiftToggle } from "./useAutoGiftToggle";
import { useEventEdit } from "./useEventEdit";
import { useEventCRUD } from "./useEventCRUD";

export const useEventHandlers = () => {
  const { handleSendGift, handleVerifyEvent, handleEventClick } = useEventActions();
  const { handleToggleAutoGift } = useAutoGiftToggle();
  const { handleEditEvent } = useEventEdit();
  const { handleSaveEvent, handleDeleteEvent, handleCreateEvent } = useEventCRUD();

  return {
    handleSendGift,
    handleToggleAutoGift,
    handleVerifyEvent,
    handleEditEvent,
    handleSaveEvent,
    handleDeleteEvent,
    handleCreateEvent,
    handleEventClick
  };
};
