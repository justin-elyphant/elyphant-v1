
import React from "react";
import ProfileImageUpload from "./ProfileImageUpload";

interface ProfileImageSectionProps {
  currentImage: string | null;
  name: string;
  onImageUpdate: (url: string | null) => void;
}

const ProfileImageSection: React.FC<ProfileImageSectionProps> = ({
  currentImage,
  name,
  onImageUpdate
}) => {
  return (
    <div className="flex justify-center mb-6">
      <ProfileImageUpload 
        currentImage={currentImage} 
        name={name} 
        onImageUpdate={onImageUpdate} 
      />
    </div>
  );
};

export default ProfileImageSection;
