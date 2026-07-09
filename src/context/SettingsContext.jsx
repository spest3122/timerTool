import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [language, setLanguageState] = useState(
    () => localStorage.getItem('timerTool_language') || 'de'
  )
  const [filteredVoices, setFilteredVoices] = useState([])
  const [selectedVoiceIndex, setSelectedVoiceIndexState] = useState('')

  const loadVoices = useCallback((lang) => {
    if (typeof speechSynthesis === 'undefined') return
    const all = speechSynthesis.getVoices()
    const voices = all.filter(
      v => v.lang.startsWith(lang + '-') || v.lang.toLowerCase() === lang
    )
    setFilteredVoices(voices)
    const saved = localStorage.getItem(`timerTool_voice_${lang}`)
    const savedIdx = saved !== null ? parseInt(saved, 10) : -1
    setSelectedVoiceIndexState(savedIdx >= 0 && savedIdx < voices.length ? String(savedIdx) : '')
  }, [])

  useEffect(() => {
    loadVoices(language)
    if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => loadVoices(language)
    }
    return () => {
      if (typeof speechSynthesis !== 'undefined') {
        speechSynthesis.onvoiceschanged = null
      }
    }
  }, [language, loadVoices])

  const setLanguage = useCallback((lang) => {
    localStorage.setItem('timerTool_language', lang)
    setLanguageState(lang)
  }, [])

  const setSelectedVoiceIndex = useCallback((index) => {
    setSelectedVoiceIndexState(index)
    if (index !== '') {
      localStorage.setItem(`timerTool_voice_${language}`, index)
    }
  }, [language])

  /** Speak using the current global language's saved voice */
  const speak = useCallback((text) => {
    if (typeof speechSynthesis === 'undefined') return
    const utterance = new SpeechSynthesisUtterance(text)
    const idx = parseInt(selectedVoiceIndex, 10)
    if (!isNaN(idx) && filteredVoices[idx]) {
      utterance.voice = filteredVoices[idx]
      utterance.lang = filteredVoices[idx].lang
    } else {
      utterance.lang = language === 'de' ? 'de-DE' : language === 'en' ? 'en-US' : 'es-ES'
    }
    speechSynthesis.speak(utterance)
  }, [selectedVoiceIndex, filteredVoices, language])

  /**
   * Speak with a specific language's saved voice preference.
   * Used by ConvoPage so TTS respects the voice saved for that lesson language,
   * even if it differs from the global UI language.
   *
   * @param {string} text  - The text to speak
   * @param {string} lang  - Language code: 'de' | 'en' | 'es'
   */
  const speakWithLocale = useCallback((text, lang) => {
    if (typeof speechSynthesis === 'undefined') return
    speechSynthesis.cancel()
    const all = speechSynthesis.getVoices()
    // Get voices for this specific lang
    const voices = all.filter(v => v.lang.startsWith(lang + '-') || v.lang.toLowerCase() === lang)
    // Check for a saved preference for this lang
    const saved = localStorage.getItem(`timerTool_voice_${lang}`)
    const idx   = saved !== null ? parseInt(saved, 10) : -1
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate  = 0.88
    if (idx >= 0 && voices[idx]) {
      utterance.voice = voices[idx]
      utterance.lang  = voices[idx].lang
    } else {
      // Locale fallback
      const localeMap = { de: 'de-DE', en: 'en-US', es: 'es-ES' }
      const locale = localeMap[lang] ?? 'en-US'
      const fallback = all.find(v => v.lang === locale) ?? all.find(v => v.lang.startsWith(lang))
      if (fallback) { utterance.voice = fallback; utterance.lang = fallback.lang }
      else utterance.lang = locale
    }

    function doSpeak() { speechSynthesis.speak(utterance) }
    if (all.length > 0) {
      doSpeak()
    } else {
      speechSynthesis.addEventListener('voiceschanged', function onVC() {
        // Re-resolve voices after they load
        const all2 = speechSynthesis.getVoices()
        const v2 = all2.filter(v => v.lang.startsWith(lang + '-'))
        if (idx >= 0 && v2[idx]) { utterance.voice = v2[idx]; utterance.lang = v2[idx].lang }
        doSpeak()
        speechSynthesis.removeEventListener('voiceschanged', onVC)
      })
    }
  }, [])

  return (
    <SettingsContext.Provider value={{
      language,
      setLanguage,
      filteredVoices,
      selectedVoiceIndex,
      setSelectedVoiceIndex,
      speak,
      speakWithLocale,
    }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => useContext(SettingsContext)
