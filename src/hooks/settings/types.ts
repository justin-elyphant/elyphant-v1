
export interface ShippingAddress {
  street: string;
  line2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
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
}
