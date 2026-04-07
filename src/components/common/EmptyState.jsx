export default function EmptyState({ title = 'All clear', subtitle = 'Your inbox is empty' }) {
  return (
    <div className="flex flex-col items-center justify-center text-center animate-fade-in" style={{ padding: '60px 20px', minHeight: '30vh' }}>
      <span style={{ fontSize: 48, lineHeight: 1, opacity: 0.3, marginBottom: 16 }}>○</span>
      <p className="text-text-dim" style={{ fontSize: 22, fontWeight: 600 }}>{title}</p>
      <p className="text-text-dim" style={{ fontSize: 14, opacity: 0.6, marginTop: 8 }}>{subtitle}</p>
    </div>
  )
}
