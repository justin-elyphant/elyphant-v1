
import { ShippingAddress } from "@/types/supabase";

// Validate an email address string
const isValidEmail = (email: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Validate shipping address
const isValidAddress = (address: ShippingAddress) => {
  return (
    !!address.street &&
    !!address.city &&
    !!address.state &&
    !!address.zipCode &&
    !!address.country
  );
};

// Validate profile data based on current step
export const validateStep = (step: number, data: any) => {
  switch (step) {
    // Basic Info step - name required
    case 0:
      return !!data.name && data.name.trim().length > 1;
    
    // Username step - username required
    case 1:
      return !!data.username && data.username.trim().length >= 3;
    
    // Profile Photo step - optional, always valid
    case 2:
      return true;
    
    // Birthday step - date required
    case 3:
      return !!data.dob;
    
    // Shipping Address step - all fields required
    case 4:
      return isValidAddress(data.shipping_address);
    
    // Gift Preferences step - at least one preference required
    case 5:
      return Array.isArray(data.gift_preferences) && data.gift_preferences.length > 0;
    
    // Data Sharing step - always valid
    case 6:
      return true;
      
    // Next Steps step - always valid
    case 7:
      return true;
    
    default:
      return true;
  }
};
