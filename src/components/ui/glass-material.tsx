import * as React from "react"

import { cn } from "../../lib/utils"
import "./glass-button.css"

export interface GlassMaterialProps
  extends React.HTMLAttributes<HTMLDivElement> {
  materialClassName?: string
}

/**
 * A reusable glass surface built from the same layers as GlassButton.
 * Put any non-button content inside it, such as a form field or status chip.
 */
export const GlassMaterial = React.forwardRef<HTMLDivElement, GlassMaterialProps>(
  ({ className, materialClassName, children, ...props }, ref) => (
    <div className={cn("glass-button-wrap glass-material-wrap", className)}>
      <div
        ref={ref}
        className={cn("glass-button glass-material", materialClassName)}
        {...props}
      >
        {children}
      </div>
      <div className="glass-button-shadow pointer-events-none rounded-full" />
    </div>
  ),
)

GlassMaterial.displayName = "GlassMaterial"
