
import React, { useState, useEffect } from "react";
import { useDebugMode } from "@/hooks/useDebugMode";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BugIcon, XCircleIcon } from "lucide-react";

export const DebugPanel = () => {
  const [isDebugMode, debugOptions] = useDebugMode();
  const [isVisible, setIsVisible] = useState(false);
  const [localOptions, setLocalOptions] = useState({
    bypassAuth: debugOptions.bypassAuth,
    mockUserId: debugOptions.mockUserId || 'test-user-id',
    mockUserEmail: debugOptions.mockUserEmail || 'test@example.com',
  });
  
  // Update local options when debug options change
  useEffect(() => {
    setLocalOptions({
      bypassAuth: debugOptions.bypassAuth,
      mockUserId: debugOptions.mockUserId || 'test-user-id',
      mockUserEmail: debugOptions.mockUserEmail || 'test@example.com',
    });
  }, [debugOptions]);
  
  const toggleVisibility = () => setIsVisible(!isVisible);
  
  const applySettings = () => {
    // Use the global window method defined in useDebugMode
    const toggleFn = (window as any).toggleDebugMode;
    if (toggleFn) {
      toggleFn(true, localOptions);
      // Navigate to apply changes without full reload
      window.location.href = window.location.pathname;
    }
  };
  
  const disableDebugMode = () => {
    const toggleFn = (window as any).toggleDebugMode;
    if (toggleFn) {
      toggleFn(false);
      // Navigate to apply changes without full reload
      window.location.href = window.location.pathname;
    }
  };
  
  // Allow toggling with keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+D to toggle debug panel
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        toggleVisibility();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return (
    <>
      {/* Floating button to toggle panel */}
      <button
        onClick={toggleVisibility}
        className="fixed bottom-4 right-4 p-3 rounded-full bg-slate-800 text-white z-50 shadow-lg"
        title="Debug Tools (Ctrl+Shift+D)"
      >
        <BugIcon size={24} />
      </button>
      
      {/* Debug panel */}
      {isVisible && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <Card className="w-[350px]">
            <CardHeader className="bg-slate-100 flex flex-row items-center justify-between">
              <CardTitle>Debug Tools</CardTitle>
              <XCircleIcon 
                onClick={toggleVisibility}
                className="cursor-pointer text-slate-500 hover:text-slate-800"
              />
            </CardHeader>
            
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="debug-mode">Debug Mode</Label>
                <Switch
                  id="debug-mode"
                  checked={isDebugMode}
                  onCheckedChange={(checked) => {
                    const toggleFn = (window as any).toggleDebugMode;
                    if (toggleFn) toggleFn(checked);
                  }}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="bypass-auth">Bypass Authentication</Label>
                  <Switch
                    id="bypass-auth"
                    checked={localOptions.bypassAuth}
                    onCheckedChange={(checked) => 
                      setLocalOptions(prev => ({ ...prev, bypassAuth: checked }))
                    }
                  />
                </div>
                
                {localOptions.bypassAuth && (
                  <>
                    <div className="space-y-1">
                      <Label htmlFor="mock-user-id">Mock User ID</Label>
                      <Input 
                        id="mock-user-id"
                        value={localOptions.mockUserId} 
                        onChange={(e) => 
                          setLocalOptions(prev => ({ 
                            ...prev, 
                            mockUserId: e.target.value 
                          }))
                        } 
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="mock-email">Mock Email</Label>
                      <Input 
                        id="mock-email"
                        value={localOptions.mockUserEmail} 
                        onChange={(e) => 
                          setLocalOptions(prev => ({ 
                            ...prev, 
                            mockUserEmail: e.target.value 
                          }))
                        } 
                      />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button 
                variant="destructive" 
                onClick={disableDebugMode}
                disabled={!isDebugMode}
              >
                Disable Debug
              </Button>
              
              <Button onClick={applySettings}>Apply Settings</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  );
};

export default DebugPanel;
