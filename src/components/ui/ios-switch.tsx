
import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"

interface IOSSwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  size?: "sm" | "md" | "lg"
}

const IOSSwitch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  IOSSwitchProps
>(({ className, size = "md", ...props }, ref) => {
  const sizeClasses = {
    sm: "h-5 w-9",
    md: "h-6 w-11", 
    lg: "h-7 w-13"
  }
  
  const thumbSizeClasses = {
    sm: "h-4 w-4 data-[state=checked]:translate-x-4",
    md: "h-5 w-5 data-[state=checked]:translate-x-5",
    lg: "h-6 w-6 data-[state=checked]:translate-x-6"
  }

  return (
    <SwitchPrimitives.Root
      className={cn(
        "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-indigo-600 data-[state=checked]:shadow-lg data-[state=checked]:shadow-purple-200",
        "data-[state=unchecked]:bg-gray-300 data-[state=unchecked]:hover:bg-gray-400",
        "shadow-inner hover:shadow-md transition-shadow duration-200",
        sizeClasses[size],
        className
      )}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block rounded-full bg-white shadow-lg ring-0 transition-all duration-300 ease-out",
          "data-[state=unchecked]:translate-x-0.5 data-[state=checked]:shadow-xl",
          thumbSizeClasses[size]
        )}
      />
    </SwitchPrimitives.Root>
  )
})
IOSSwitch.displayName = SwitchPrimitives.Root.displayName

export { IOSSwitch }
