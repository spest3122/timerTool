import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MirrorPage from './MirrorPage';

describe('MirrorPage Component', () => {
  it('renders the studio shell with four distinct quadrant sections', () => {
    render(<MirrorPage />);

    expect(screen.getByTestId('mirror-page')).toBeInTheDocument();
    expect(screen.getByText(/Mirror Studio/i)).toBeInTheDocument();

    // Check four quadrant containers
    expect(screen.getByTestId('quadrant-webcam')).toBeInTheDocument();
    expect(screen.getByTestId('quadrant-script')).toBeInTheDocument();
    expect(screen.getByTestId('quadrant-controls')).toBeInTheDocument();
    expect(screen.getByTestId('quadrant-replay')).toBeInTheDocument();

    // Check quadrant titles
    expect(screen.getByText(/1. Webcam Mirror/i)).toBeInTheDocument();
    expect(screen.getByText(/2. Rehearsal Script/i)).toBeInTheDocument();
    expect(screen.getByText(/3. Recording Console/i)).toBeInTheDocument();
    expect(screen.getByText(/4. Replay Library/i)).toBeInTheDocument();
  });
});
