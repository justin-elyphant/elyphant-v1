
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Paperclip, Image, File, Camera } from "lucide-react";

interface AttachmentButtonProps {
  onAttachFile: (type: "file" | "image" | "camera") => void;
}

const AttachmentButton = ({ onAttachFile }: AttachmentButtonProps) => {
  const [open, setOpen] = useState(false);

  const handleAttachment = (type: "file" | "image" | "camera") => {
    onAttachFile(type);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8">
          <Paperclip className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48" align="end">
        <div className="space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleAttachment("image")}
          >
            <Image className="h-4 w-4 mr-2" />
            Photos
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleAttachment("camera")}
          >
            <Camera className="h-4 w-4 mr-2" />
            Camera
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleAttachment("file")}
          >
            <File className="h-4 w-4 mr-2" />
            Documents
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AttachmentButton;
