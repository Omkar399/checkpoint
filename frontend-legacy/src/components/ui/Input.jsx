export default function Input({ label, error, className = '', hint, ...rest }) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-[13px] font-bold uppercase tracking-[0.10em] text-white mb-4">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-6 py-4 rounded-full
          bg-[var(--bg-tertiary)]
          text-white placeholder-[var(--text-dim)]
          text-[15px] font-medium
          border border-[var(--border-strong)]
          focus:outline-none focus:border-[var(--lime)] focus:ring-2 focus:ring-[var(--lime)]/30
          transition-colors
          ${error ? 'border-[var(--rose)] focus:border-[var(--rose)] focus:ring-[var(--rose)]/30' : ''}
          ${className}
        `}
        {...rest}
      />
      {hint && !error && (
        <p className="mt-2 text-xs text-[var(--text-muted)]">{hint}</p>
      )}
      {error && <p className="mt-2 text-xs text-[var(--rose)]">{error}</p>}
    </div>
  )
}
