import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SettingsProvider } from '../../context/SettingsContext';
import SpeakerPage from './SpeakerPage';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Render SpeakerPage inside the required SettingsProvider. */
function renderSpeakerPage() {
  return render(
    <SettingsProvider>
      <SpeakerPage />
    </SettingsProvider>
  );
}

/** Build a minimal SpeechRecognition mock that stores the instance so tests
 *  can trigger onresult / onend manually. */
function makeSRMock() {
  let instance;
  const SR = vi.fn(function () {
    instance = this;
    this.start  = vi.fn();
    this.stop   = vi.fn(() => { if (this.onend) this.onend(); });
    this.onresult = null;
    this.onend    = null;
    this.onerror  = null;
  });
  SR.getInstance = () => instance;
  return SR;
}

// ── Global browser API mocks ──────────────────────────────────────────────────

beforeEach(() => {
  // speechSynthesis
  global.speechSynthesis = {
    getVoices : vi.fn(() => [
      { name: 'Test Voice 1', lang: 'de-DE' },
      { name: 'Test Voice 2', lang: 'en-US' },
    ]),
    speak   : vi.fn(),
    cancel  : vi.fn(),
    pause   : vi.fn(),
    resume  : vi.fn(),
    paused  : false,
    speaking: false,
  };
  global.SpeechSynthesisUtterance = class SpeechSynthesisUtterance {
    constructor(text) { this.text = text; }
  };
  // Default: no SpeechRecognition (some tests override this)
  delete global.SpeechRecognition;
  delete global.webkitSpeechRecognition;
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Existing feature tests (updated selectors) ────────────────────────────────

describe('SpeakerPage – existing features', () => {
  it('renders the textarea, listen button and play button', () => {
    renderSpeakerPage();
    expect(screen.getByPlaceholderText(/Type something here/i)).toBeInTheDocument();
    expect(screen.getByText(/Start Listening/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Play Text/i })).toBeInTheDocument();
  });

  it('updates textarea value and clears it', () => {
    renderSpeakerPage();
    const textarea = screen.getByPlaceholderText(/Type something here/i);
    fireEvent.change(textarea, { target: { value: 'Hello world' } });
    expect(textarea.value).toBe('Hello world');

    fireEvent.click(screen.getByTitle(/Clear text/i));
    expect(textarea.value).toBe('');
  });

  it('calls speechSynthesis.speak when Play Text is clicked', () => {
    renderSpeakerPage();
    const textarea = screen.getByPlaceholderText(/Type something here/i);
    fireEvent.change(textarea, { target: { value: 'Hallo Welt' } });
    fireEvent.click(screen.getByRole('button', { name: /Play Text/i }));
    expect(global.speechSynthesis.speak).toHaveBeenCalled();
  });

  it('controls speech synthesis: pause, resume, stop', () => {
    renderSpeakerPage();
    global.speechSynthesis.speaking = true;

    fireEvent.click(screen.getByRole('button', { name: /^Pause$/i }));
    expect(global.speechSynthesis.pause).toHaveBeenCalled();

    global.speechSynthesis.paused = true;
    fireEvent.click(screen.getByRole('button', { name: /^Resume$/i }));
    expect(global.speechSynthesis.resume).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /^Stop$/i }));
    expect(global.speechSynthesis.cancel).toHaveBeenCalled();
  });

  it('insert ↺ symbol button adds the symbol into the textarea', () => {
    renderSpeakerPage();
    const textarea = screen.getByPlaceholderText(/Type something here/i);
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    textarea.selectionStart = 5;
    textarea.selectionEnd   = 5;
    fireEvent.click(screen.getByTitle(/Insert repeat symbol/i));
    expect(textarea.value).toContain('↺');
  });
});

// ── (3) feature tests ─────────────────────────────────────────────────────────

describe('(3) listen-pause feature – button', () => {
  it('renders the (3) insert button with the correct title', () => {
    renderSpeakerPage();
    const btn = screen.getByTitle(/Insert 3-second listen pause/i);
    expect(btn).toBeInTheDocument();
    expect(btn.textContent).toBe('(3)');
  });

  it('clicking the (3) button inserts "(3)" on its own line in the textarea', () => {
    renderSpeakerPage();
    const textarea = screen.getByPlaceholderText(/Type something here/i);
    fireEvent.change(textarea, { target: { value: 'wie heißt du?' } });
    // Place cursor at end
    textarea.selectionStart = textarea.value.length;
    textarea.selectionEnd   = textarea.value.length;

    fireEvent.click(screen.getByTitle(/Insert 3-second listen pause/i));

    expect(textarea.value).toContain('(3)');
    // (3) must be on its own line
    const lines = textarea.value.split('\n');
    expect(lines).toContain('(3)');
  });

  it('inserting (3) at the start of an empty textarea puts it on line 0', () => {
    renderSpeakerPage();
    const textarea = screen.getByPlaceholderText(/Type something here/i);
    // textarea is empty, cursor at 0
    textarea.selectionStart = 0;
    textarea.selectionEnd   = 0;
    fireEvent.click(screen.getByTitle(/Insert 3-second listen pause/i));
    expect(textarea.value.startsWith('(3)')).toBe(true);
  });
});

describe('(3) listen-pause feature – playback with SpeechRecognition', () => {
  it('shows 🎙️ Listening status when a (3) line is encountered during playback', async () => {
    const SR = makeSRMock();
    global.SpeechRecognition = SR;

    renderSpeakerPage();
    const textarea = screen.getByPlaceholderText(/Type something here/i);
    fireEvent.change(textarea, { target: { value: 'wie heißt du?\n(3)' } });

    // Make speechSynthesis.speak fire onend immediately so the engine advances
    global.speechSynthesis.speak = vi.fn((utt) => { utt.onend?.(); });

    fireEvent.click(screen.getByRole('button', { name: /Play Text/i }));

    await waitFor(() =>
      expect(screen.getByText(/Listening 3 s/i)).toBeInTheDocument()
    );
  });

  it('inserts recognized transcript immediately after the (3) marker line', async () => {
    const SR = makeSRMock();
    global.SpeechRecognition = SR;

    renderSpeakerPage();
    const textarea = screen.getByPlaceholderText(/Type something here/i);
    fireEvent.change(textarea, { target: { value: 'wie heißt du?\n(3)\n\nWie geht es dir?' } });

    global.speechSynthesis.speak = vi.fn((utt) => { utt.onend?.(); });
    fireEvent.click(screen.getByRole('button', { name: /Play Text/i }));

    // Wait for SR instance to be created and started
    await waitFor(() => expect(SR.getInstance()).toBeTruthy());
    const recInstance = SR.getInstance();

    // Simulate user speaking during the 3-second window
    act(() => {
      recInstance.onresult({
        results: [{ 0: { transcript: 'Ich heiße Max' }, length: 1 }]
      });
    });

    // End the recording window (mock stop() calls onend immediately)
    act(() => { recInstance.stop(); });

    await waitFor(() => {
      const lines = textarea.value.split('\n');
      const markerIdx = lines.indexOf('(3)');
      expect(markerIdx).toBeGreaterThanOrEqual(0);
      expect(lines[markerIdx + 1]).toBe('Ich heiße Max');
    });
  });

  it('does NOT append transcript to the end of the textarea', async () => {
    const SR = makeSRMock();
    global.SpeechRecognition = SR;

    renderSpeakerPage();
    const textarea = screen.getByPlaceholderText(/Type something here/i);
    fireEvent.change(textarea, { target: { value: 'wie heißt du?\n(3)\n\nWie geht es dir?' } });

    global.speechSynthesis.speak = vi.fn((utt) => { utt.onend?.(); });
    fireEvent.click(screen.getByRole('button', { name: /Play Text/i }));

    await waitFor(() => expect(SR.getInstance()).toBeTruthy());
    const rec = SR.getInstance();

    act(() => {
      rec.onresult({
        results: [{ 0: { transcript: 'Ich heiße Max' }, length: 1 }]
      });
    });
    act(() => { rec.stop(); });

    await waitFor(() => {
      const lines = textarea.value.split('\n');
      const lastNonEmpty = [...lines].reverse().find(l => l.trim() !== '');
      expect(lastNonEmpty).not.toBe('Ich heiße Max');
    });
  });

  it('places each transcript after its own (3) marker when there are multiple (3) markers', async () => {
    const SR = makeSRMock();
    global.SpeechRecognition = SR;

    renderSpeakerPage();
    const textarea = screen.getByPlaceholderText(/Type something here/i);
    fireEvent.change(textarea, {
      target: { value: 'wie heißt du?\n(3)\n\nWie geht es dir?\n(3)' }
    });

    global.speechSynthesis.speak = vi.fn((utt) => { utt.onend?.(); });
    fireEvent.click(screen.getByRole('button', { name: /Play Text/i }));

    // ── First (3) ──
    await waitFor(() => expect(SR.getInstance()).toBeTruthy());
    const rec1 = SR.getInstance();
    act(() => {
      rec1.onresult({ results: [{ 0: { transcript: 'Ich heiße Max' }, length: 1 }] });
    });
    // End the first recording window
    act(() => { rec1.stop(); });

    // ── Second (3) ──
    await waitFor(() => SR.getInstance() !== rec1);
    const rec2 = SR.getInstance();
    act(() => {
      rec2.onresult({ results: [{ 0: { transcript: 'Gut, danke' }, length: 1 }] });
    });
    act(() => { rec2.stop(); });

    await waitFor(() => {
      const lines = textarea.value.split('\n');
      const first = lines.indexOf('(3)');
      expect(lines[first + 1]).toBe('Ich heiße Max');

      const second = lines.indexOf('(3)', first + 1);
      expect(second).toBeGreaterThan(first);
      expect(lines[second + 1]).toBe('Gut, danke');
    });
  });

  it('resumes playback (advances to next line) after the 3-second window ends', async () => {
    const SR = makeSRMock();
    global.SpeechRecognition = SR;

    renderSpeakerPage();
    const textarea = screen.getByPlaceholderText(/Type something here/i);
    fireEvent.change(textarea, { target: { value: 'wie heißt du?\n(3)\nWie geht es dir?' } });

    global.speechSynthesis.speak = vi.fn((utt) => { utt.onend?.(); });
    fireEvent.click(screen.getByRole('button', { name: /Play Text/i }));

    await waitFor(() => expect(SR.getInstance()).toBeTruthy());

    // End the recording window with no speech
    act(() => { SR.getInstance().stop(); });

    // Playback must continue — 'Wie geht es dir?' should be spoken
    await waitFor(() => {
      const calls = global.speechSynthesis.speak.mock.calls.map(c => c[0].text);
      expect(calls).toContain('Wie geht es dir?');
    });
  });
});

describe('(3) listen-pause feature – fallback when SpeechRecognition is unavailable', () => {
  it('falls back gracefully and resumes playback after 3 s when SR is not supported', async () => {
    // Ensure no SR available
    delete global.SpeechRecognition;
    delete global.webkitSpeechRecognition;

    // Use fake timers only in this test so we can advance the 3-s fallback timeout
    vi.useFakeTimers({ shouldAdvanceTime: true });

    renderSpeakerPage();
    const textarea = screen.getByPlaceholderText(/Type something here/i);
    fireEvent.change(textarea, { target: { value: 'wie heißt du?\n(3)\nWie geht es dir?' } });

    global.speechSynthesis.speak = vi.fn((utt) => { utt.onend?.(); });
    fireEvent.click(screen.getByRole('button', { name: /Play Text/i }));

    // Status should still show the listening message (set synchronously before SR.start)
    await waitFor(() =>
      expect(screen.getByText(/Listening 3 s/i)).toBeInTheDocument()
    );

    // Advance the fallback 3-second timeout
    await act(async () => { vi.advanceTimersByTime(3000); });

    // Playback must continue — 'Wie geht es dir?' should have been spoken
    await waitFor(() => {
      const calls = global.speechSynthesis.speak.mock.calls.map(c => c[0].text);
      expect(calls).toContain('Wie geht es dir?');
    });

    vi.useRealTimers();
  });
});

describe('SpeakerPage – auto-scroll features', () => {
  it('scrolls textarea to the bottom when text is detected during speech recognition', async () => {
    const SR = makeSRMock();
    global.SpeechRecognition = SR;

    renderSpeakerPage();
    const textarea = screen.getByPlaceholderText(/Type something here/i);

    // Mock scrollTop and scrollHeight in JSDOM
    let scrollTopValue = 0;
    Object.defineProperty(textarea, 'scrollTop', {
      get() { return scrollTopValue; },
      set(val) { scrollTopValue = val; },
      configurable: true
    });
    Object.defineProperty(textarea, 'scrollHeight', {
      get() { return 500; },
      configurable: true
    });

    // Start listening
    fireEvent.click(screen.getByText(/Start Listening/i));

    // Wait for SR instance to be created
    await waitFor(() => expect(SR.getInstance()).toBeTruthy());
    const recInstance = SR.getInstance();

    // Simulate speech input
    act(() => {
      recInstance.onresult({
        results: [{ 0: { transcript: 'This is some text' }, isFinal: true }]
      });
    });

    // Verify textarea value updated and scrolled to bottom
    await waitFor(() => {
      expect(textarea.value).toBe('This is some text');
      expect(textarea.scrollTop).toBe(500);
    });

    // Stop listening
    fireEvent.click(screen.getByText(/Stop Listening/i));
  });

  it('scrolls textarea to the bottom when text is detected during (3) listen-pause', async () => {
    const SR = makeSRMock();
    global.SpeechRecognition = SR;

    renderSpeakerPage();
    const textarea = screen.getByPlaceholderText(/Type something here/i);
    fireEvent.change(textarea, { target: { value: 'wie heißt du?\n(3)' } });

    // Mock scrollTop and scrollHeight
    let scrollTopValue = 0;
    Object.defineProperty(textarea, 'scrollTop', {
      get() { return scrollTopValue; },
      set(val) { scrollTopValue = val; },
      configurable: true
    });
    Object.defineProperty(textarea, 'scrollHeight', {
      get() { return 600; },
      configurable: true
    });

    global.speechSynthesis.speak = vi.fn((utt) => { utt.onend?.(); });
    fireEvent.click(screen.getByRole('button', { name: /Play Text/i }));

    await waitFor(() => expect(SR.getInstance()).toBeTruthy());
    const recInstance = SR.getInstance();

    act(() => {
      recInstance.onresult({
        results: [{ 0: { transcript: 'Ich heiße Max' }, length: 1 }]
      });
    });
    act(() => { recInstance.stop(); });

    await waitFor(() => {
      const lines = textarea.value.split('\n');
      expect(lines).toContain('Ich heiße Max');
      expect(textarea.scrollTop).toBe(600);
    });
  });
});

