import { useUiStore } from '../../stores/uiStore'

export default function UndoToast() {
  const undoAction = useUiStore((s) => s.undoAction)
  const executeUndo = useUiStore((s) => s.executeUndo)
  const dismissUndo = useUiStore((s) => s.dismissUndo)

  if (!undoAction) return null

  return (
    <div className="absolute bottom-20 left-4 right-4 z-30 animate-in">
      <div className="bg-surface border border-border rounded-xl px-4 py-3 flex items-center justify-between shadow-lg">
        <span className="text-sm text-text">{undoAction.message}</span>
        <div className="flex items-center gap-3">
          <button onClick={executeUndo} className="text-accent text-sm font-semibold">
            Undo
          </button>
          <button onClick={dismissUndo} className="text-text-dim text-xs">
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
