import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-full border-0 bg-[color:var(--color-ink-200)] px-4 py-2 text-sm text-foreground transition-colors outline-none placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-2 aria-invalid:ring-destructive/40",
        "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)] focus-visible:shadow-[inset_0_0_0_2px_#1ed760]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
