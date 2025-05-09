
import React, { useState, useRef } from "react";
import { Search, Mic, Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface AdvancedSearchProps {
  onSearch: (term: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const AdvancedSearch = ({
  onSearch,
  searchTerm,
  setSearchTerm,
}: AdvancedSearchProps) => {
  const isMobile = useIsMobile();
  const [isVoiceSearchActive, setIsVoiceSearchActive] = useState(false);
  const [isVisualSearchActive, setIsVisualSearchActive] = useState(false);
  const [voiceSearchText, setVoiceSearchText] = useState("");
  const [visualSearchFile, setVisualSearchFile] = useState<File | null>(null);
  const [visualSearchPreview, setVisualSearchPreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Voice recognition reference
  const recognitionRef = useRef<any>(null);
  
  // Handle searching
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchTerm.trim()) {
      onSearch(searchTerm);
    }
  };
  
  // Handle voice search dialog
  const startVoiceSearch = () => {
    setIsVoiceSearchActive(true);
    setVoiceSearchText("");
    
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast.error("Voice search is not supported in this browser");
      return;
    }
    
    try {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onstart = () => {
        setIsRecording(true);
      };
      
      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        setVoiceSearchText(finalTranscript || interimTranscript);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error("Voice recognition error", event);
        toast.error("Error with voice recognition");
        setIsRecording(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
      
      recognitionRef.current.start();
    } catch (error) {
      console.error("Error starting voice recognition:", error);
      toast.error("Could not start voice recognition");
    }
  };

  const stopVoiceSearch = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };
  
  const completeVoiceSearch = () => {
    stopVoiceSearch();
    if (voiceSearchText.trim()) {
      setSearchTerm(voiceSearchText.trim());
      onSearch(voiceSearchText.trim());
      setIsVoiceSearchActive(false);
      toast.success(`Searching for "${voiceSearchText.trim()}"`);
    } else {
      toast.error("No search term detected");
    }
  };
  
  const cancelVoiceSearch = () => {
    stopVoiceSearch();
    setIsVoiceSearchActive(false);
  };
  
  // Handle visual search dialog
  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type and size
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("Image size should be less than 5MB");
        return;
      }
      
      setVisualSearchFile(file);
      
      // Create preview URL
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setVisualSearchPreview(fileReader.result as string);
      };
      fileReader.readAsDataURL(file);
      
      setIsVisualSearchActive(true);
    }
  };
  
  const handleVisualSearch = () => {
    if (!visualSearchFile) {
      toast.error("No image selected");
      return;
    }
    
    setIsProcessing(true);
    
    // Simulate image recognition process
    setTimeout(() => {
      // In a real application, this would be where you'd send the image to a server for processing
      // For this demo, we'll just use a mock result
      const mockResults = ["watch", "bracelet", "accessories"];
      const randomResult = mockResults[Math.floor(Math.random() * mockResults.length)];
      
      setSearchTerm(randomResult);
      onSearch(randomResult);
      setIsVisualSearchActive(false);
      setIsProcessing(false);
      setVisualSearchFile(null);
      setVisualSearchPreview(null);
      
      toast.success(`Found items similar to your image: "${randomResult}"`);
    }, 1500);
  };
  
  return (
    <>
      <div className="relative w-full max-w-3xl mx-auto">
        <form onSubmit={handleSearch} className="flex items-center">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for gifts, occasions, or recipients..."
              className="pl-10 pr-20 h-11"
            />
            <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={startVoiceSearch}
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Search with voice</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={openFileDialog}
                    >
                      <Camera className="h-4 w-4" />
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Search with image</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <Button 
            type="submit" 
            className={isMobile ? "ml-2 px-3" : "ml-2"}
          >
            Search
          </Button>
        </form>
      </div>
      
      {/* Voice Search Dialog */}
      <Dialog open={isVoiceSearchActive} onOpenChange={setIsVoiceSearchActive}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Voice Search</DialogTitle>
            <DialogDescription>
              Speak clearly to search for products
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center py-6">
            <div 
              className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 transition-colors ${
                isRecording ? 'bg-red-100 animate-pulse' : 'bg-slate-100'
              }`}
            >
              <Mic className={`h-12 w-12 ${isRecording ? 'text-red-500' : 'text-slate-500'}`} />
            </div>
            
            <div className="min-h-[60px] w-full max-w-sm bg-muted p-3 rounded-md text-center">
              {voiceSearchText ? (
                <p>{voiceSearchText}</p>
              ) : (
                <p className="text-muted-foreground italic">
                  {isRecording ? "Listening..." : "Press Start to begin speaking"}
                </p>
              )}
            </div>
          </div>
          
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={cancelVoiceSearch}
            >
              Cancel
            </Button>
            
            {isRecording ? (
              <Button
                type="button"
                variant="destructive"
                onClick={stopVoiceSearch}
              >
                Stop
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={startVoiceSearch}
                >
                  Start
                </Button>
                <Button
                  type="button"
                  variant="default"
                  onClick={completeVoiceSearch}
                  disabled={!voiceSearchText}
                >
                  Search
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Visual Search Dialog */}
      <Dialog open={isVisualSearchActive} onOpenChange={setIsVisualSearchActive}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Visual Search</DialogTitle>
            <DialogDescription>
              Find products similar to your image
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center py-4">
            {visualSearchPreview ? (
              <div className="relative w-full max-w-sm h-64 border rounded-md overflow-hidden mb-4">
                <img 
                  src={visualSearchPreview} 
                  alt="Search preview"
                  className="w-full h-full object-contain"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 bg-white/80 backdrop-blur-sm"
                  onClick={() => {
                    setVisualSearchFile(null);
                    setVisualSearchPreview(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div 
                className="w-full max-w-sm h-64 border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors mb-4"
                onClick={openFileDialog}
              >
                <Camera className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Click to upload an image</p>
                <p className="text-xs text-muted-foreground">JPG, PNG, GIF up to 5MB</p>
              </div>
            )}
            
            <p className="text-sm text-muted-foreground text-center mb-4">
              We'll find products that match or are similar to your image
            </p>
          </div>
          
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsVisualSearchActive(false)}
            >
              Cancel
            </Button>
            
            <Button
              type="button"
              onClick={handleVisualSearch}
              disabled={!visualSearchFile || isProcessing}
            >
              {isProcessing ? "Processing..." : "Find Similar Products"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdvancedSearch;
