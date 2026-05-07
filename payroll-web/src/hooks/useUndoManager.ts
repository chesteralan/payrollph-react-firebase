import { useState, useCallback, useRef } from 'react'

interface UndoAction {
  id: string
  type: string
  description: string
  undo: () => void
  redo: () => void
  timestamp: Date
}

interface UndoManager {
  history: UndoAction[]
  currentIndex: number
  canUndo: boolean
  canRedo: boolean
  push: (action: Omit<UndoAction, 'id' | 'timestamp'>) => void
  undo: () => void
  redo: () => void
  clear: () => void
}

export function useUndoManager(maxHistory = 20): UndoManager {
  const [history, setHistory] = useState<UndoAction[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const idCounter = useRef(0)

  const push = useCallback((action: Omit<UndoAction, 'id' | 'timestamp'>) => {
    idCounter.current++
    const newAction: UndoAction = {
      ...action,
      id: `undo-${idCounter.current}`,
      timestamp: new Date(),
    }

    setHistory(prev => {
      const truncated = prev.slice(0, currentIndex + 1)
      const updated = [...truncated, newAction]
      if (updated.length > maxHistory) {
        return updated.slice(updated.length - maxHistory)
      }
      return updated
    })
    setCurrentIndex(prev => {
      const newIdx = Math.min(prev + 1, maxHistory - 1)
      return newIdx
    })
  }, [currentIndex, maxHistory])

  const undo = useCallback(() => {
    if (currentIndex < 0 || history.length === 0) return
    const action = history[currentIndex]
    action.undo()
    setCurrentIndex(prev => prev - 1)
  }, [currentIndex, history])

  const redo = useCallback(() => {
    if (currentIndex >= history.length - 1) return
    const nextAction = history[currentIndex + 1]
    nextAction.redo()
    setCurrentIndex(prev => prev + 1)
  }, [currentIndex, history])

  const clear = useCallback(() => {
    setHistory([])
    setCurrentIndex(-1)
  }, [])

  return {
    history,
    currentIndex,
    canUndo: currentIndex >= 0 && history.length > 0,
    canRedo: currentIndex < history.length - 1,
    push,
    undo,
    redo,
    clear,
  }
}
