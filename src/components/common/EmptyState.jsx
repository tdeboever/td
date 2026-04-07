export default function EmptyState({ title = 'All clear', subtitle = 'Your inbox is empty' }) {
  return (
    <div className="flex flex-col items-center justify-center text-center animate-fade-in relative" style={{ padding: '60px 20px', minHeight: '30vh' }}>
      {/* Breathing gradient — the app feels alive even when idle */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 40%, rgba(255,107,53,0.02) 0%, transparent 70%)',
        backgroundSize: '200% 200%',
        animation: 'ghostGradient 8s ease-in-out infinite',
      }} />

      <span className="relative" style={{ fontSize: 48, lineHeight: 1, opacity: 0.2, marginBottom: 16 }}>○</span>
      <p className="relative text-text-dim" style={{ fontSize: 22, fontWeight: 600 }}>{title}</p>
      <p className="relative text-text-dim" style={{ fontSize: 14, opacity: 0.5, marginTop: 8 }}>{subtitle}</p>
    </div>
  )
}
