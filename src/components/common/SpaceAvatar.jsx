export default function SpaceAvatar({ space, size = 24 }) {
  // Always use letter avatar — ignore old folder emoji defaults
  const letter = (space.icon?.length === 1 && space.icon !== '📁') ? space.icon : space.name?.charAt(0)?.toUpperCase() || '?'

  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.35,
      background: space.color || 'var(--accent-lavender)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.45, fontWeight: 700, color: 'white',
      flexShrink: 0,
      textShadow: '0 1px 2px rgba(0,0,0,0.2)',
    }}>
      {letter}
    </div>
  )
}
