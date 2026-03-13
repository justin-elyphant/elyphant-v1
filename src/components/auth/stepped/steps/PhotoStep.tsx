import React, { useRef, useState } from "react";
import StepLayout from "../StepLayout";
import { Camera, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PhotoStepProps {
  photoUrl: string;
  onChange: (url: string) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  stepIndex: number;
  totalSteps: number;
  isLoading?: boolean;
}

const PhotoStep: React.FC<PhotoStepProps> = ({
  photoUrl,
  onChange,
  onNext,
  onBack,
  onSkip,
  stepIndex,
  totalSteps,
  isLoading = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) return; // 5MB max

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const filePath = `profile-photos/${fileName}`;

      const { error } = await supabase.storage
        .from("profile_photos")
        .upload(filePath, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("profile_photos")
        .getPublicUrl(filePath);

      onChange(urlData.publicUrl);
    } catch (err) {
      console.error("Photo upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <StepLayout
      heading="Add a profile photo"
      subtitle="Help your friends recognize you"
      onBack={onBack}
      onNext={onNext}
      nextLabel="Finish"
      isNextDisabled={false}
      isNextLoading={isLoading}
      stepIndex={stepIndex}
      totalSteps={totalSteps}
      footer={
        <button
          type="button"
          onClick={onSkip}
          className="w-full text-center text-sm text-muted-foreground py-3 touch-manipulation hover:text-foreground transition-colors"
        >
          Skip for now
        </button>
      }
    >
      <div className="flex flex-col items-center pt-8">
        {/* Photo circle */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="relative w-32 h-32 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden hover:border-primary transition-colors touch-manipulation"
        >
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Profile photo"
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-12 h-12 text-muted-foreground" />
          )}

          {/* Camera overlay */}
          <div className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md">
            <Camera className="w-4 h-4" />
          </div>
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {uploading && (
          <p className="text-sm text-muted-foreground mt-4">Uploading...</p>
        )}

        {photoUrl && !uploading && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-sm text-primary mt-4 touch-manipulation"
          >
            Change photo
          </button>
        )}
      </div>
    </StepLayout>
  );
};

export default PhotoStep;
