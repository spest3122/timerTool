import { describe, it, expect } from 'vitest'
import { buildMultilingualTime, dialWordsMapping } from './timeLanguage'

describe('timeLanguage utility', () => {
  describe('buildMultilingualTime - German', () => {
    it('formats exact hours', () => {
      const time = buildMultilingualTime('de', 14, 0)
      expect(time.official12).toBe('zwei Uhr')
      expect(time.official24).toBe('vierzehn Uhr')
      expect(time.informal).toContain('zwei Uhr')
    })

    it('formats half hours', () => {
      const time = buildMultilingualTime('de', 14, 30)
      expect(time.informal).toContain('halb drei')
      expect(time.official12).toBe('zwei Uhr dreißig')
    })

    it('formats quarter past and to', () => {
      const timePast = buildMultilingualTime('de', 14, 15)
      expect(timePast.informal).toContain('Viertel nach zwei')

      const timeTo = buildMultilingualTime('de', 14, 45)
      expect(timeTo.informal).toContain('Viertel vor drei')
    })
  })

  describe('buildMultilingualTime - English', () => {
    it('formats exact hours', () => {
      const time = buildMultilingualTime('en', 14, 0)
      expect(time.official12).toBe("two o'clock")
      expect(time.official24).toBe('fourteen hundred')
      expect(time.informal).toContain("two o'clock")
    })

    it('formats minutes', () => {
      const timePast = buildMultilingualTime('en', 14, 15)
      expect(timePast.informal).toContain('quarter past two')
      expect(timePast.official12).toBe('two fifteen')

      const timeTo = buildMultilingualTime('en', 14, 50)
      expect(timeTo.informal).toContain('ten to three')
      expect(timeTo.official12).toBe('two fifty')
    })
  })

  describe('buildMultilingualTime - Spanish', () => {
    it('formats exact hours', () => {
      const time = buildMultilingualTime('es', 14, 0)
      expect(time.official12).toBe('Son las dos')
      expect(time.official24).toBe('Son las catorce')
      expect(time.informal).toContain('Son las dos en punto')
    })

    it('formats plural and singular hours correctly', () => {
      const timePlural = buildMultilingualTime('es', 14, 30)
      expect(timePlural.informal).toContain('Son las dos y media')

      const timeSingular = buildMultilingualTime('es', 13, 0)
      expect(timeSingular.official12).toBe('Es la una')
    })

    it('formats quarter past and to', () => {
      const timePast = buildMultilingualTime('es', 14, 15)
      expect(timePast.informal).toContain('Son las dos y cuarto')

      const timeTo = buildMultilingualTime('es', 14, 45)
      expect(timeTo.informal).toContain('Son las tres menos cuarto')
    })
  })

  describe('dialWordsMapping', () => {
    it('contains correct mappings', () => {
      expect(dialWordsMapping.en[1]).toBe('one')
      expect(dialWordsMapping.de[1]).toBe('eins')
      expect(dialWordsMapping.es[1]).toBe('una')
    })
  })
})
