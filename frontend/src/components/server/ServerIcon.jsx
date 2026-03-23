export default function ServerIcon({ server, active, onClick }) {
  return (
    <div className="flex items-center justify-center py-1 relative group">
      {active && (
        <div className="absolute left-0 w-1 h-10 bg-[var(--text-primary)] rounded-r-full" />
      )}
      {!active && (
        <div className="absolute left-0 w-1 h-0 bg-[var(--text-primary)] rounded-r-full transition-all duration-200 group-hover:h-5" />
      )}
      <button
        onClick={onClick}
        title={server.name}
        className={`w-12 h-12 flex items-center justify-center text-lg font-semibold transition-all duration-200 ${
          active
            ? 'bg-[var(--accent)] text-white rounded-2xl'
            : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-3xl hover:rounded-2xl hover:bg-[var(--accent)]'
        }`}
      >
        {server.name.charAt(0).toUpperCase()}
      </button>
    </div>
  )
}
