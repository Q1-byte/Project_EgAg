import { create } from 'zustand'
import type { StrokeData } from '../types'

interface CanvasState {
  strokes: StrokeData[]
  isAiTurn: boolean
  turnCount: number
  addStroke: (stroke: StrokeData) => void
  setAiTurn: (isAi: boolean) => void
  reset: () => void
}

export const useCanvasStore = create<CanvasState>((set) => ({
  strokes: [],
  isAiTurn: false,
  turnCount: 0,
  addStroke: (stroke) =>
    set((state) => ({ strokes: [...state.strokes, stroke] })),
  setAiTurn: (isAi) => set({ isAiTurn: isAi }),
  reset: () => set({ strokes: [], isAiTurn: false, turnCount: 0 }),
}))
