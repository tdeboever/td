export default function EmptyState({ title = 'All clear', subtitle = 'Your inbox is empty' }) {
  return (
    <div className="flex flex-col items-center justify-center text-center relative" style={{ padding: '60px 20px', minHeight: '30vh' }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 40%, rgba(255,170,64,0.03) 0%, transparent 70%)',
        backgroundSize: '200% 200%',
        animation: 'ghostGradient 8s ease-in-out infinite',
      }} />
      <span className="relative animate-task-enter" style={{
        fontSize: 32, color: 'var(--accent-sun)', marginBottom: 16,
        textShadow: '0 0 16px rgba(255,170,64,0.4)',
        animationDelay: '0ms',
      }}>✦</span>
      <p className="relative animate-task-enter" style={{
        fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 24,
        color: 'var(--color-text-secondary)',
        animationDelay: '100ms',
      }}>{title}</p>
      <p className="relative animate-task-enter" style={{
        fontSize: 14, color: 'var(--color-text-ghost)', marginTop: 8,
        animationDelay: '200ms',
      }}>{subtitle}</p>
    </div>
  )
}
