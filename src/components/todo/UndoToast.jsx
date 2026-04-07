import { useUiStore } from '../../stores/uiStore'

export default function UndoToast() {
  const undoAction = useUiStore((s) => s.undoAction)
  const executeUndo = useUiStore((s) => s.executeUndo)

  if (!undoAction) return null

  return (
    <div className="absolute bottom-20 left-0 right-0 z-30 flex justify-center animate-slide-up" style={{ padding: '0 20px' }}>
      <div style={{
        background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 4px 24px rgba(0,0,0,0.4)',
        borderRadius: 9999, padding: '12px 20px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{undoAction.message}</span>
        <span style={{ color: 'var(--color-text-ghost)' }}>·</span>
        <button onClick={executeUndo} style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-sun)' }}>Undo</button>
      </div>
    </div>
  )
}
