import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"
import "./glass-button.css"

const glassButtonVariants = cva(
  "relative isolate inline-block all-unset cursor-pointer rounded-full no-underline transition-all",
  {
    variants: {
      size: {
        default: "text-base font-medium",
        sm: "text-sm font-medium",
        lg: "text-lg font-medium",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
)

const glassButtonTextVariants = cva(
  "glass-button-text relative block select-none tracking-tighter",
  {
    variants: {
      size: {
        default: "px-6 py-3.5",
        sm: "px-4 py-2",
        lg: "px-8 py-4",
        icon: "flex h-10 w-10 items-center justify-center",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
)

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof glassButtonVariants> {
  contentClassName?: string
}

export interface GlassLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof glassButtonVariants> {
  contentClassName?: string
}

export const GlassButton = React.forwardRef<
  HTMLButtonElement,
  GlassButtonProps
>(
  (
    { className, children, size, contentClassName, onClick, ...props },
    ref,
  ) => {
    const handleWrapperClick = (event: React.MouseEvent<HTMLDivElement>) => {
      const button = event.currentTarget.querySelector("button")

      if (button && !button.contains(event.target as Node)) button.click()
    }

    return (
      <div
        className={cn(
          "glass-button-wrap relative inline-block cursor-pointer rounded-full",
          className,
        )}
        onClick={handleWrapperClick}
      >
        <button
          className={cn(
            "glass-button relative z-10",
            glassButtonVariants({ size }),
          )}
          ref={ref}
          onClick={onClick}
          {...props}
        >
          <span
            className={cn(
              glassButtonTextVariants({ size }),
              contentClassName,
            )}
          >
            {children}
          </span>
        </button>
        <div className="glass-button-shadow pointer-events-none rounded-full" />
      </div>
    )
  },
)

GlassButton.displayName = "GlassButton"

export const GlassLink = React.forwardRef<HTMLAnchorElement, GlassLinkProps>(
  ({ className, children, size, contentClassName, onClick, ...props }, ref) => {
    const handleWrapperClick = (event: React.MouseEvent<HTMLDivElement>) => {
      const link = event.currentTarget.querySelector("a")

      if (link && !link.contains(event.target as Node)) link.click()
    }

    return (
      <div
        className={cn(
          "glass-button-wrap relative inline-block cursor-pointer rounded-full",
          className,
        )}
        onClick={handleWrapperClick}
      >
        <a
          className={cn(
            "glass-button relative z-10",
            glassButtonVariants({ size }),
          )}
          ref={ref}
          onClick={onClick}
          {...props}
        >
          <span
            className={cn(
              glassButtonTextVariants({ size }),
              contentClassName,
            )}
          >
            {children}
          </span>
        </a>
        <div className="glass-button-shadow pointer-events-none rounded-full" />
      </div>
    )
  },
)

GlassLink.displayName = "GlassLink"
