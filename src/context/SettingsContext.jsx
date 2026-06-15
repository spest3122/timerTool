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

  return (
    <SettingsContext.Provider value={{
      language,
      setLanguage,
      filteredVoices,
      selectedVoiceIndex,
      setSelectedVoiceIndex,
      speak,
    }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => useContext(SettingsContext)
