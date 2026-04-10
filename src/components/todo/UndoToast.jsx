import { useUiStore } from '../../stores/uiStore'

export default function UndoToast() {
  const undoAction = useUiStore((s) => s.undoAction)
  const executeUndo = useUiStore((s) => s.executeUndo)
  if (!undoAction) return null

  return (
    <div className="fixed z-30 flex justify-center animate-slide-up" style={{ bottom: 140, left: 0, right: 0, padding: '0 20px' }}>
      <div style={{
        background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.10), 0 8px 32px rgba(0,0,0,0.25)',
        borderRadius: 9999, padding: '12px 20px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ color: 'var(--accent-mint)', fontSize: 14 }}>✓</span>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{undoAction.message}</span>
        <span style={{ color: 'var(--text-ghost)', margin: '0 2px' }}>·</span>
        <button onClick={executeUndo} style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-coral)' }}>Undo</button>
      </div>
    </div>
  )
}
