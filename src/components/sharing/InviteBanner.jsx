import { useShareStore } from '../../stores/shareStore'

export default function InviteBanner() {
  const incoming = useShareStore((s) => s.incoming)
  const acceptShare = useShareStore((s) => s.acceptShare)
  const declineShare = useShareStore((s) => s.declineShare)

  const pending = incoming.filter(s => s.status === 'pending')
  if (pending.length === 0) return null

  return (
    <div style={{ padding: '0 20px 12px' }}>
      {pending.map(s => (
        <div key={s.id} className="animate-slide-down" style={{
          padding: '12px 14px', borderRadius: 14,
          background: 'rgba(255,123,84,0.08)',
          border: '1px solid rgba(255,123,84,0.15)',
          marginBottom: 8,
        }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>
            {s.owner?.display_name || 'Someone'} shared a list
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
            "{s.list?.name || 'Untitled'}"
          </p>
          <div className="flex gap-2">
            <button onClick={() => acceptShare(s.id)}
              style={{
                padding: '6px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                background: 'linear-gradient(135deg, var(--accent-coral), var(--accent-rose))',
                color: 'white',
              }}>
              Accept
            </button>
            <button onClick={() => declineShare(s.id)}
              style={{ padding: '6px 16px', borderRadius: 10, fontSize: 12, fontWeight: 500, color: 'var(--text-ghost)' }}>
              Decline
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
