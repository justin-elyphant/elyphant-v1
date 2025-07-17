import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Lock, User, Heart, Calendar as CalendarIconSmall } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { EditFormData } from '../EnhancedDeliveryEditModal';

interface RecipientInfoTabProps {
  formData: EditFormData;
  setFormData: (data: EditFormData) => void;
  permissions: {
    canEditBasicInfo: boolean;
    canEditRelationship: boolean;
    canEditAddress: boolean;
    canEditGiftOptions: boolean;
  };
  recipientType: string;
}

const RecipientInfoTab: React.FC<RecipientInfoTabProps> = ({
  formData,
  setFormData,
  permissions,
  recipientType
}) => {
  const [birthdayDate, setBirthdayDate] = React.useState<Date | undefined>(
    formData.birthday ? new Date(formData.birthday) : undefined
  );

  const handleBirthdaySelect = (date: Date | undefined) => {
    setBirthdayDate(date);
    setFormData({
      ...formData,
      birthday: date ? date.toISOString() : null
    });
  };

  const relationshipTypes = [
    { value: 'family', label: 'Family' },
    { value: 'friend', label: 'Friend' },
    { value: 'close_friend', label: 'Close Friend' },
    { value: 'colleague', label: 'Colleague' },
    { value: 'acquaintance', label: 'Acquaintance' },
    { value: 'partner', label: 'Partner' },
    { value: 'other', label: 'Other' }
  ];

  const interactionFrequencies = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'occasionally', label: 'Occasionally' },
    { value: 'rarely', label: 'Rarely' }
  ];

  const commonInterests = [
    'Sports', 'Music', 'Movies', 'Books', 'Travel', 'Food', 'Technology', 
    'Art', 'Gaming', 'Fitness', 'Fashion', 'Photography', 'Cooking', 'Gardening'
  ];

  const toggleInterest = (interest: string) => {
    const updatedInterests = formData.sharedInterests.includes(interest)
      ? formData.sharedInterests.filter(i => i !== interest)
      : [...formData.sharedInterests, interest];
    
    setFormData({
      ...formData,
      sharedInterests: updatedInterests
    });
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Basic Information</h3>
          {!permissions.canEditBasicInfo && (
            <Badge variant="outline" className="text-xs">
              <Lock className="h-3 w-3 mr-1" />
              Read-only
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={!permissions.canEditBasicInfo}
              className={!permissions.canEditBasicInfo ? 'bg-muted' : ''}
            />
          </div>

          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!permissions.canEditBasicInfo}
              className={!permissions.canEditBasicInfo ? 'bg-muted' : ''}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={!permissions.canEditBasicInfo}
              className={!permissions.canEditBasicInfo ? 'bg-muted' : ''}
            />
          </div>

          <div>
            <Label>Birthday</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !birthdayDate && "text-muted-foreground",
                    !permissions.canEditBasicInfo && "bg-muted"
                  )}
                  disabled={!permissions.canEditBasicInfo}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {birthdayDate ? format(birthdayDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={birthdayDate}
                  onSelect={handleBirthdaySelect}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Relationship Context */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Relationship Context</h3>
          {!permissions.canEditRelationship && (
            <Badge variant="outline" className="text-xs">
              <Lock className="h-3 w-3 mr-1" />
              Read-only
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="relationshipType">Relationship Type</Label>
            <Select
              value={formData.relationshipType}
              onValueChange={(value) => setFormData({ ...formData, relationshipType: value })}
              disabled={!permissions.canEditRelationship}
            >
              <SelectTrigger className={!permissions.canEditRelationship ? 'bg-muted' : ''}>
                <SelectValue placeholder="Select relationship type" />
              </SelectTrigger>
              <SelectContent>
                {relationshipTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="interactionFrequency">How Often Do You Interact?</Label>
            <Select
              value={formData.interactionFrequency}
              onValueChange={(value) => setFormData({ ...formData, interactionFrequency: value })}
              disabled={!permissions.canEditRelationship}
            >
              <SelectTrigger className={!permissions.canEditRelationship ? 'bg-muted' : ''}>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                {interactionFrequencies.map((freq) => (
                  <SelectItem key={freq.value} value={freq.value}>
                    {freq.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="closenessLevel">Closeness Level: {formData.closenessLevel}/10</Label>
          <div className="mt-2">
            <Slider
              value={[formData.closenessLevel]}
              onValueChange={([value]) => setFormData({ ...formData, closenessLevel: value })}
              max={10}
              min={1}
              step={1}
              className={!permissions.canEditRelationship ? 'opacity-50' : ''}
              disabled={!permissions.canEditRelationship}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Acquaintance</span>
              <span>Very Close</span>
            </div>
          </div>
        </div>

        <div>
          <Label>Shared Interests</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {commonInterests.map((interest) => (
              <Badge
                key={interest}
                variant={formData.sharedInterests.includes(interest) ? "default" : "outline"}
                className={cn(
                  "cursor-pointer hover:bg-primary/10",
                  !permissions.canEditRelationship && "cursor-not-allowed opacity-50"
                )}
                onClick={() => permissions.canEditRelationship && toggleInterest(interest)}
              >
                {interest}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="specialConsiderations">Special Considerations</Label>
          <Textarea
            id="specialConsiderations"
            placeholder="Any special notes about gift preferences, occasions, or other considerations..."
            value={formData.specialConsiderations}
            onChange={(e) => setFormData({ ...formData, specialConsiderations: e.target.value })}
            disabled={!permissions.canEditRelationship}
            className={cn(
              "min-h-[80px]",
              !permissions.canEditRelationship && "bg-muted"
            )}
          />
        </div>
      </div>

      {/* Source Information */}
      <div className="border-t pt-4">
        <div className="text-sm text-muted-foreground">
          <strong>Data Source:</strong> {recipientType === 'connection' ? 'Connected User Profile' : 
                                       recipientType === 'pending' ? 'Pending Invitation' : 
                                       recipientType === 'address_book' ? 'Address Book Entry' : 'Unknown'}
        </div>
        {recipientType === 'connection' && (
          <div className="text-xs text-muted-foreground mt-1">
            Some fields are read-only because they come from the recipient's profile
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipientInfoTab;