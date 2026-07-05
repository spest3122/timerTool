import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router'
import { SettingsProvider } from '../../context/SettingsContext'
import VocabPage from './VocabPage'

/* ── Mock speechSynthesis for every test ── */
beforeEach(() => {
  localStorage.clear()
  // Seed English as default so tests render EN content without extra setup.
  // SettingsContext reads 'timerTool_language'; VocabPage reads from there.
  localStorage.setItem('timerTool_language', 'en')
  vi.clearAllMocks()

  global.speechSynthesis = {
    cancel: vi.fn(),
    speak: vi.fn(),
    getVoices: vi.fn().mockReturnValue([]),
    onvoiceschanged: null,
  }
  global.SpeechSynthesisUtterance = class {
    constructor(text) {
      this.text = text
      this.lang = ''
      this.onend  = null
      this.onerror = null
    }
  }
})

/* ── Helper: render VocabPage inside MemoryRouter + SettingsProvider ── */
const renderPage = (initialEntries = ['/vocab']) =>
  render(
    <SettingsProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <VocabPage />
      </MemoryRouter>
    </SettingsProvider>
  )

/* ────────────────────────────────────────────────────────── */
describe('VocabPage — Control Bar', () => {
  it('renders the page title', () => {
    renderPage()
    expect(screen.getByText(/Vocab Trainer/i)).toBeInTheDocument()
  })

  it('renders all three language buttons', () => {
    renderPage()
    expect(screen.getByRole('button', { name: 'EN' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'DE' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ES' })).toBeInTheDocument()
  })

  it('defaults to EN language', () => {
    renderPage()
    expect(screen.getByRole('button', { name: 'EN' })).toHaveClass('active')
  })

  it('loads persisted language from localStorage', () => {
    // SettingsContext reads from 'timerTool_language'
    localStorage.setItem('timerTool_language', 'de')
    renderPage()
    expect(screen.getByRole('button', { name: 'DE' })).toHaveClass('active')
  })

  it('switches language when a language button is clicked', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'DE' }))
    expect(screen.getByRole('button', { name: 'DE' })).toHaveClass('active')
    expect(screen.getByRole('button', { name: 'EN' })).not.toHaveClass('active')
  })

  it('saves language choice to localStorage', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'ES' }))
    // SettingsContext persists to 'timerTool_language'
    expect(localStorage.getItem('timerTool_language')).toBe('es')
  })

  it('renders Focus and List view-toggle buttons', () => {
    renderPage()
    // Accessible names come from visible text content (SVG is aria-hidden)
    expect(screen.getByRole('button', { name: /Focus/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /List/i })).toBeInTheDocument()
  })

  it('defaults to Focus view', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /Focus/i })).toHaveClass('active')
  })
})

/* ────────────────────────────────────────────────────────── */
describe('VocabPage — Focus View', () => {
  it('renders the focus card section', () => {
    renderPage()
    expect(screen.getByRole('region', { name: /Vocabulary focus card/i })).toBeInTheDocument()
  })

  it('shows card counter "1 / 27"', () => {
    renderPage()
    expect(screen.getByText('1 / 27')).toBeInTheDocument()
  })

  it('displays the first word (Apple) in English by default', () => {
    renderPage()
    expect(screen.getByText('Apple')).toBeInTheDocument()
    expect(screen.getByText(/Apples/i)).toBeInTheDocument()
  })

  it('displays German translation after switching to DE', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /DE/i }))
    expect(screen.getByText('der Apfel')).toBeInTheDocument()
    expect(screen.getByText(/die Äpfel/i)).toBeInTheDocument()
  })

  it('displays Spanish translation after switching to ES', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'ES' }))
    expect(screen.getByText('la manzana')).toBeInTheDocument()
    expect(screen.getByText(/las manzanas/i)).toBeInTheDocument()
  })

  it('renders Prev and Next navigation buttons', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /Previous card/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Next card/i })).toBeInTheDocument()
  })

  it('advances to the next card when Next is clicked', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /Next card/i }))
    expect(screen.getByText('2 / 27')).toBeInTheDocument()
    expect(screen.getByText('Book')).toBeInTheDocument()
  })

  it('goes back to the previous card when Prev is clicked', () => {
    renderPage()
    // Go to card 2 first, then back to 1
    fireEvent.click(screen.getByRole('button', { name: /Next card/i }))
    fireEvent.click(screen.getByRole('button', { name: /Previous card/i }))
    expect(screen.getByText('1 / 27')).toBeInTheDocument()
    expect(screen.getByText('Apple')).toBeInTheDocument()
  })

  it('wraps around from last card to first when Next is clicked', () => {
    renderPage()
    // Click Next 27 times to loop around
    const nextBtn = screen.getByRole('button', { name: /Next card/i })
    for (let i = 0; i < 27; i++) fireEvent.click(nextBtn)
    expect(screen.getByText('1 / 27')).toBeInTheDocument()
  })

  it('wraps around from first card to last when Prev is clicked', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /Previous card/i }))
    expect(screen.getByText('27 / 27')).toBeInTheDocument()
  })

  it('renders dot indicators for all 27 cards', () => {
    renderPage()
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(27)
  })

  it('first dot is active by default', () => {
    renderPage()
    const tabs = screen.getAllByRole('tab')
    expect(tabs[0]).toHaveClass('active')
    expect(tabs[1]).not.toHaveClass('active')
  })

  it('jumping via dot indicator changes the active card', () => {
    renderPage()
    const tabs = screen.getAllByRole('tab')
    fireEvent.click(tabs[3]) // jump to card 4 (Cat)
    expect(screen.getByText('4 / 27')).toBeInTheDocument()
    expect(screen.getByText('Cat')).toBeInTheDocument()
  })

  it('renders the speaker button', () => {
    renderPage()
    // aria-label is "Pronounce Apple. Apples" — match on "Pronounce"
    expect(screen.getByRole('button', { name: /Pronounce/i })).toBeInTheDocument()
  })

  it('calls speechSynthesis.speak when speaker button is clicked', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /Pronounce/i }))
    expect(global.speechSynthesis.speak).toHaveBeenCalledTimes(1)
  })

  it('calls speechSynthesis.cancel before speaking', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /Pronounce/i }))
    expect(global.speechSynthesis.cancel).toHaveBeenCalled()
  })

  it('renders a progress bar', () => {
    renderPage()
    // progress fill width is set inline
    const fill = document.querySelector('.vocab-progress-fill')
    expect(fill).not.toBeNull()
  })

  it('saves the active card index to localStorage', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /Next card/i }))
    expect(localStorage.getItem('vocab_index')).toBe('1')
  })

  it('restores the active card index from localStorage', () => {
    localStorage.setItem('vocab_index', '2')
    renderPage()
    expect(screen.getByText('3 / 27')).toBeInTheDocument()
    expect(screen.getByText('Car')).toBeInTheDocument()
  })
})

/* ────────────────────────────────────────────────────────── */
describe('VocabPage — Overview View', () => {
  const switchToOverview = () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /List/i }))
  }

  it('switches to overview when List button is clicked', () => {
    switchToOverview()
    expect(screen.getByRole('region', { name: /Vocabulary overview grid/i })).toBeInTheDocument()
  })

  it('renders all 27 vocabulary items in the grid', () => {
    switchToOverview()
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(27)
  })

  it('displays item labels in the currently selected language', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'DE' }))
    fireEvent.click(screen.getByRole('button', { name: /List/i }))
    expect(screen.getByText('der Apfel')).toBeInTheDocument()
    expect(screen.getByText('das Buch')).toBeInTheDocument()
  })

  it('clicking an item switches to Focus view at that card', () => {
    switchToOverview()
    // Click the "Cat" item (index 3)
    fireEvent.click(screen.getByLabelText(/Cat — open focus card/i))
    // Should be back in Focus view showing Cat
    expect(screen.getByRole('region', { name: /Vocabulary focus card/i })).toBeInTheDocument()
    expect(screen.getByText('Cat')).toBeInTheDocument()
    expect(screen.getByText('4 / 27')).toBeInTheDocument()
  })

  it('keyboard Enter on an item opens the focus card', () => {
    switchToOverview()
    const catItem = screen.getByLabelText(/Cat — open focus card/i)
    fireEvent.keyDown(catItem, { key: 'Enter' })
    expect(screen.getByText('Cat')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: /Vocabulary focus card/i })).toBeInTheDocument()
  })

  it('keyboard Space on an item opens the focus card', () => {
    switchToOverview()
    const bookItem = screen.getByLabelText(/Book — open focus card/i)
    fireEvent.keyDown(bookItem, { key: ' ' })
    expect(screen.getByText('Book')).toBeInTheDocument()
  })

  it('active card item has an outline style in the grid', () => {
    localStorage.setItem('vocab_index', '1') // Book is active
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /List/i }))
    const bookItem = screen.getByLabelText(/Book — open focus card/i)
    expect(bookItem.style.outline).toContain('var(--vocab-accent)')
  })

  it('saves the Overview view choice to localStorage', () => {
    switchToOverview()
    expect(localStorage.getItem('vocab_view')).toBe('overview')
  })
})
