import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router'
import BottomNav from './BottomNav'

describe('BottomNav Component', () => {
  it('renders navigation links without Convo', () => {
    render(
      <MemoryRouter>
        <BottomNav />
      </MemoryRouter>
    )

    expect(screen.getByLabelText(/Timer/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Speaker/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Vocab/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Recorder/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Mirror$/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/^Convo$/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/^Convo$/i)).not.toBeInTheDocument()
  })
})
