import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useShareStore } from '../../stores/shareStore'

export default function ShareSheet({ listId, listName, onClose }) {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState(null)
  const inviteUser = useShareStore((s) => s.inviteUser)
  const outgoing = useShareStore((s) => s.outgoing)
  const revokeShare = useShareStore((s) => s.revokeShare)

  const listShares = outgoing.filter(s => s.list_id === listId)

  const handleInvite = async (e) => {
    e.preventDefault()
    if (!email.trim() || sending) return
    setSending(true)
    setMessage(null)
    const result = await inviteUser(listId, email.trim())
    setSending(false)
    if (result.ok) {
      setEmail('')
      setMessage({ type: 'success', text: `Invited ${result.targetName || email}` })
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to invite' })
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50" style={{ touchAction: 'none' }}>
      <div className="absolute inset-0 animate-fade-in" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }} onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 animate-slide-up" style={{
        background: 'var(--bg-mid)', borderRadius: '24px 24px 0 0',
        padding: '20px 20px 40px', maxHeight: '60vh', overflowY: 'auto',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.3)',
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border-visible)', margin: '0 auto 16px' }} />

        <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
          Share "{listName}"
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-ghost)', marginBottom: 16 }}>
          Invite someone to co-edit this list
        </p>

        <form onSubmit={handleInvite} className="flex gap-2" style={{ marginBottom: 16 }}>
          <input value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address..."
            type="email" autoComplete="off"
            className="flex-1 bg-transparent outline-none"
            style={{ fontSize: 14, color: 'var(--text-primary)', padding: '10px 14px', borderRadius: 12, background: 'var(--surface-card)' }} />
          <button type="submit" disabled={sending || !email.trim()}
            style={{
              padding: '10px 18px', borderRadius: 12, fontSize: 13, fontWeight: 600,
              background: 'linear-gradient(135deg, var(--accent-coral), var(--accent-rose))',
              color: 'white', opacity: sending ? 0.5 : 1,
            }}>
            {sending ? '...' : 'Invite'}
          </button>
        </form>

        {message && (
          <p style={{ fontSize: 12, marginBottom: 12, color: message.type === 'error' ? 'var(--color-danger)' : 'var(--accent-mint)' }}>
            {message.text}
          </p>
        )}

        {listShares.length > 0 && (
          <>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-ghost)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Shared with
            </p>
            {listShares.map(s => (
              <div key={s.id} className="flex items-center justify-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                  <p style={{ fontSize: 14, color: 'var(--text-primary)' }}>{s.shared_user?.display_name || s.shared_user?.email}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-ghost)' }}>
                    {s.status === 'pending' ? 'Pending...' : s.status === 'accepted' ? 'Active' : 'Declined'}
                  </p>
                </div>
                <button onClick={() => revokeShare(s.id)}
                  style={{ fontSize: 12, color: 'var(--color-danger)', opacity: 0.6, padding: '4px 8px' }}>
                  Remove
                </button>
              </div>
            ))}
          </>
        )}

        <button onClick={onClose} style={{
          width: '100%', marginTop: 16, padding: '12px', borderRadius: 14,
          fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', background: 'var(--surface-card)',
        }}>
          Done
        </button>
      </div>
    </div>,
    document.body
  )
}
