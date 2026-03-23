export default function Input({ label, error, className = '', ...rest }) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-bold uppercase text-[var(--text-secondary)] mb-2">
          {label}
        </label>
      )}
      <input
        className={`w-full px-3 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors ${error ? 'border-[var(--danger)]' : ''} ${className}`}
        {...rest}
      />
      {error && <p className="mt-1 text-xs text-[var(--danger)]">{error}</p>}
    </div>
  )
}
