
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
    
    // Combined Profile step - username required (photo optional)
    case 1:
      return !!data.username && data.username.trim().length >= 3;
    
    // Birthday step - date required
    case 2:
      return !!data.dob;
    
    // Shipping Address step - all fields required
    case 3:
      return isValidAddress(data.shipping_address);
    
    // Gift Preferences step - at least one preference required
    case 4:
      return Array.isArray(data.gift_preferences) && data.gift_preferences.length > 0;
    
    // Data Sharing step - always valid
    case 5:
      return true;
      
    // Next Steps step - always valid
    case 6:
      return true;
    
    default:
      return true;
  }
};
