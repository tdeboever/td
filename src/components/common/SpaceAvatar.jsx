export default function SpaceAvatar({ space, size = 24 }) {
  const letter = space.icon?.length === 1 ? space.icon : space.name?.charAt(0)?.toUpperCase() || '?'
  const isEmoji = space.icon?.length > 1

  if (isEmoji) {
    return <span style={{ fontSize: size * 0.7, lineHeight: 1 }}>{space.icon}</span>
  }

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
