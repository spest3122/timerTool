import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router';
import { SettingsProvider } from './context/SettingsContext';
import App from './App';

describe('App Component', () => {
  it('renders without crashing and displays settings button', () => {
    render(
      <SettingsProvider>
        <MemoryRouter>
          <App />
        </MemoryRouter>
      </SettingsProvider>
    );
    
    // Check for the settings toggle button
    expect(screen.getByRole('button', { name: /Open settings/i })).toBeInTheDocument();
  });
});
