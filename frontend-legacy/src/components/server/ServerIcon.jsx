export default function ServerIcon({ server, active, onClick }) {
  return (
    <div className="flex items-center justify-center w-full relative group">
      <div
        className={`absolute left-0 w-[3px] bg-white rounded-r-full transition-all duration-300 ${
          active ? 'h-9' : 'h-0 group-hover:h-5'
        }`}
      />
      <button
        onClick={onClick}
        title={server.name}
        className={`
          relative w-12 h-12 flex items-center justify-center
          text-base font-bold transition-all duration-200
          ${active
            ? 'rounded-[12px] bg-[var(--bg-tertiary)] text-white shadow-[0_8px_16px_rgba(0,0,0,0.4)]'
            : 'rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:rounded-[12px] hover:bg-[var(--bg-tertiary)] hover:text-white'}
        `}
      >
        {server.name.charAt(0).toUpperCase()}
      </button>
    </div>
  )
}
