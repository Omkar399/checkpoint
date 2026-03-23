export default function ChannelItem({ channel, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-sm transition-colors duration-100 text-left ${
        active
          ? 'bg-[var(--bg-modifier)] text-[var(--text-primary)]'
          : 'text-[var(--text-muted)] hover:bg-[var(--bg-modifier)] hover:text-[var(--text-secondary)]'
      }`}
    >
      <span className="text-[var(--text-muted)] font-medium">#</span>
      <span className="truncate">{channel.name}</span>
    </button>
  )
}
