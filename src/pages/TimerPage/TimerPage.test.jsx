import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import TimerPage from './TimerPage'
import { useSettings } from '../../context/SettingsContext'

vi.mock('../../context/SettingsContext', () => ({
  useSettings: vi.fn()
}))

describe('TimerPage Component', () => {
  let mockSpeak

  beforeEach(() => {
    mockSpeak = vi.fn()
    useSettings.mockReturnValue({
      language: 'de',
      speak: mockSpeak
    })
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('renders correctly in practice mode by default', () => {
    render(<TimerPage />)
    expect(screen.getByText(/Modus: Übungsmodus/i)).toBeInTheDocument()
    expect(screen.getByText('WOCHENTAG')).toBeInTheDocument()
    expect(screen.getByLabelText('Analog clock')).toBeInTheDocument()
  })

  it('switches to live mode and updates time', () => {
    const mockDate = new Date(2026, 5, 16, 14, 30) // 14:30
    vi.setSystemTime(mockDate)
    
    render(<TimerPage />)
    const liveBtn = screen.getByRole('button', { name: /Live Clock/i })
    
    act(() => {
      fireEvent.click(liveBtn)
    })

    expect(screen.getByText(/Modus: Live-Uhr/i)).toBeInTheDocument()
    expect(screen.getByText('14:30')).toBeInTheDocument()
    // It should also speak the day
    expect(mockSpeak).toHaveBeenCalled()
  })

  it('switches back to practice mode', () => {
    render(<TimerPage />)
    const liveBtn = screen.getByRole('button', { name: /Live Clock/i })
    act(() => { fireEvent.click(liveBtn) })
    
    const practiceBtn = screen.getByRole('button', { name: /Practice Mode/i })
    act(() => { fireEvent.click(practiceBtn) })

    expect(screen.getByText(/Modus: Übungsmodus/i)).toBeInTheDocument()
  })

  it('navigates days in practice mode', () => {
    render(<TimerPage />)
    const nextBtn = screen.getByRole('button', { name: /Next day/i })
    const prevBtn = screen.getByRole('button', { name: /Previous day/i })
    
    act(() => { fireEvent.click(nextBtn) })
    expect(mockSpeak).toHaveBeenCalled()
    
    act(() => { fireEvent.click(prevBtn) })
    expect(mockSpeak).toHaveBeenCalledTimes(2)
  })

  it('speaks phrase when phrase button is clicked', () => {
    render(<TimerPage />)
    const speakButtons = screen.getAllByRole('button', { name: /🔊/i })
    expect(speakButtons.length).toBeGreaterThan(0)
    
    act(() => { fireEvent.click(speakButtons[0]) })
    expect(mockSpeak).toHaveBeenCalled()
  })

  it('speaks weekday when weekbox is clicked', () => {
    render(<TimerPage />)
    const weekBox = screen.getByTitle(/Click to hear the day name/i)
    
    act(() => { fireEvent.click(weekBox) })
    expect(mockSpeak).toHaveBeenCalled()
  })
})
