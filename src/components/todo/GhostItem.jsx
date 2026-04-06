import { useTodoStore } from '../../stores/todoStore'

export default function GhostItem({ todo }) {
  const reactivateTodo = useTodoStore((s) => s.reactivateTodo)

  return (
    <button
      onClick={() => reactivateTodo(todo.id)}
      className="w-full flex items-center gap-3 px-4 py-2.5 border-b border-border/50 opacity-30 hover:opacity-50 transition-opacity"
    >
      <div className="w-5 h-5 rounded-full border border-border-light/50 flex-shrink-0" />
      <span className="text-sm text-text-dim">{todo.text}</span>
      <span className="text-[9px] text-text-dim/50 ml-auto">{todo.completionCount}x</span>
    </button>
  )
}
