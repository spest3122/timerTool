import { useState, useCallback } from 'react'
import { useSettings } from '../../context/SettingsContext'

/** Speaker icon — waves animate while speaking */
const SpeakerWaveIcon = ({ speaking }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill={speaking ? 'currentColor' : 'none'} />
    {speaking ? (
      <>
        <path d="M19.07 4.93a10 10 0 010 14.14" strokeDasharray="4 2" />
        <path d="M15.54 8.46a5 5 0 010 7.07" />
      </>
    ) : (
      <>
        <path d="M15.54 8.46a5 5 0 010 7.07" />
        <path d="M19.07 4.93a10 10 0 010 14.14" />
      </>
    )}
  </svg>
)

/** Lazy-loaded image with emoji placeholder fallback */
export function VocabImage({ src, alt, className, placeholderClass, emoji = '🖼️' }) {
  const [errored, setErrored] = useState(false)

  if (errored) {
    return (
      <div className={placeholderClass} role="img" aria-label={alt}>
        {emoji}
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setErrored(true)}
    />
  )
}

/**
 * SpeakButton — reads the active voice and language directly from
 * SettingsContext so it always honours the voice the user selected
 * in the Settings drawer.
 */
export function SpeakButton({ text }) {
  const { language, filteredVoices, selectedVoiceIndex } = useSettings()
  const [speaking, setSpeaking] = useState(false)

  const handleSpeak = useCallback(() => {
    if (!window.speechSynthesis || !text) return
    window.speechSynthesis.cancel()
    setSpeaking(true)

    const utterance = new SpeechSynthesisUtterance(text)

    // Use the voice selected in Settings if available
    const idx = parseInt(selectedVoiceIndex, 10)
    if (!isNaN(idx) && filteredVoices[idx]) {
      utterance.voice = filteredVoices[idx]
      utterance.lang  = filteredVoices[idx].lang
    } else {
      // Fallback to a sensible locale for the active language
      utterance.lang = language === 'de' ? 'de-DE'
                     : language === 'es' ? 'es-ES'
                     : 'en-US'
    }

    utterance.onend  = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }, [text, language, filteredVoices, selectedVoiceIndex])

  return (
    <button
      className={`speak-btn${speaking ? ' speaking' : ''}`}
      onClick={handleSpeak}
      aria-label={`Pronounce ${text}`}
      title="Listen to pronunciation"
    >
      <SpeakerWaveIcon speaking={speaking} />
    </button>
  )
}
