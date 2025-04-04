
import * as React from "react"
import { Smartphone, Tablet, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"

type ViewportSize = "mobile" | "tablet" | "desktop"

export function ViewportToggle() {
  const [activeViewport, setActiveViewport] = React.useState<ViewportSize>("desktop")
  const isMobile = useIsMobile()
  
  // Store the original viewport size
  const [originalWidth, setOriginalWidth] = React.useState<number | null>(null)
  
  React.useEffect(() => {
    // Save the original viewport width on first render
    if (originalWidth === null) {
      setOriginalWidth(window.innerWidth)
    }
  }, [originalWidth])
  
  const handleViewportChange = (size: ViewportSize) => {
    setActiveViewport(size)
    
    // Set viewport size
    if (size === "mobile") {
      document.documentElement.style.width = "375px"
    } else if (size === "tablet") {
      document.documentElement.style.width = "768px"
    } else {
      // Reset to original/full width
      document.documentElement.style.width = originalWidth ? `${originalWidth}px` : "100%"
    }
  }
  
  // Don't show on actual mobile devices
  if (isMobile) return null
  
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white rounded-full shadow-lg flex p-1">
      <Button
        variant={activeViewport === "mobile" ? "default" : "ghost"}
        size="icon"
        onClick={() => handleViewportChange("mobile")}
        title="Mobile view (375px)"
      >
        <Smartphone className="h-4 w-4" />
      </Button>
      
      <Button
        variant={activeViewport === "tablet" ? "default" : "ghost"}
        size="icon"
        onClick={() => handleViewportChange("tablet")}
        title="Tablet view (768px)"
      >
        <Tablet className="h-4 w-4" />
      </Button>
      
      <Button
        variant={activeViewport === "desktop" ? "default" : "ghost"}
        size="icon"
        onClick={() => handleViewportChange("desktop")}
        title="Desktop view (full width)"
      >
        <Monitor className="h-4 w-4" />
      </Button>
    </div>
  )
}
