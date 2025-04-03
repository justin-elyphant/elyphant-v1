
import React, { useState } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Users, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { PersonContact } from "./types";
import { UseFormReturn } from "react-hook-form";
import { AddEventFormValues } from "./types";

interface PersonSelectorProps {
  form: UseFormReturn<AddEventFormValues>;
  connectedPeople: PersonContact[];
}

const PersonSelector = ({ form, connectedPeople }: PersonSelectorProps) => {
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [selectedContact, setSelectedContact] = useState<PersonContact | null>(null);
  
  const watchPersonName = form.watch("personName");

  // Select a contact from the network
  const selectContact = (contact: PersonContact) => {
    setSelectedContact(contact);
    form.setValue("personName", contact.name);
    form.setValue("personId", contact.id);
    setShowContactPicker(false);
  };

  return (
    <FormField
      control={form.control}
      name="personName"
      render={({ field }) => (
        <FormItem>
          <div className="flex items-center justify-between">
            <FormLabel>Person's Name</FormLabel>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              className="h-8 text-xs text-primary"
              onClick={() => setShowContactPicker(!showContactPicker)}
            >
              <Users className="h-3.5 w-3.5 mr-1" />
              Select from contacts
            </Button>
          </div>
          
          {showContactPicker ? (
            <div className="relative">
              <Command className="rounded-lg border shadow-md">
                <CommandInput placeholder="Search people..." />
                <CommandList>
                  <CommandEmpty>No people found.</CommandEmpty>
                  <CommandGroup heading="Connected People">
                    {connectedPeople.map((person) => (
                      <CommandItem
                        key={person.id}
                        onSelect={() => selectContact(person)}
                        className="flex items-center gap-2 py-2"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={person.avatar} alt={person.name} />
                          <AvatarFallback>{person.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col text-sm">
                          <span className="font-medium">{person.name}</span>
                          <span className="text-xs text-muted-foreground">{person.events} events</span>
                        </div>
                        {person.topGifter && (
                          <Badge variant="outline" className="ml-auto flex items-center gap-1 bg-amber-50 text-amber-800 border-amber-200">
                            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                            <span className="text-xs">Top Gifter</span>
                          </Badge>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
          ) : (
            <>
              <FormControl>
                <div className="relative">
                  <Input 
                    placeholder="Enter name" 
                    {...field} 
                    className={selectedContact ? "pr-8 border-primary/20" : ""}
                  />
                  {selectedContact && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={selectedContact.avatar} alt={selectedContact.name} />
                        <AvatarFallback>{selectedContact.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                </div>
              </FormControl>
              {selectedContact?.topGifter && (
                <div className="mt-1 flex items-center">
                  <Badge variant="outline" className="flex items-center gap-1 bg-amber-50 text-amber-800 border-amber-200">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    <span className="text-xs">Top Gifter</span>
                  </Badge>
                </div>
              )}
            </>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default PersonSelector;
