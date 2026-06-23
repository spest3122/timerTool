import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SettingsProvider, useSettings } from './SettingsContext'

const TestComponent = () => {
  const { language, setLanguage, filteredVoices, selectedVoiceIndex, setSelectedVoiceIndex, speak } = useSettings()
  return (
    <div>
      <div data-testid="lang">{language}</div>
      <button onClick={() => setLanguage('es')}>Set Lang ES</button>
      <div data-testid="voiceIndex">{selectedVoiceIndex}</div>
      <button onClick={() => setSelectedVoiceIndex('1')}>Set Voice 1</button>
      <div data-testid="voicesCount">{filteredVoices.length}</div>
      <button onClick={() => speak('hello')}>Speak</button>
    </div>
  )
}

describe('SettingsContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    global.speechSynthesis = {
      getVoices: vi.fn().mockReturnValue([
        { name: 'English Voice', lang: 'en-US' },
        { name: 'German Voice', lang: 'de-DE' },
        { name: 'German Voice 2', lang: 'de-CH' }
      ]),
      speak: vi.fn(),
      onvoiceschanged: null
    }
    global.SpeechSynthesisUtterance = class SpeechSynthesisUtterance {
      constructor(text) { this.text = text; }
    }
  })

  it('provides default values and loads voices', () => {
    render(<SettingsProvider><TestComponent /></SettingsProvider>)
    expect(screen.getByTestId('lang')).toHaveTextContent('de')
    expect(screen.getByTestId('voicesCount')).toHaveTextContent('2') // de-DE and de-CH voices
  })

  it('updates language and saves to localStorage', () => {
    render(<SettingsProvider><TestComponent /></SettingsProvider>)
    fireEvent.click(screen.getByText('Set Lang ES'))
    expect(screen.getByTestId('lang')).toHaveTextContent('es')
    expect(localStorage.getItem('timerTool_language')).toBe('es')
  })

  it('updates voice index and saves to localStorage', () => {
    render(<SettingsProvider><TestComponent /></SettingsProvider>)
    fireEvent.click(screen.getByText('Set Voice 1'))
    expect(screen.getByTestId('voiceIndex')).toHaveTextContent('1')
    expect(localStorage.getItem('timerTool_voice_de')).toBe('1')
  })

  it('calls speechSynthesis.speak', () => {
    render(<SettingsProvider><TestComponent /></SettingsProvider>)
    fireEvent.click(screen.getByText('Speak'))
    expect(global.speechSynthesis.speak).toHaveBeenCalled()
    const utterance = global.speechSynthesis.speak.mock.calls[0][0]
    expect(utterance.text).toBe('hello')
  })

  it('loads voice from localStorage on mount', () => {
    localStorage.setItem('timerTool_voice_de', '1')
    render(<SettingsProvider><TestComponent /></SettingsProvider>)
    expect(screen.getByTestId('voiceIndex')).toHaveTextContent('1')
  })

  it('handles empty language selectedVoiceIndex gracefully during speak', () => {
    render(<SettingsProvider><TestComponent /></SettingsProvider>)
    fireEvent.click(screen.getByText('Speak'))
    expect(global.speechSynthesis.speak).toHaveBeenCalled()
    // It should fallback to correct lang based on current language
  })
})
