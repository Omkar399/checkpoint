import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Primary — Spotify Green CTA. Hover lifts & scales; active compresses.
        default:
          "bg-primary text-primary-foreground font-bold hover:bg-[color:var(--color-brand-hover)] hover:scale-[1.03] transition-transform",
        // Outlined — silver border on transparent, text turns white on hover
        outline:
          "border border-[color:var(--color-ink-700)] bg-transparent text-foreground hover:border-foreground hover:scale-[1.03] aria-expanded:border-foreground",
        // Secondary — dark surface pill, for muted actions
        secondary:
          "bg-[color:var(--color-ink-200)] text-foreground hover:bg-[color:var(--color-ink-300)] aria-expanded:bg-[color:var(--color-ink-300)]",
        // Ghost — text only, subtle hover background
        ghost:
          "bg-transparent text-muted-foreground hover:text-foreground hover:bg-[color:var(--color-ink-200)] aria-expanded:bg-[color:var(--color-ink-200)] aria-expanded:text-foreground",
        // Destructive — red, used sparingly
        destructive:
          "bg-destructive/15 text-destructive hover:bg-destructive/25 focus-visible:ring-destructive/40",
        // Link — Spotify uses underline-on-hover for inline text actions
        link: "bg-transparent text-foreground underline-offset-4 hover:underline focus-visible:underline",
      },
      size: {
        default: "h-10 gap-2 px-5",
        xs: "h-7 gap-1 px-3 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-4 text-[0.8125rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 px-8 text-[0.9375rem]",
        icon: "size-10 rounded-full",
        "icon-xs":
          "size-7 rounded-full [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-full [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-12 rounded-full [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
