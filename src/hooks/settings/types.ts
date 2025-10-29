
export interface ShippingAddress {
  street: string;
  line2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface DataSharingSettings {
  dob: "public" | "friends" | "private";
  shipping_address: "public" | "friends" | "private";
  interests: "public" | "friends" | "private";
  /** @deprecated Use `interests` field instead. Maintained for backwards compatibility. */
  gift_preferences: "public" | "friends" | "private";
  email: "public" | "friends" | "private";
}

export interface ImportantDateType {
  date: Date;
  description: string;
}

export interface ProfileFormData {
  name: string;
  email: string;
  username?: string;
  bio?: string;
  birthday?: Date;
  profile_image?: string | null;
  address: ShippingAddress;
  interests: string[];
  importantDates: ImportantDateType[];
  data_sharing_settings: DataSharingSettings;
}
