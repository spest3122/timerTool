import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import DateSeasonPage from './DateSeasonPage'

// ── Mock CSS (no-op in test env) ─────────────────────────────────────────────
vi.mock('./DateSeasonPage.css', () => ({}))

// ── Mock SettingsContext (DateSeasonPage imports but never calls useSettings) ─
vi.mock('../../context/SettingsContext', () => ({
  useSettings: vi.fn(() => ({ language: 'de', speak: vi.fn() })),
}))

// ── Speech Synthesis stub ─────────────────────────────────────────────────────
let mockSpeak
let mockCancel
let mockGetVoices
let lastUtt // last SpeechSynthesisUtterance instance created

beforeEach(() => {
  mockSpeak    = vi.fn()
  mockCancel   = vi.fn()
  mockGetVoices = vi.fn(() => [])
  lastUtt      = null

  // Stub SpeechSynthesisUtterance so jsdom doesn't throw
  class FakeUtterance {
    constructor(text) {
      this.text  = text
      this.lang  = ''
      this.rate  = 1
      this.voice = null
      this.onstart = null
      this.onend   = null
      this.onerror = null
      lastUtt = this
    }
  }
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)

  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: {
      speak:     mockSpeak,
      cancel:    mockCancel,
      getVoices: mockGetVoices,
    },
  })

  localStorage.clear()
})

afterEach(() => {
  vi.clearAllMocks()
})

// ─────────────────────────────────────────────────────────────────────────────
// Helper: render the page
// ─────────────────────────────────────────────────────────────────────────────
function renderPage() {
  return render(<DateSeasonPage />)
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Rendering
// ─────────────────────────────────────────────────────────────────────────────
describe('DateSeasonPage – rendering', () => {
  it('renders the page title', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Date & Season Trainer')
  })

  it('renders all four control group labels', () => {
    renderPage()
    expect(screen.getByText('Day')).toBeInTheDocument()
    expect(screen.getByText('Month')).toBeInTheDocument()
    expect(screen.getByText('Year')).toBeInTheDocument()
    expect(screen.getByText('Season')).toBeInTheDocument()
  })

  it('renders prev/next arrow buttons for each control group', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /Previous Day/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Next Day/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Previous Month/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Next Month/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Previous Year/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Next Year/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Previous Season/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Next Season/i })).toBeInTheDocument()
  })

  it('renders text inputs for each control group', () => {
    renderPage()
    expect(screen.getByLabelText(/Type Day/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Type Month/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Type Year/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Type Season/i)).toBeInTheDocument()
  })

  it('does NOT render any dropdown/select elements', () => {
    renderPage()
    expect(document.querySelectorAll('select').length).toBe(0)
  })

  it('renders the three language rows', () => {
    renderPage()
    expect(screen.getByText('Spanish')).toBeInTheDocument()
    expect(screen.getByText('German')).toBeInTheDocument()
    expect(screen.getByText('English')).toBeInTheDocument()
  })

  it('renders six Play Audio buttons (date + season × 3 languages)', () => {
    renderPage()
    const audioBtns = screen.getAllByRole('button', { name: /Play pronunciation/i })
    expect(audioBtns).toHaveLength(6)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. Default values (June 24, 2026 — Spring)
// ─────────────────────────────────────────────────────────────────────────────
describe('DateSeasonPage – default state', () => {
  it('shows day 24 in the Day input', () => {
    renderPage()
    expect(screen.getByLabelText(/Type Day/i)).toHaveValue('24')
  })

  it('shows June in the Month input', () => {
    renderPage()
    expect(screen.getByLabelText(/Type Month/i)).toHaveValue('June')
  })

  it('shows 2026 in the Year input', () => {
    renderPage()
    expect(screen.getByLabelText(/Type Year/i)).toHaveValue('2026')
  })

  it('shows Spring in the Season input', () => {
    renderPage()
    expect(screen.getByLabelText(/Type Season/i)).toHaveValue('Spring')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. Translations displayed
// ─────────────────────────────────────────────────────────────────────────────
describe('DateSeasonPage – translation display', () => {
  it('shows correct English date phrase', () => {
    renderPage()
    // Day 24 → "the 24th of June, 2026"
    expect(screen.getByText(/the 24th of June, 2026/i)).toBeInTheDocument()
  })

  it('shows correct Spanish date phrase', () => {
    renderPage()
    expect(screen.getByText(/el 24 de junio de 2026/i)).toBeInTheDocument()
  })

  it('shows correct German date phrase with ordinal word', () => {
    renderPage()
    // Day 24 → "der vierundzwanzigsten Juni 2026"
    expect(screen.getByText(/der vierundzwanzigsten Juni 2026/i)).toBeInTheDocument()
  })

  it('shows correct English season phrase', () => {
    renderPage()
    expect(screen.getByText(/It is spring/i)).toBeInTheDocument()
  })

  it('shows correct Spanish season phrase', () => {
    renderPage()
    expect(screen.getByText(/Es primavera/i)).toBeInTheDocument()
  })

  it('shows correct German season phrase', () => {
    renderPage()
    expect(screen.getByText(/Es ist Frühling/i)).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. Arrow navigation – Day
// ─────────────────────────────────────────────────────────────────────────────
describe('DateSeasonPage – Day arrow navigation', () => {
  it('increments day when Next Day is clicked', () => {
    renderPage()
    const nextBtn = screen.getByRole('button', { name: /Next Day/i })
    act(() => { fireEvent.click(nextBtn) })
    expect(screen.getByLabelText(/Type Day/i)).toHaveValue('25')
    expect(screen.getByText(/the 25th of June, 2026/i)).toBeInTheDocument()
  })

  it('decrements day when Previous Day is clicked', () => {
    renderPage()
    const prevBtn = screen.getByRole('button', { name: /Previous Day/i })
    act(() => { fireEvent.click(prevBtn) })
    expect(screen.getByLabelText(/Type Day/i)).toHaveValue('23')
  })

  it('wraps day from 1 back to 31', () => {
    renderPage()
    // Navigate to day 1 first (24 prev clicks)
    const prevBtn = screen.getByRole('button', { name: /Previous Day/i })
    for (let i = 0; i < 24; i++) {
      act(() => { fireEvent.click(prevBtn) })
    }
    expect(screen.getByLabelText(/Type Day/i)).toHaveValue('31') // wraps 1 → 31? no, 24 - 24 = 0 → wraps to 31
  })

  it('wraps day from 31 forward to 1', () => {
    renderPage()
    // Navigate to day 31 first (31 - 24 = 7 next clicks)
    const nextBtn = screen.getByRole('button', { name: /Next Day/i })
    for (let i = 0; i < 7; i++) {
      act(() => { fireEvent.click(nextBtn) })
    }
    expect(screen.getByLabelText(/Type Day/i)).toHaveValue('31')
    act(() => { fireEvent.click(nextBtn) })
    expect(screen.getByLabelText(/Type Day/i)).toHaveValue('1')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 5. Arrow navigation – Month
// ─────────────────────────────────────────────────────────────────────────────
describe('DateSeasonPage – Month arrow navigation', () => {
  it('increments month from June to July', () => {
    renderPage()
    const nextBtn = screen.getByRole('button', { name: /Next Month/i })
    act(() => { fireEvent.click(nextBtn) })
    expect(screen.getByLabelText(/Type Month/i)).toHaveValue('July')
    expect(screen.getByText(/the 24th of July, 2026/i)).toBeInTheDocument()
  })

  it('decrements month from June to May', () => {
    renderPage()
    const prevBtn = screen.getByRole('button', { name: /Previous Month/i })
    act(() => { fireEvent.click(prevBtn) })
    expect(screen.getByLabelText(/Type Month/i)).toHaveValue('May')
  })

  it('wraps month from December forward to January', () => {
    renderPage()
    const nextBtn = screen.getByRole('button', { name: /Next Month/i })
    // June (5) → need 6 clicks to reach December (11)
    for (let i = 0; i < 6; i++) {
      act(() => { fireEvent.click(nextBtn) })
    }
    expect(screen.getByLabelText(/Type Month/i)).toHaveValue('December')
    act(() => { fireEvent.click(nextBtn) })
    expect(screen.getByLabelText(/Type Month/i)).toHaveValue('January')
  })

  it('wraps month from January back to December', () => {
    renderPage()
    const prevBtn = screen.getByRole('button', { name: /Previous Month/i })
    // June is index 5 → 5 prev clicks lands on January (index 0)
    for (let i = 0; i < 5; i++) {
      act(() => { fireEvent.click(prevBtn) })
    }
    expect(screen.getByLabelText(/Type Month/i)).toHaveValue('January')
    act(() => { fireEvent.click(prevBtn) })
    expect(screen.getByLabelText(/Type Month/i)).toHaveValue('December')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 6. Arrow navigation – Season
// ─────────────────────────────────────────────────────────────────────────────
describe('DateSeasonPage – Season arrow navigation', () => {
  it('cycles seasons forward: Spring → Summer → Autumn → Winter → Spring', () => {
    renderPage()
    const nextBtn = screen.getByRole('button', { name: /Next Season/i })

    act(() => { fireEvent.click(nextBtn) })
    expect(screen.getByLabelText(/Type Season/i)).toHaveValue('Summer')
    expect(screen.getByText(/Es verano/i)).toBeInTheDocument()

    act(() => { fireEvent.click(nextBtn) })
    expect(screen.getByLabelText(/Type Season/i)).toHaveValue('Autumn')
    expect(screen.getByText(/Es ist Herbst/i)).toBeInTheDocument()

    act(() => { fireEvent.click(nextBtn) })
    expect(screen.getByLabelText(/Type Season/i)).toHaveValue('Winter')
    expect(screen.getByText(/Es ist Winter/i)).toBeInTheDocument()

    act(() => { fireEvent.click(nextBtn) })
    expect(screen.getByLabelText(/Type Season/i)).toHaveValue('Spring')
  })

  it('cycles seasons backward from Spring to Winter', () => {
    renderPage()
    const prevBtn = screen.getByRole('button', { name: /Previous Season/i })
    act(() => { fireEvent.click(prevBtn) })
    expect(screen.getByLabelText(/Type Season/i)).toHaveValue('Winter')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 7. Text input – commit on blur
// ─────────────────────────────────────────────────────────────────────────────
describe('DateSeasonPage – text input commit', () => {
  it('accepts an exact month name and updates the translation', async () => {
    renderPage()
    const monthInput = screen.getByLabelText(/Type Month/i)

    fireEvent.change(monthInput, { target: { value: 'March' } })
    fireEvent.blur(monthInput)

    await waitFor(() => {
      expect(monthInput).toHaveValue('March')
      expect(screen.getByText(/the 24th of March, 2026/i)).toBeInTheDocument()
    })
  })

  it('accepts a case-insensitive month name', async () => {
    renderPage()
    const monthInput = screen.getByLabelText(/Type Month/i)

    fireEvent.change(monthInput, { target: { value: 'march' } })
    fireEvent.blur(monthInput)

    await waitFor(() => {
      expect(monthInput).toHaveValue('March')
    })
  })

  it('accepts a month prefix (e.g. "sep" → September)', async () => {
    renderPage()
    const monthInput = screen.getByLabelText(/Type Month/i)

    fireEvent.change(monthInput, { target: { value: 'sep' } })
    fireEvent.blur(monthInput)

    await waitFor(() => {
      expect(monthInput).toHaveValue('September')
      expect(screen.getByText(/el 24 de septiembre de 2026/i)).toBeInTheDocument()
    })
  })

  it('accepts a numeric day', async () => {
    renderPage()
    const dayInput = screen.getByLabelText(/Type Day/i)

    fireEvent.change(dayInput, { target: { value: '7' } })
    fireEvent.blur(dayInput)

    await waitFor(() => {
      expect(dayInput).toHaveValue('7')
      expect(screen.getByText(/the 7th of June, 2026/i)).toBeInTheDocument()
    })
  })

  it('accepts a numeric year', async () => {
    renderPage()
    const yearInput = screen.getByLabelText(/Type Year/i)

    fireEvent.change(yearInput, { target: { value: '2000' } })
    fireEvent.blur(yearInput)

    await waitFor(() => {
      expect(yearInput).toHaveValue('2000')
      expect(screen.getByText(/the 24th of June, 2000/i)).toBeInTheDocument()
    })
  })

  it('resets to current value on unrecognised input', async () => {
    renderPage()
    const monthInput = screen.getByLabelText(/Type Month/i)

    fireEvent.change(monthInput, { target: { value: 'NotAMonth' } })
    fireEvent.blur(monthInput)

    await waitFor(() => {
      expect(monthInput).toHaveValue('June')
    })
  })

  it('commits on Enter key', async () => {
    renderPage()
    const monthInput = screen.getByLabelText(/Type Month/i)

    fireEvent.change(monthInput, { target: { value: 'October' } })
    fireEvent.keyDown(monthInput, { key: 'Enter' })

    await waitFor(() => {
      expect(monthInput).toHaveValue('October')
    })
  })

  it('ArrowRight key on input increments the value', async () => {
    renderPage()
    const monthInput = screen.getByLabelText(/Type Month/i)

    fireEvent.keyDown(monthInput, { key: 'ArrowRight' })

    await waitFor(() => {
      expect(monthInput).toHaveValue('July')
    })
  })

  it('ArrowLeft key on input decrements the value', async () => {
    renderPage()
    const monthInput = screen.getByLabelText(/Type Month/i)

    fireEvent.keyDown(monthInput, { key: 'ArrowLeft' })

    await waitFor(() => {
      expect(monthInput).toHaveValue('May')
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 8. German ordinal day words
// ─────────────────────────────────────────────────────────────────────────────
describe('DateSeasonPage – German ordinal day words', () => {
  const cases = [
    { day: '1',  expected: 'der ersten' },
    { day: '2',  expected: 'der zweiten' },
    { day: '3',  expected: 'der dritten' },
    { day: '7',  expected: 'der siebten' },
    { day: '11', expected: 'der elften' },
    { day: '20', expected: 'der zwanzigsten' },
    { day: '21', expected: 'der einundzwanzigsten' },
    { day: '31', expected: 'der einunddreißigsten' },
  ]

  cases.forEach(({ day, expected }) => {
    it(`day ${day} renders German ordinal "${expected}"`, async () => {
      renderPage()
      const dayInput = screen.getByLabelText(/Type Day/i)
      fireEvent.change(dayInput, { target: { value: day } })
      fireEvent.blur(dayInput)

      await waitFor(() => {
        const deRow = document.getElementById('ds-row-de')
        expect(deRow).not.toBeNull()
        expect(deRow.textContent).toMatch(new RegExp(expected))
      })
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 9. Audio – Play button calls speechSynthesis.speak
// ─────────────────────────────────────────────────────────────────────────────
describe('DateSeasonPage – audio playback', () => {
  it('calls speechSynthesis.speak when a Play button is clicked', () => {
    renderPage()
    const audioBtns = screen.getAllByRole('button', { name: /Play pronunciation/i })

    act(() => { fireEvent.click(audioBtns[0]) })

    expect(mockCancel).toHaveBeenCalled()
    expect(mockSpeak).toHaveBeenCalledTimes(1)
  })

  it('calls speechSynthesis.cancel before each new utterance', () => {
    renderPage()
    const audioBtns = screen.getAllByRole('button', { name: /Play pronunciation/i })

    act(() => { fireEvent.click(audioBtns[0]) })
    act(() => { fireEvent.click(audioBtns[1]) })

    expect(mockCancel).toHaveBeenCalledTimes(2)
    expect(mockSpeak).toHaveBeenCalledTimes(2)
  })

  it('uses saved voice from localStorage when available', () => {
    // Provide a fake German voice
    const fakeDeVoice = { lang: 'de-DE', name: 'Anna' }
    mockGetVoices.mockReturnValue([fakeDeVoice])
    localStorage.setItem('timerTool_voice_de', '0')

    renderPage()
    // The German date button is index 2 (ES date, ES season, DE date …)
    const audioBtns = screen.getAllByRole('button', { name: /Play pronunciation/i })
    act(() => { fireEvent.click(audioBtns[2]) }) // DE date button

    expect(mockSpeak).toHaveBeenCalledTimes(1)
    expect(lastUtt.voice).toBe(fakeDeVoice)
    expect(lastUtt.lang).toBe('de-DE')
  })

  it('falls back to locale string when no voices are available', () => {
    mockGetVoices.mockReturnValue([])
    renderPage()

    const audioBtns = screen.getAllByRole('button', { name: /Play pronunciation/i })
    act(() => { fireEvent.click(audioBtns[2]) }) // DE date button

    expect(lastUtt.lang).toBe('de-DE')
  })

  it('sets speech rate to 0.92', () => {
    renderPage()
    const audioBtns = screen.getAllByRole('button', { name: /Play pronunciation/i })
    act(() => { fireEvent.click(audioBtns[0]) })

    expect(lastUtt.rate).toBeCloseTo(0.92)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 10. Accessibility
// ─────────────────────────────────────────────────────────────────────────────
describe('DateSeasonPage – accessibility', () => {
  it('has a top-level <main> landmark with an accessible label', () => {
    renderPage()
    expect(
      screen.getByRole('main', { name: /Date and Season Pronunciation Trainer/i })
    ).toBeInTheDocument()
  })

  it('each control group is a group with a labelled-by reference', () => {
    renderPage()
    const groups = screen.getAllByRole('group')
    expect(groups.length).toBeGreaterThanOrEqual(4)
    groups.forEach(g => {
      expect(g).toHaveAttribute('aria-labelledby')
    })
  })

  it('each audio button has an aria-label', () => {
    renderPage()
    const btns = screen.getAllByRole('button', { name: /Play pronunciation/i })
    btns.forEach(btn => {
      expect(btn).toHaveAttribute('aria-label')
    })
  })
})
