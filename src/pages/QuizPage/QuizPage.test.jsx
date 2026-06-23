import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import QuizPage from './QuizPage'

describe('QuizPage Component', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => cb())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders correctly', () => {
    render(<QuizPage />)
    expect(screen.getByText('German Time Quiz')).toBeInTheDocument()
    expect(screen.getByLabelText('Analog clock')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/e.g. halb drei/i)).toBeInTheDocument()
  })

  it('submits an answer and shows feedback', () => {
    render(<QuizPage />)
    
    const input = screen.getByPlaceholderText(/e.g. halb drei/i)
    fireEvent.change(input, { target: { value: 'wrong answer' } })
    
    const submitBtn = screen.getByRole('button', { name: /Enter/i })
    act(() => {
      fireEvent.click(submitBtn)
    })
    
    expect(screen.getByText(/Not yet/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Next question/i })).toBeInTheDocument()
  })

  it('can proceed to next question', () => {
    render(<QuizPage />)
    
    const input = screen.getByPlaceholderText(/e.g. halb drei/i)
    fireEvent.change(input, { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: /Enter/i }))
    
    const nextBtn = screen.getByRole('button', { name: /Next question/i })
    act(() => {
      fireEvent.click(nextBtn)
    })
    
    expect(screen.queryByText(/Not yet/i)).not.toBeInTheDocument()
    expect(input.value).toBe('')
  })

  it('resets progress', () => {
    render(<QuizPage />)
    const resetBtn = screen.getByRole('button', { name: /Reset progress/i })
    
    act(() => {
      fireEvent.click(resetBtn)
    })
    
    expect(screen.getByText('0%')).toBeInTheDocument() // Accuracy reset
  })
})
