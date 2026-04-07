import { useTodoStore } from '../../stores/todoStore'

export default function GhostItem({ todo }) {
  const reactivateTodo = useTodoStore((s) => s.reactivateTodo)

  return (
    <button onClick={() => reactivateTodo(todo.id)}
      className="w-full flex items-center gap-3 text-left transition-opacity"
      style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)', opacity: 0.25 }}
      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.45'}
      onMouseLeave={(e) => e.currentTarget.style.opacity = '0.25'}>
      <div className="flex-shrink-0 rounded-full" style={{ width: 22, height: 22, border: '2px dashed rgba(255,255,255,0.12)' }} />
      <span className="flex-1" style={{ fontSize: 15, color: 'var(--color-text-secondary)' }}>{todo.text}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-ghost)' }}>{todo.completionCount}×</span>
    </button>
  )
}
