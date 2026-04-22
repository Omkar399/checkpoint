export default function ChannelItem({ channel, active, onClick }) {
  const hasTarget = !!channel.target_unit
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-2.5 px-3 py-2 rounded-lg
        text-sm transition-all duration-150 text-left group relative
        ${active
          ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
          : 'text-[var(--text-muted)] hover:bg-[var(--bg-modifier)] hover:text-[var(--text-secondary)]'}
      `}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[var(--lime)] rounded-r-full" />
      )}

      <span
        className={`
          w-5 h-5 flex items-center justify-center rounded
          text-[11px] font-bold shrink-0 transition-colors
          ${active
            ? 'bg-[var(--lime)] text-black'
            : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] group-hover:bg-[var(--bg-elevated)]'}
        `}
      >
        #
      </span>

      <span className="truncate flex-1 font-medium">{channel.name}</span>

      {hasTarget && (
        <span className={`
          text-[9px] mono uppercase tracking-wider shrink-0
          ${active ? 'text-[var(--cyan)]' : 'text-[var(--text-dim)]'}
        `}>
          {channel.target_unit.length > 8
            ? channel.target_unit.slice(0, 6) + '…'
            : channel.target_unit}
        </span>
      )}
    </button>
  )
}
