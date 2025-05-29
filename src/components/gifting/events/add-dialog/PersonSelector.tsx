
import React, { useState, useRef, useEffect } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { AddEventFormValues, PersonContact } from "./types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronDown } from "lucide-react";

interface PersonSelectorProps {
  form: UseFormReturn<AddEventFormValues>;
  connectedPeople: PersonContact[];
  validationError?: string;
}

const PersonSelector = ({ form, connectedPeople, validationError }: PersonSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const personName = form.watch("personName");

  // Filter connections based on search term
  const filteredPeople = connectedPeople.filter(person =>
    person.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (value: string) => {
    setSearchTerm(value);
    form.setValue("personName", value);
    if (!isOpen && value.length > 0) {
      setIsOpen(true);
    }
  };

  const handleSelectPerson = (person: PersonContact) => {
    form.setValue("personName", person.name);
    form.setValue("personId", person.id);
    setSearchTerm(person.name);
    setIsOpen(false);
  };

  const handleInputFocus = () => {
    const currentValue = form.getValues("personName") || "";
    setSearchTerm(currentValue);
    setIsOpen(true);
  };

  const handleInputBlur = (e: React.FocusEvent) => {
    // Don't close if clicking on dropdown content
    if (dropdownRef.current?.contains(e.relatedTarget as Node)) {
      return;
    }
    // Small delay to allow for click events on dropdown items
    setTimeout(() => setIsOpen(false), 150);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <FormField
        control={form.control}
        name="personName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Person's Name</FormLabel>
            <FormControl>
              <div className="relative">
                <Input
                  ref={inputRef}
                  placeholder="Type to search your connections..."
                  value={searchTerm}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  className={validationError ? 'border-red-500' : ''}
                />
                <ChevronDown 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer" 
                  onClick={() => setIsOpen(!isOpen)}
                />
              </div>
            </FormControl>
            {validationError && (
              <p className="text-sm text-red-500">{validationError}</p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Dropdown with connections */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredPeople.length > 0 ? (
            <div className="p-1">
              {filteredPeople.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer"
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent input blur
                    handleSelectPerson(person);
                  }}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={person.avatar} alt={person.name} />
                    <AvatarFallback>{person.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{person.name}</span>
                      {person.topGifter && (
                        <Badge variant="secondary" className="text-xs">
                          Top Gifter
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {person.events} event{person.events !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {personName === person.name && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              ))}
            </div>
          ) : searchTerm ? (
            <div className="p-4 text-center text-muted-foreground">
              <p className="text-sm">No connections found matching "{searchTerm}"</p>
              <p className="text-xs mt-1">You can still type any name to continue</p>
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              <p className="text-sm">Start typing to search your connections</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PersonSelector;
