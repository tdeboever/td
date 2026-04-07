import { useUiStore } from '../../stores/uiStore'

export default function UndoToast() {
  const undoAction = useUiStore((s) => s.undoAction)
  const executeUndo = useUiStore((s) => s.executeUndo)

  if (!undoAction) return null

  return (
    <div className="absolute bottom-20 left-5 right-5 z-30 flex justify-center animate-slide-up">
      <div className="bg-surface border border-border rounded-full px-5 py-2.5 flex items-center gap-2"
        style={{ backdropFilter: 'blur(12px)' }}>
        <span className="text-[13px] text-text">{undoAction.message}</span>
        <span className="text-text-faint mx-0.5">·</span>
        <button onClick={executeUndo} className="text-[13px] text-accent font-medium">Undo</button>
      </div>
    </div>
  )
}
