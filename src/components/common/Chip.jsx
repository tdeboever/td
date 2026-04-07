export default function Chip({ label, active, dot, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium
        whitespace-nowrap transition-all duration-150 border
        ${active
          ? 'bg-accent/15 text-accent border-accent/30'
          : 'bg-surface-hover/60 text-text-dim border-transparent hover:bg-surface-hover hover:text-text-secondary'
        }
      `}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: active ? undefined : dot }}
        />
      )}
      {label}
    </button>
  )
}
