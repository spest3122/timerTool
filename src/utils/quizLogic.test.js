import { describe, it, expect } from 'vitest'
import {
  formatDigital,
  formal24,
  colloquial,
  buildDataset,
  normalize,
  tokenDiff,
  defaultProgress,
  updateProgress,
  highDifficultyRatio,
  priorityWeight
} from './quizLogic'

describe('quizLogic utility', () => {
  describe('formatDigital', () => {
    it('pads hours and minutes correctly', () => {
      expect(formatDigital(9, 5)).toBe('09:05')
      expect(formatDigital(14, 30)).toBe('14:30')
    })
  })

  describe('formal24', () => {
    it('formats correctly', () => {
      expect(formal24(14, 0)).toBe('vierzehn Uhr')
      expect(formal24(14, 30)).toBe('vierzehn Uhr dreißig')
      expect(formal24(1, 15)).toBe('ein Uhr fünfzehn')
    })
  })

  describe('colloquial', () => {
    it('formats colloquial times correctly', () => {
      expect(colloquial(14, 0)).toBe('zwei Uhr')
      expect(colloquial(13, 0)).toBe('ein Uhr')
      expect(colloquial(14, 15)).toBe('viertel nach zwei')
      expect(colloquial(14, 30)).toBe('halb drei')
      expect(colloquial(14, 45)).toBe('viertel vor drei')
      expect(colloquial(14, 20)).toBe('zwanzig nach zwei')
      expect(colloquial(14, 40)).toBe('zwanzig vor drei')
      expect(colloquial(14, 25)).toBe('fünf vor halb drei')
      expect(colloquial(14, 35)).toBe('fünf nach halb drei')
    })
  })

  describe('buildDataset', () => {
    it('creates dataset with correct length', () => {
      const ds = buildDataset()
      expect(ds.length).toBe(24 * 60 * 2) // 2880
      expect(ds[0].id).toContain('L-00:00')
      expect(ds[1].id).toContain('H-00:00')
    })
  })

  describe('normalize', () => {
    it('lowercases and removes extra spaces', () => {
      expect(normalize('  Vierzehn   Uhr  ')).toBe('vierzehn uhr')
    })
  })

  describe('tokenDiff', () => {
    it('detects correct tokens', () => {
      const diff = tokenDiff('zwei uhr', 'zwei uhr')
      expect(diff).toEqual([{ text: 'zwei', type: 'ok' }, { text: 'uhr', type: 'ok' }])
    })

    it('detects missing and extra tokens', () => {
      const diff = tokenDiff('halb zwei', 'halb drei')
      expect(diff).toEqual([
        { text: 'halb', type: 'ok' },
        { text: 'zwei', type: 'extra' },
        { text: 'drei', type: 'missing' }
      ])
    })
  })

  describe('progress logic', () => {
    it('creates default progress', () => {
      const ds = [{ id: 'test1' }]
      const progress = defaultProgress(ds)
      expect(progress.test1).toBeDefined()
      expect(progress.test1.errorCount).toBe(0)
    })

    it('updates progress on correct answer', () => {
      const p = { test1: { questionId: 'test1', lastRetrievalTimestamp: 0, errorCount: 1, currentRepetitionInterval: 0, repetitions: 0 } }
      const updated = updateProgress(p, { id: 'test1' }, true, 2000)
      expect(updated.test1.repetitions).toBe(1)
      expect(updated.test1.errorCount).toBe(0) // decreased
      expect(updated.test1.currentRepetitionInterval).toBeGreaterThan(0)
    })

    it('updates progress on incorrect answer', () => {
      const p = { test1: { questionId: 'test1', lastRetrievalTimestamp: 0, errorCount: 0, currentRepetitionInterval: 1000, repetitions: 1 } }
      const updated = updateProgress(p, { id: 'test1' }, false, 5000)
      expect(updated.test1.repetitions).toBe(0)
      expect(updated.test1.errorCount).toBe(1)
    })
  })

  describe('SRS heuristics', () => {
    it('highDifficultyRatio works', () => {
      expect(highDifficultyRatio({ recent: [] })).toBe(0.5)
      expect(highDifficultyRatio({ recent: [{ correct: true, rt: 1000 }, { correct: true, rt: 1000 }, { correct: true, rt: 1000 }, { correct: true, rt: 1000 }] })).toBe(0.82)
    })

    it('priorityWeight returns positive weight', () => {
      const p = { test1: { questionId: 'test1', lastRetrievalTimestamp: Date.now() - 50000, currentRepetitionInterval: 25000, historicalAverageResponseTime: 5000, errorCount: 1 } }
      const w = priorityWeight({ id: 'test1' }, p)
      expect(w).toBeGreaterThan(0)
    })
  })
})
