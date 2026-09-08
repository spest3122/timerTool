import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { SettingsProvider } from './context/SettingsContext';
import { routes } from './routes';

describe('Application Routes', () => {
  it('redirects /convo to the home Timer page', () => {
    const router = createMemoryRouter(routes, {
      initialEntries: ['/convo'],
    });

    render(
      <SettingsProvider>
        <RouterProvider router={router} />
      </SettingsProvider>
    );

    expect(screen.getByLabelText('Analog clock')).toBeInTheDocument();
  });

  it('renders the Mirror page on /mirror', () => {
    const router = createMemoryRouter(routes, {
      initialEntries: ['/mirror'],
    });

    render(
      <SettingsProvider>
        <RouterProvider router={router} />
      </SettingsProvider>
    );

    expect(screen.getByTestId('mirror-page')).toBeInTheDocument();
  });
});
