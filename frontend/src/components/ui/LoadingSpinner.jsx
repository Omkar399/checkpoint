export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-full w-full min-h-[200px]">
      <div className="w-8 h-8 border-3 border-[var(--text-muted)] border-t-[var(--accent)] rounded-full animate-spin" />
    </div>
  )
}
