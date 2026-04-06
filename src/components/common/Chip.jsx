export default function Chip({ label, active, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap
        ${active
          ? 'bg-accent text-white shadow-[0_0_12px_var(--color-accent-glow)]'
          : 'bg-surface text-text-dim border border-border hover:border-border-light'
        }
      `}
      style={active && color ? { backgroundColor: color } : undefined}
    >
      {label}
    </button>
  )
}
