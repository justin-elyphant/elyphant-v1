import React, { useRef, useState } from "react";
import StepLayout from "../StepLayout";
import { Camera, User, ImagePlus } from "lucide-react";
import { CameraCapture } from "@/components/ui/camera-capture";
import { toast } from "sonner";

interface PhotoStepProps {
  photoUrl: string;
  onChange: (url: string) => void;
  onPhotoFile?: (file: File | null) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  stepIndex: number;
  totalSteps: number;
  isLoading?: boolean;
}

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const PhotoStep: React.FC<PhotoStepProps> = ({
  photoUrl,
  onChange,
  onPhotoFile,
  onNext,
  onBack,
  onSkip,
  stepIndex,
  totalSteps,
  isLoading = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCamera, setShowCamera] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    try {
      const dataUrl = await blobToDataUrl(file);
      onChange(dataUrl);
      onPhotoFile?.(file);
    } catch {
      toast.error("Failed to load image preview");
    }
  };

  const handleCameraCapture = async (blob: Blob) => {
    try {
      const file = new File([blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg" });
      const dataUrl = await blobToDataUrl(blob);
      onChange(dataUrl);
      onPhotoFile?.(file);
      setShowCamera(false);
    } catch {
      toast.error("Failed to load captured photo");
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
        <button
          type="button"
          onClick={() => setShowCamera(true)}
          className="relative w-32 h-32 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden hover:border-primary transition-colors touch-manipulation"
        >
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Profile photo"
              className="w-full h-full object-cover"
              onError={() => onChange("")}
            />
          ) : (
            <User className="w-12 h-12 text-muted-foreground" />
          )}
          <div className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md">
            <Camera className="w-4 h-4" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 text-sm text-primary mt-4 touch-manipulation"
        >
          <ImagePlus className="w-4 h-4" />
          {photoUrl ? "Choose different photo" : "Choose from device"}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <CameraCapture
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCameraCapture}
      />
    </StepLayout>
  );
};

export default PhotoStep;
