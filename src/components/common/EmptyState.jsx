export default function EmptyState({ icon = '✨', title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-4xl mb-4">{icon}</span>
      <p className="text-text-dim text-sm font-medium">{title}</p>
      {subtitle && <p className="text-text-dim/50 text-xs mt-1">{subtitle}</p>}
    </div>
  )
}
