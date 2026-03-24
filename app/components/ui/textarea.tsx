import * as React from "react"

import { cn } from "~/components/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-gray-300 dark:border-[#3d3d3d] bg-white dark:bg-[#111111] px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 dark:placeholder:text-[#8e8ea0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] dark:focus-visible:ring-[#F2700D] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-gray-900 dark:text-[#ececf1]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
