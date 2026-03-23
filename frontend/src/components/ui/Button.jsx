const variants = {
  primary:
    'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white',
  secondary:
    'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-modifier)] text-[var(--text-primary)]',
  danger:
    'bg-[var(--danger)] hover:bg-red-700 text-white',
}

export default function Button({ variant = 'primary', className = '', children, ...rest }) {
  return (
    <button
      className={`px-4 py-2 rounded font-medium text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant] || variants.primary} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
