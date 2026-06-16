import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SettingsDrawer from './SettingsDrawer'
import { useSettings } from '../../context/SettingsContext'

vi.mock('../../context/SettingsContext', () => ({
  useSettings: vi.fn()
}))

describe('SettingsDrawer Component', () => {
  beforeEach(() => {
    useSettings.mockReturnValue({
      language: 'en',
      setLanguage: vi.fn(),
      filteredVoices: [{ name: 'Test Voice', lang: 'en-US' }],
      selectedVoiceIndex: '0',
      setSelectedVoiceIndex: vi.fn()
    })
  })

  it('renders correctly when open', () => {
    render(<SettingsDrawer open={true} onClose={vi.fn()} />)
    expect(screen.getByRole('dialog')).toHaveClass('open')
    expect(screen.getByRole('combobox', { name: /Language/i })).toBeInTheDocument()
    expect(screen.getByText(/Test Voice/)).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<SettingsDrawer open={true} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /Close settings/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when overlay is clicked', () => {
    const onClose = vi.fn()
    const { container } = render(<SettingsDrawer open={true} onClose={onClose} />)
    const overlay = container.querySelector('#drawerOverlay')
    fireEvent.click(overlay)
    expect(onClose).toHaveBeenCalled()
  })

  it('changes language when language select changes', () => {
    const setLanguage = vi.fn()
    useSettings.mockReturnValue({
      language: 'en', setLanguage,
      filteredVoices: [], selectedVoiceIndex: '', setSelectedVoiceIndex: vi.fn()
    })
    
    render(<SettingsDrawer open={true} onClose={vi.fn()} />)
    const select = screen.getByLabelText(/Language \/ Sprache \/ Idioma/i)
    fireEvent.change(select, { target: { value: 'de' } })
    expect(setLanguage).toHaveBeenCalledWith('de')
  })

  it('changes voice when voice select changes', () => {
    const setSelectedVoiceIndex = vi.fn()
    useSettings.mockReturnValue({
      language: 'en', setLanguage: vi.fn(),
      filteredVoices: [{ name: 'Test Voice', lang: 'en-US' }],
      selectedVoiceIndex: '', setSelectedVoiceIndex
    })

    render(<SettingsDrawer open={true} onClose={vi.fn()} />)
    const select = screen.getByLabelText(/Select Voice/i)
    fireEvent.change(select, { target: { value: '0' } })
    expect(setSelectedVoiceIndex).toHaveBeenCalledWith('0')
  })
})
