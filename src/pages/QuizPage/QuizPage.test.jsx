import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import QuizPage from './QuizPage'

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Get the answer input for a specific question by its label (Q1, Q11, etc.)
 * Each input has id="answer-{qId}"
 */
function getInput(qId) {
  return document.getElementById(`answer-${qId}`)
}

/**
 * Type into a question's input and click its Check button.
 * The Check button is the sibling button inside the same .fq-input-row.
 */
function checkAnswer(qId, value) {
  const input = getInput(qId)
  fireEvent.change(input, { target: { value } })

  // Find the Check button closest to this input
  const row = input.closest('.fq-input-row')
  const btn = within(row).getByRole('button', { name: /check/i })
  fireEvent.click(btn)
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('QuizPage', () => {

  // ── Group 1: Rendering ────────────────────────────────────────────────────

  describe('Group 1 — Rendering', () => {
    beforeEach(() => render(<QuizPage />))

    it('renders the page title', () => {
      expect(
        screen.getByRole('heading', { name: /multi-language fill-in-the-blank quiz/i })
      ).toBeInTheDocument()
    })

    it('renders all 3 language section tabs', () => {
      expect(screen.getByRole('tab', { name: /german/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /english/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /spanish/i })).toBeInTheDocument()
    })

    it('shows the German section by default (Q1 input visible)', () => {
      expect(screen.getByText('Q1', { exact: true })).toBeInTheDocument()
      expect(getInput(1)).toBeInTheDocument()
    })

    it('renders the Reset All button', () => {
      expect(screen.getByRole('button', { name: /reset all/i })).toBeInTheDocument()
    })

    it('renders the Answer Key toggle button', () => {
      expect(screen.getByRole('button', { name: /complete answer key/i })).toBeInTheDocument()
    })

    it('shows initial progress as 0 / 30', () => {
      expect(screen.getByText(/0 \/ 30 answered/i)).toBeInTheDocument()
    })
  })

  // ── Group 2: Tab Navigation ───────────────────────────────────────────────

  describe('Group 2 — Tab Navigation', () => {
    beforeEach(() => render(<QuizPage />))

    it('clicking the English tab shows Q11', () => {
      fireEvent.click(screen.getByRole('tab', { name: /english/i }))
      expect(screen.getByText('Q11', { exact: true })).toBeInTheDocument()
      expect(getInput(11)).toBeInTheDocument()
    })

    it('clicking the Spanish tab shows Q21', () => {
      fireEvent.click(screen.getByRole('tab', { name: /spanish/i }))
      expect(screen.getByText('Q21', { exact: true })).toBeInTheDocument()
      expect(getInput(21)).toBeInTheDocument()
    })

    it('switching from English back to German shows Q1 again', () => {
      fireEvent.click(screen.getByRole('tab', { name: /english/i }))
      fireEvent.click(screen.getByRole('tab', { name: /german/i }))
      expect(screen.getByText('Q1', { exact: true })).toBeInTheDocument()
      expect(getInput(1)).toBeInTheDocument()
    })

    it('switching tabs hides the other section\'s questions', () => {
      fireEvent.click(screen.getByRole('tab', { name: /english/i }))
      // Q1 input should no longer be in the DOM
      expect(getInput(1)).not.toBeInTheDocument()
    })
  })

  // ── Group 3: Correct Answer ───────────────────────────────────────────────

  describe('Group 3 — Answering Correctly (Q1: "auf")', () => {
    beforeEach(() => {
      render(<QuizPage />)
      checkAnswer(1, 'auf')
    })

    it('shows a ✓ Correct verdict badge', () => {
      expect(screen.getByText(/✓ Correct/i)).toBeInTheDocument()
    })

    it('applies input-correct class to the input', () => {
      expect(getInput(1)).toHaveClass('input-correct')
    })

    it('renders the explanation text', () => {
      expect(screen.getByText(/"Auf" is a two-way preposition/i)).toBeInTheDocument()
    })

    it('does NOT show the "Correct answer:" line for a correct submission', () => {
      expect(screen.queryByText(/✦ Correct answer:/i)).not.toBeInTheDocument()
    })
  })

  // ── Group 4: Incorrect Answer ─────────────────────────────────────────────

  describe('Group 4 — Answering Incorrectly (Q1: wrong input)', () => {
    beforeEach(() => {
      render(<QuizPage />)
      checkAnswer(1, 'unter')
    })

    it('shows a ✗ Incorrect verdict badge', () => {
      expect(screen.getByText(/✗ Incorrect/i)).toBeInTheDocument()
    })

    it('applies input-wrong class to the input', () => {
      expect(getInput(1)).toHaveClass('input-wrong')
    })

    it('shows the "Correct answer:" line with the right answer', () => {
      expect(screen.getByText(/✦ Correct answer:/i)).toBeInTheDocument()
      // The answer "auf" should be rendered as a <strong> near that line
      expect(screen.getByText('auf')).toBeInTheDocument()
    })

    it('renders the explanation text', () => {
      expect(screen.getByText(/"Auf" is a two-way preposition/i)).toBeInTheDocument()
    })
  })

  // ── Group 5: Case Insensitivity ───────────────────────────────────────────

  describe('Group 5 — Case and whitespace normalisation', () => {
    beforeEach(() => render(<QuizPage />))

    it('accepts the correct answer in uppercase (AUF → auf)', () => {
      checkAnswer(1, 'AUF')
      expect(screen.getByText(/✓ Correct/i)).toBeInTheDocument()
    })

    it('accepts the correct answer with leading/trailing spaces', () => {
      checkAnswer(1, '  auf  ')
      expect(screen.getByText(/✓ Correct/i)).toBeInTheDocument()
    })
  })

  // ── Group 6: Enter Key Submission ─────────────────────────────────────────

  describe('Group 6 — Enter key triggers the check', () => {
    it('pressing Enter submits the answer (correct)', () => {
      render(<QuizPage />)
      const input = getInput(1)
      fireEvent.change(input, { target: { value: 'auf' } })
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
      expect(screen.getByText(/✓ Correct/i)).toBeInTheDocument()
    })

    it('pressing Enter submits the answer (incorrect)', () => {
      render(<QuizPage />)
      const input = getInput(1)
      fireEvent.change(input, { target: { value: 'in' } })
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
      expect(screen.getByText(/✗ Incorrect/i)).toBeInTheDocument()
    })
  })

  // ── Group 7: Progress Tracking ────────────────────────────────────────────

  describe('Group 7 — Progress tracking', () => {
    beforeEach(() => render(<QuizPage />))

    it('increments answered count after checking Q1', () => {
      checkAnswer(1, 'auf')
      expect(screen.getByText(/1 \/ 30 answered/i)).toBeInTheDocument()
    })

    it('shows "✓ 1 correct" after a correct answer', () => {
      checkAnswer(1, 'auf')
      expect(screen.getByText(/✓ 1 correct/i)).toBeInTheDocument()
    })

    it('shows "✗ 1 incorrect" after a wrong answer', () => {
      checkAnswer(1, 'unter')
      expect(screen.getByText(/✗ 1 incorrect/i)).toBeInTheDocument()
    })

    it('counts across tabs — checking Q1 and Q11 gives 2 / 30', () => {
      checkAnswer(1, 'auf')
      fireEvent.click(screen.getByRole('tab', { name: /english/i }))
      checkAnswer(11, 'put off')
      expect(screen.getByText(/2 \/ 30 answered/i)).toBeInTheDocument()
    })

    it('tab score badge appears after the first answer in that section', () => {
      checkAnswer(1, 'auf')
      // German tab should now show a badge (e.g. "1/10")
      const germanTab = screen.getByRole('tab', { name: /german/i })
      expect(within(germanTab).getByText(/1\/10/)).toBeInTheDocument()
    })
  })

  // ── Group 8: Reset ────────────────────────────────────────────────────────

  describe('Group 8 — Reset All', () => {
    it('clears answers and resets progress to 0 / 30', () => {
      render(<QuizPage />)

      // Answer a question first
      checkAnswer(1, 'auf')
      expect(screen.getByText(/1 \/ 30 answered/i)).toBeInTheDocument()

      // Reset
      fireEvent.click(screen.getByRole('button', { name: /reset all/i }))

      expect(screen.getByText(/0 \/ 30 answered/i)).toBeInTheDocument()
    })

    it('removes feedback and verdict badges after reset', () => {
      render(<QuizPage />)

      checkAnswer(1, 'auf')
      expect(screen.getByText(/✓ Correct/i)).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: /reset all/i }))

      expect(screen.queryByText(/✓ Correct/i)).not.toBeInTheDocument()
    })

    it('clears the input value after reset', () => {
      render(<QuizPage />)

      const input = getInput(1)
      fireEvent.change(input, { target: { value: 'auf' } })
      fireEvent.click(screen.getByRole('button', { name: /reset all/i }))

      expect(getInput(1).value).toBe('')
    })
  })

  // ── Group 9: Answer Key ───────────────────────────────────────────────────

  describe('Group 9 — Answer Key panel', () => {
    beforeEach(() => render(<QuizPage />))

    it('Answer Key body is hidden by default', () => {
      // The .fq-ak-body element should not be in the DOM until opened
      expect(document.querySelector('.fq-ak-body')).not.toBeInTheDocument()
    })

    it('clicking the toggle opens the Answer Key and shows all 30 answers', () => {
      fireEvent.click(screen.getByRole('button', { name: /complete answer key/i }))

      const body = document.querySelector('.fq-ak-body')
      expect(body).toBeInTheDocument()

      // Spot-check a few answers from different sections
      // Q1 and Q2 both have 'auf', so use getAllByText
      expect(within(body).getAllByText('auf').length).toBeGreaterThanOrEqual(1)  // Q1+Q2 German
      expect(within(body).getByText('put off')).toBeInTheDocument()              // Q11 English
      expect(within(body).getAllByText('para').length).toBeGreaterThanOrEqual(1) // Q21+Q29 Spanish
    })

    it('clicking the toggle again closes the Answer Key', () => {
      const toggleBtn = screen.getByRole('button', { name: /complete answer key/i })
      fireEvent.click(toggleBtn) // open
      fireEvent.click(toggleBtn) // close
      expect(document.querySelector('.fq-ak-body')).not.toBeInTheDocument()
    })

    it('shows all 3 section headings inside the Answer Key', () => {
      fireEvent.click(screen.getByRole('button', { name: /complete answer key/i }))
      const body = document.querySelector('.fq-ak-body')
      expect(within(body).getByText(/german section/i)).toBeInTheDocument()
      expect(within(body).getByText(/english section/i)).toBeInTheDocument()
      expect(within(body).getByText(/spanish section/i)).toBeInTheDocument()
    })
  })

})
