
import { eventCRUD } from "./events/eventCRUD";
import { eventSeries } from "./events/eventSeries";

export { transformExtendedEventToDatabase } from "./events/eventTransformers";
export type { EventCreateData, EventUpdateData, SeriesUpdateData } from "./events/eventTypes";

export const eventsService = {
  ...eventCRUD,
  ...eventSeries,
};
