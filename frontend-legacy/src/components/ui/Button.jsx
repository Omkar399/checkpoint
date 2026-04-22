const variants = {
  // Spotify's signature: green pill, black text, scales on hover
  primary:
    'bg-[var(--lime)] hover:bg-[#1ed775] text-black hover:scale-[1.04] shadow-[0_8px_16px_rgba(0,0,0,0.4)]',
  // Dark pill — secondary nav/action
  secondary:
    'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] text-white',
  // Transparent ghost
  ghost:
    'bg-transparent hover:bg-[var(--bg-modifier)] text-[var(--text-muted)] hover:text-white',
  // Outlined pill — follow/secondary CTA
  outline:
    'bg-transparent text-white border border-[var(--border-light)] hover:border-white hover:scale-[1.04]',
  // Semantic colored variants — functional, rarely used
  coral:
    'bg-[var(--coral)] hover:bg-[#ffb344] text-black',
  cyan:
    'bg-[var(--cyan)] hover:bg-[#6eaef7] text-black',
  danger:
    'bg-[var(--rose)] hover:bg-[#f58691] text-black',
}

const sizes = {
  sm: 'px-4 py-1.5 text-[11px]',
  md: 'px-5 py-2 text-xs',
  lg: 'px-8 py-3 text-sm',
  xl: 'px-10 py-4 text-sm',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        ${sizes[size] || sizes.md}
        rounded-full font-bold uppercase tracking-[0.14em]
        transition-all duration-150 ease-out
        active:scale-[0.97]
        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none
        ${variants[variant] || variants.primary}
        ${className}
      `}
      {...rest}
    >
      {children}
    </button>
  )
}
