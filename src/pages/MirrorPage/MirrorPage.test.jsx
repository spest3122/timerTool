import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsProvider } from '../../context/SettingsContext';
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

  describe('Square 1: Live Webcam Mirror', () => {
    it('shows Enable Camera button initially and starts stream on click', async () => {
      const mockStream = {
        getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
      };
      const mockGetUserMedia = vi.fn().mockResolvedValue(mockStream);
      Object.defineProperty(global.navigator, 'mediaDevices', {
        value: { getUserMedia: mockGetUserMedia },
        configurable: true,
        writable: true,
      });

      render(<MirrorPage />);

      const enableBtn = screen.getByRole('button', { name: /Enable Camera/i });
      expect(enableBtn).toBeInTheDocument();

      fireEvent.click(enableBtn);

      expect(mockGetUserMedia).toHaveBeenCalledWith({ video: true, audio: true });

      const videoElem = await screen.findByTestId('mirror-video');
      expect(videoElem).toBeInTheDocument();
      expect(videoElem).toHaveClass('mirror-video-flipped');
    });

    it('shows error notice and retry button when camera permission is denied', async () => {
      const mockGetUserMedia = vi.fn().mockRejectedValue(new Error('Permission denied'));
      Object.defineProperty(global.navigator, 'mediaDevices', {
        value: { getUserMedia: mockGetUserMedia },
        configurable: true,
        writable: true,
      });

      render(<MirrorPage />);

      fireEvent.click(screen.getByRole('button', { name: /Enable Camera/i }));

      const errorNotice = await screen.findByText(/Camera access blocked or unavailable/i);
      expect(errorNotice).toBeInTheDocument();

      const retryBtn = screen.getByRole('button', { name: /Retry/i });
      expect(retryBtn).toBeInTheDocument();
    });
  });

  describe('Square 2: Rehearsal Script & TTS', () => {
    let mockSpeak;

    beforeEach(() => {
      mockSpeak = vi.fn();
      global.speechSynthesis = {
        getVoices: vi.fn().mockReturnValue([]),
        speak: mockSpeak,
        onvoiceschanged: null,
      };
      global.SpeechSynthesisUtterance = class {
        constructor(text) { this.text = text; }
      };
    });

    it('restores saved script from localStorage and updates on typing', () => {
      localStorage.setItem('timerTool_mirror_script', 'Guten Tag, wie geht es Ihnen?');

      render(
        <SettingsProvider>
          <MirrorPage />
        </SettingsProvider>
      );

      const textarea = screen.getByPlaceholderText(/Type or paste phrases to rehearse/i);
      expect(textarea.value).toBe('Guten Tag, wie geht es Ihnen?');
      expect(screen.getByText(/6 words/i)).toBeInTheDocument();

      fireEvent.change(textarea, { target: { value: 'Ich lerne Deutsch.' } });
      expect(localStorage.getItem('timerTool_mirror_script')).toBe('Ich lerne Deutsch.');
      expect(screen.getByText(/3 words/i)).toBeInTheDocument();
    });

    it('reads current script text aloud when Listen button is clicked', () => {
      render(
        <SettingsProvider>
          <MirrorPage />
        </SettingsProvider>
      );

      const textarea = screen.getByPlaceholderText(/Type or paste phrases to rehearse/i);
      fireEvent.change(textarea, { target: { value: 'Hallo Welt' } });

      const listenBtn = screen.getByRole('button', { name: /Listen/i });
      fireEvent.click(listenBtn);

      expect(mockSpeak).toHaveBeenCalled();
      const utterance = mockSpeak.mock.calls[0][0];
      expect(utterance.text).toBe('Hallo Welt');
    });
  });
});
