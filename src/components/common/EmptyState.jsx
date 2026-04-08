export default function EmptyState({ title = 'All clear', subtitle = 'Your inbox is empty' }) {
  return (
    <div className="flex flex-col items-center justify-center text-center relative" style={{ padding: '60px 20px', minHeight: '30vh' }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 40%, rgba(251,191,36,0.04) 0%, transparent 70%)',
        backgroundSize: '200% 200%', animation: 'ghostGradient 12s ease-in-out infinite',
      }} />
      <span className="relative animate-task-enter" style={{ fontSize: 36, color: 'var(--accent-amber)', marginBottom: 16, textShadow: '0 0 20px rgba(251,191,36,0.4)', animationDelay: '0ms' }}>✦</span>
      <p className="relative animate-task-enter" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--text-secondary)', animationDelay: '100ms' }}>{title}</p>
      <p className="relative animate-task-enter" style={{ fontSize: 14, color: 'var(--text-ghost)', marginTop: 8, animationDelay: '200ms' }}>{subtitle}</p>
    </div>
  )
}
