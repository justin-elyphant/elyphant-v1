import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Image as ImageIcon, 
  FileText, 
  Music, 
  Video,
  Download,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AttachmentDisplayProps {
  attachmentUrl: string;
  attachmentType: string;
  attachmentName: string;
  className?: string;
}

const AttachmentDisplay = ({ 
  attachmentUrl, 
  attachmentType, 
  attachmentName, 
  className 
}: AttachmentDisplayProps) => {
  const isImage = attachmentType?.startsWith('image/');
  const isAudio = attachmentType?.startsWith('audio/');
  const isVideo = attachmentType?.startsWith('video/');
  const isPdf = attachmentType === 'application/pdf';

  const getFileIcon = () => {
    if (isImage) return <ImageIcon className="h-4 w-4" />;
    if (isAudio) return <Music className="h-4 w-4" />;
    if (isVideo) return <Video className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = attachmentUrl;
    link.download = attachmentName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isImage) {
    return (
      <div className={cn("max-w-xs", className)}>
        <img 
          src={attachmentUrl} 
          alt={attachmentName}
          className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => window.open(attachmentUrl, '_blank')}
        />
        <p className="text-xs text-muted-foreground mt-1 truncate">
          {attachmentName}
        </p>
      </div>
    );
  }

  if (isAudio) {
    return (
      <div className={cn("max-w-xs", className)}>
        <audio 
          controls 
          className="w-full"
          preload="metadata"
        >
          <source src={attachmentUrl} type={attachmentType} />
          Your browser does not support the audio element.
        </audio>
        <p className="text-xs text-muted-foreground mt-1 truncate">
          {attachmentName}
        </p>
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className={cn("max-w-xs", className)}>
        <video 
          controls 
          className="w-full rounded-lg"
          preload="metadata"
        >
          <source src={attachmentUrl} type={attachmentType} />
          Your browser does not support the video element.
        </video>
        <p className="text-xs text-muted-foreground mt-1 truncate">
          {attachmentName}
        </p>
      </div>
    );
  }

  // Default file display
  return (
    <Card className={cn("max-w-xs cursor-pointer hover:bg-muted/50 transition-colors", className)}>
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {getFileIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {attachmentName}
            </p>
            <p className="text-xs text-muted-foreground">
              {attachmentType}
            </p>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => window.open(attachmentUrl, '_blank')}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleDownload}
            >
              <Download className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttachmentDisplay;