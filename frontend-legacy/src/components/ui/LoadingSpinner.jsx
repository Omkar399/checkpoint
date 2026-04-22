export default function LoadingSpinner({ size = 'md' }) {
  const dims = { sm: 18, md: 28, lg: 44 }
  const d = dims[size] || dims.md
  return (
    <div className="flex items-center justify-center h-full w-full min-h-[120px]">
      <svg
        width={d}
        height={d}
        viewBox="0 0 44 44"
        className="animate-spin"
        style={{ animationDuration: '0.9s' }}
      >
        <circle
          cx="22" cy="22" r="18"
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth="3"
        />
        <path
          d="M 22 4 a 18 18 0 0 1 0 36"
          fill="none"
          stroke="var(--lime)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}
