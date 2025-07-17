import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface AddressDisplayProps {
  address: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  source?: 'profile' | 'override';
  size?: 'default' | 'sm';
  className?: string;
}

const AddressDisplay: React.FC<AddressDisplayProps> = ({
  address,
  source,
  size = 'default',
  className,
}) => {
  const { name, address: streetAddress, city, state, zipCode, country } = address;

  return (
    <div className={cn(
      "rounded-lg border bg-card text-card-foreground p-4",
      size === 'sm' ? 'text-sm' : 'text-base',
      className
    )}>
      <div className="flex justify-between items-start">
        <div className="font-medium">{name}</div>
        {source && (
          <Badge variant={source === 'profile' ? 'secondary' : 'outline'} className="capitalize">
            {source}
          </Badge>
        )}
      </div>
      <div className="mt-1 text-muted-foreground">
        <div>{streetAddress}</div>
        <div>{city}, {state} {zipCode}</div>
        <div>{country}</div>
      </div>
    </div>
  );
};

export default AddressDisplay;