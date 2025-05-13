
// This file is now a simple re-export to use the context's hook
import { useNotifications } from '@/contexts/notifications/NotificationsContext';

export { useNotifications };
export type { 
  NotificationType,
  Notification 
} from '@/contexts/notifications/NotificationsContext';
