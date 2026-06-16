import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SpeakerPage from './SpeakerPage';

describe('SpeakerPage Component', () => {
  beforeEach(() => {
    global.speechSynthesis = {
      getVoices: vi.fn(() => [
        { name: 'Test Voice 1', lang: 'de-DE' },
        { name: 'Test Voice 2', lang: 'en-US' }
      ]),
      speak: vi.fn(),
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      paused: false,
      speaking: false,
    };
    global.SpeechSynthesisUtterance = class SpeechSynthesisUtterance {
      constructor(text) { this.text = text; }
    }
  });

  it('renders correctly', () => {
    render(<SpeakerPage />);
    expect(screen.getByPlaceholderText(/Type something here/i)).toBeInTheDocument();
    expect(screen.getByText(/Language Configuration/i)).toBeInTheDocument();
    expect(screen.getByText(/Start Listening/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Play Text/i })).toBeInTheDocument();
  });

  it('can update text area value and clear it', () => {
    render(<SpeakerPage />);
    const textarea = screen.getByPlaceholderText(/Type something here/i);
    fireEvent.change(textarea, { target: { value: 'Hello world' } });
    expect(textarea.value).toBe('Hello world');
    
    const clearButton = screen.getByTitle(/Clear text/i);
    fireEvent.click(clearButton);
    expect(textarea.value).toBe('');
  });

  it('calls speechSynthesis.speak when play text is clicked', () => {
    render(<SpeakerPage />);
    const textarea = screen.getByPlaceholderText(/Type something here/i);
    fireEvent.change(textarea, { target: { value: 'Hallo Welt' } });
    
    const playBtn = screen.getByRole('button', { name: /Play Text/i });
    fireEvent.click(playBtn);
    
    expect(global.speechSynthesis.speak).toHaveBeenCalled();
  });

  it('controls speech synthesis (pause, resume, stop)', () => {
    render(<SpeakerPage />);
    
    global.speechSynthesis.speaking = true;
    
    const pauseBtn = screen.getByRole('button', { name: /Pause/i });
    fireEvent.click(pauseBtn);
    expect(global.speechSynthesis.pause).toHaveBeenCalled();
    
    global.speechSynthesis.paused = true;
    const resumeBtn = screen.getByRole('button', { name: /Resume/i });
    fireEvent.click(resumeBtn);
    expect(global.speechSynthesis.resume).toHaveBeenCalled();
    
    const stopBtn = screen.getByRole('button', { name: /Stop/i });
    fireEvent.click(stopBtn);
    expect(global.speechSynthesis.cancel).toHaveBeenCalled();
  });

  it('handles insert repeat symbol', () => {
    render(<SpeakerPage />);
    const textarea = screen.getByPlaceholderText(/Type something here/i);
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    
    // Simulate selection
    textarea.selectionStart = 5;
    textarea.selectionEnd = 5;
    
    const insertRepeat = screen.getByTitle(/Insert repeat symbol/i);
    fireEvent.click(insertRepeat);
    
    expect(textarea.value).toContain('↺');
  });

  it('handles language and voice selection', () => {
    render(<SpeakerPage />);
    
    const langSelect = screen.getByLabelText(/Language Configuration/i);
    fireEvent.change(langSelect, { target: { value: 'en' } });
    expect(langSelect.value).toBe('en');
    
    const voiceSelect = screen.getByLabelText(/Matched Output Voice/i);
    fireEvent.change(voiceSelect, { target: { value: 'Test Voice 2' } });
    expect(voiceSelect.value).toBe('Test Voice 2');
  });
});
