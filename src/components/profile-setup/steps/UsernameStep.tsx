
import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface UsernameStepProps {
  value: string;
  onChange: (username: string) => void;
  email: string;
}

const UsernameStep: React.FC<UsernameStepProps> = ({ value, onChange, email }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [suggestedUsernames, setSuggestedUsernames] = useState<string[]>([]);

  // Generate suggested usernames based on email
  useEffect(() => {
    if (email) {
      const emailPrefix = email.split('@')[0];
      const suggestions = [
        emailPrefix,
        `${emailPrefix}${Math.floor(Math.random() * 100)}`,
        `${emailPrefix}_${Math.floor(Math.random() * 100)}`,
        `${emailPrefix}${Math.floor(Math.random() * 1000)}`,
        `${emailPrefix.charAt(0)}${emailPrefix.slice(1, 5)}${Math.floor(Math.random() * 100)}`
      ];
      setSuggestedUsernames(suggestions);
    }
  }, [email]);

  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) {
      setIsAvailable(null);
      return;
    }

    setIsChecking(true);
    try {
      // Check if username exists in profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (error) throw error;
      setIsAvailable(!data);
    } catch (error) {
      console.error("Error checking username:", error);
      setIsAvailable(null);
    } finally {
      setIsChecking(false);
    }
  };

  // Debounced username check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (value) {
        checkUsernameAvailability(value);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    onChange(newUsername);
  };

  const selectSuggestion = (username: string) => {
    onChange(username);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">Choose a username</h3>
        <p className="text-sm text-muted-foreground">
          Your username will be visible to friends and used for sharing your wishlist
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <Input
              id="username"
              placeholder="Choose a username"
              value={value}
              onChange={handleChange}
              className={`pr-10 ${isAvailable === true ? 'border-green-500' : isAvailable === false ? 'border-red-500' : ''}`}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isChecking ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : isAvailable === true ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : isAvailable === false ? (
                <XCircle className="h-4 w-4 text-red-500" />
              ) : null}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Usernames can only contain lowercase letters, numbers, and underscores
          </p>
          {isAvailable === false && (
            <p className="text-xs text-red-500">
              This username is already taken. Please choose another one.
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm">Suggested usernames</Label>
          <div className="flex flex-wrap gap-2">
            {suggestedUsernames.map((username, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => selectSuggestion(username)}
                className="text-xs"
              >
                {username}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsernameStep;
