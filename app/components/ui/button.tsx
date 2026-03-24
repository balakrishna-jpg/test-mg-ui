import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "~/components/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#0EA5E9] text-white hover:bg-[#0EA5E9]/90 dark:bg-[#F2700D] dark:hover:bg-[#F2700D]/90",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800",
        outline:
          "border border-gray-300 dark:border-[#3d3d3d] bg-white dark:bg-[#111111] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] text-gray-900 dark:text-[#ececf1]",
        secondary:
          "bg-gray-100 dark:bg-[#1f1f1f] text-gray-900 dark:text-[#ececf1] hover:bg-gray-200 dark:hover:bg-[#353535]",
        ghost: "hover:bg-gray-100 dark:hover:bg-[#1f1f1f] text-gray-900 dark:text-[#ececf1]",
        link: "text-[#0EA5E9] dark:text-[#F2700D] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
