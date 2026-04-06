import { useMemo } from 'react'
import { useTodoStore } from '../stores/todoStore'

export function useAutocomplete(listId, query) {
  const getAutocompleteItems = useTodoStore((s) => s.getAutocompleteItems)

  return useMemo(() => {
    if (!listId || !query || query.length < 2) return []
    const items = getAutocompleteItems(listId)
    const lower = query.toLowerCase()
    return items.filter((item) => item.toLowerCase().includes(lower)).slice(0, 5)
  }, [listId, query, getAutocompleteItems])
}
