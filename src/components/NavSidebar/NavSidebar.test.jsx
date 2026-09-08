import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router'
import NavSidebar from './NavSidebar'

describe('NavSidebar Component', () => {
  it('renders navigation links', () => {
    render(
      <MemoryRouter>
        <NavSidebar />
      </MemoryRouter>
    )

    expect(screen.getByLabelText(/Timer/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/German Quiz/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Speaker practice/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Vocabulary trainer/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Voice recorder/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/Language conversation/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Convo/i)).not.toBeInTheDocument()
  })

  it('highlights the active link', () => {
    render(
      <MemoryRouter initialEntries={['/quiz']}>
        <NavSidebar />
      </MemoryRouter>
    )

    const quizLink = screen.getByLabelText(/German Quiz/i)
    expect(quizLink).toHaveClass('active')
    
    const timerLink = screen.getByLabelText(/Timer/i)
    expect(timerLink).not.toHaveClass('active')
  })
})
