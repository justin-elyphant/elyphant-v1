import React from 'react';
import { MapPin } from 'lucide-react';

interface RecipientAddressDisplayProps {
  address: any; // Address object
  label?: string;
  showFullAddress?: boolean;
}

const RecipientAddressDisplay: React.FC<RecipientAddressDisplayProps> = ({
  address,
  label = 'Delivery Address',
  showFullAddress = true
}) => {
  if (!address) return null;

  // Get address fields with fallbacks for different field names
  const street = address.street || address.address_line1 || address.address || '';
  const line2 = address.line2 || address.address_line2 || '';
  const city = address.city || '';
  const state = address.state || '';
  const zipCode = address.zipCode || address.zip_code || '';
  const country = address.country || 'United States';

  return (
    <div className="flex items-start gap-3">
      <MapPin className="h-5 w-5 mt-0.5 text-primary" />
      <div className="flex-1">
        <div className="font-medium mb-1">{label}</div>
        <div className="text-sm leading-relaxed text-muted-foreground">
          {showFullAddress ? (
            <>
              {street && <div>{street}</div>}
              {line2 && <div>{line2}</div>}
              <div>
                {city}, {state} {zipCode}
              </div>
              <div>{country}</div>
            </>
          ) : (
            <>
              {city}, {state} {zipCode}<br />
              {country}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipientAddressDisplay;