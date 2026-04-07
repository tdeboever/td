import { useTodoStore } from '../../stores/todoStore'

export default function GhostItem({ todo }) {
  const reactivateTodo = useTodoStore((s) => s.reactivateTodo)

  return (
    <button
      onClick={() => reactivateTodo(todo.id)}
      className="w-full flex items-center gap-3 text-left opacity-30 hover:opacity-50 transition-opacity"
      style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}
    >
      <div className="flex-shrink-0 rounded-full" style={{ width: 22, height: 22, border: '2px dashed var(--color-border-light)' }} />
      <span className="flex-1 text-[15px] text-text-dim">{todo.text}</span>
      <span className="text-[11px] text-text-faint">{todo.completionCount}×</span>
    </button>
  )
}
