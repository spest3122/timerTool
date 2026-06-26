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
    const { container } = render(<TimerPage />)
    const nextBtn = container.querySelector('#weekNextBtn')
    const prevBtn = container.querySelector('#weekPrevBtn')
    
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

  // ── Date & Season panel tests ──────────────────────────────────────────────

  it('renders Date & Season panel correctly', () => {
    render(<TimerPage />)
    expect(screen.getByLabelText('Date and season controls')).toBeInTheDocument()
    expect(screen.getByLabelText('Multilingual translations')).toBeInTheDocument()
  })

  it('shows only active language translation row for Date & Season', () => {
    // When language is German ('de')
    const { rerender } = render(<TimerPage />)
    expect(screen.getByText('German')).toBeInTheDocument()
    expect(screen.queryByText('Spanish')).not.toBeInTheDocument()
    expect(screen.queryByText('English')).not.toBeInTheDocument()

    // Rerender as Spanish ('es')
    useSettings.mockReturnValue({
      language: 'es',
      speak: mockSpeak
    })
    rerender(<TimerPage />)
    expect(screen.getByText('Spanish')).toBeInTheDocument()
    expect(screen.queryByText('German')).not.toBeInTheDocument()
    expect(screen.queryByText('English')).not.toBeInTheDocument()
  })

  it('navigates Date & Season panel selectors', () => {
    const { container } = render(<TimerPage />)

    // Verify initial values (mocked date is today, let's just trigger selection clicks)
    const nextDayBtn = container.querySelector('#ds-day-next')
    const prevDayBtn = container.querySelector('#ds-day-prev')
    const dayInput = container.querySelector('#ds-day-input')
    const initialDay = dayInput.value

    act(() => {
      fireEvent.click(nextDayBtn)
    })
    // Value should change
    expect(dayInput.value).not.toBe(initialDay)

    act(() => {
      fireEvent.click(prevDayBtn)
    })
    expect(dayInput.value).toBe(initialDay)
  })
})
