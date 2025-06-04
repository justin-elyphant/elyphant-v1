
import { SettingsFormValues } from "@/hooks/settings/settingsFormSchema";

// Use the same data structure as settings
export interface ProfileData extends SettingsFormValues {
  next_steps_option?: string;
}

export type ProfileDataKey = keyof ProfileData;
