import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

const Progress = React.forwardRef(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={`relative h-2 w-full overflow-hidden rounded-full bg-slate-800/50 ${className}`}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={`h-full w-full flex-1 transition-all ${
        value >= 100 
          ? 'bg-gradient-to-r from-red-500 to-red-600' 
          : value >= 80 
          ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
          : 'bg-gradient-to-r from-emerald-500 to-teal-600'
      }`}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }