import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

  describe('Square 3 & 4: Recording Controls and Replay Library', () => {
    let mockMediaRecorderInstance;

    beforeEach(() => {
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-video-url');
      global.URL.revokeObjectURL = vi.fn();

      class MockMediaRecorder {
        constructor(stream) {
          this.stream = stream;
          this.state = 'inactive';
          this.ondataavailable = null;
          this.onstop = null;
          mockMediaRecorderInstance = this;
        }
        start() {
          this.state = 'recording';
        }
        pause() {
          this.state = 'paused';
        }
        resume() {
          this.state = 'recording';
        }
        stop() {
          this.state = 'inactive';
          if (this.ondataavailable) {
            this.ondataavailable({ data: new Blob(['video payload'], { type: 'video/webm' }) });
          }
          if (this.onstop) {
            this.onstop();
          }
        }
      }
      global.MediaRecorder = MockMediaRecorder;
    });

    it('disables Record button when camera is inactive and enables it when camera starts', async () => {
      render(<MirrorPage />);

      const recordBtn = screen.getByRole('button', { name: /^Record$/i });
      expect(recordBtn).toBeDisabled();
      expect(screen.getByText(/Enable camera to start recording/i)).toBeInTheDocument();

      const mockStream = {
        getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
      };
      Object.defineProperty(global.navigator, 'mediaDevices', {
        value: { getUserMedia: vi.fn().mockResolvedValue(mockStream) },
        configurable: true,
        writable: true,
      });

      fireEvent.click(screen.getByRole('button', { name: /Enable Camera/i }));

      await screen.findByTestId('mirror-video');
      expect(recordBtn).not.toBeDisabled();
    });

    it('records a take and displays it in the Replay Library', async () => {
      const mockStream = {
        getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
      };
      Object.defineProperty(global.navigator, 'mediaDevices', {
        value: { getUserMedia: vi.fn().mockResolvedValue(mockStream) },
        configurable: true,
        writable: true,
      });

      render(<MirrorPage />);

      fireEvent.click(screen.getByRole('button', { name: /Enable Camera/i }));
      await screen.findByTestId('mirror-video');

      const recordBtn = screen.getByRole('button', { name: /^Record$/i });
      fireEvent.click(recordBtn);

      // Status switches to recording
      expect(screen.getByText(/Recording Take/i)).toBeInTheDocument();
      const stopBtn = screen.getByRole('button', { name: /Stop/i });
      expect(stopBtn).toBeInTheDocument();

      // Stop recording
      fireEvent.click(stopBtn);

      // Take should appear in Square 4
      const takeItem = await screen.findByTestId(/take-item-/i);
      expect(takeItem).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Download Take/i })).toBeInTheDocument();

      // Delete take
      const deleteBtn = screen.getByRole('button', { name: /Delete Take/i });
      fireEvent.click(deleteBtn);

      await waitFor(() => {
        expect(screen.queryByTestId(/take-item-/i)).not.toBeInTheDocument();
      });
    });
  });
});
