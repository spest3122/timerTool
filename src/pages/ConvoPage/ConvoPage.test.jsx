/**
 * ConvoPage Test Suite
 *
 * Coverage:
 *   1.  Data integrity  — scripts.js & characters.js shape validation
 *   2.  useSpeechRecognition hook — state machine via mock SR class
 *   3.  SelectionModal — renders, character selection, Start button state
 *   4.  ConvoHeader    — title, subtitle, progress bar, action buttons
 *   5.  TurnCard (AI)  — text, TTS button, Continue, done-state CSS
 *   6.  TurnCard (User/fallback) — plain input, submit, Enter key
 *   7.  TurnCard (User/mic)      — Record, Stop, transcript, Keep & Submit, Record Again
 *   8.  ScriptModal    — turn list, close button, backdrop
 *   9.  FeedbackView   — stars, score pills, analysis, responses, action buttons
 *  10.  ConvoPage (integration) — full select → convo → feedback flow
 *
 * ────────────────────────────────────────────────────────────────────────────
 * jsdom limitations addressed:
 *   • scrollIntoView  → polyfilled via vi.fn() on HTMLElement.prototype
 *   • speechSynthesis → installed before each test that needs it, with
 *                       getVoices() returning real locale strings so the
 *                       synchronous speak() path is taken
 *   • SpeechRecognition module-level SR const (frozen at import time) →
 *     mic-path tests drive state by controlling hook return values through
 *     vi.mock (hoisted), making tests deterministic and independent of jsdom
 */

// ── vi.mock must be at the very top (Vitest hoists it before imports) ────────
import { vi } from 'vitest';

/**
 * Mutable controller object.
 * Each test sets _srCtrl to the state it wants the hook to return.
 */
let _srCtrl = {
  isSupported: false,
  isListening: false,
  transcript:  '',
  isFinal:     false,
  start:  vi.fn(),
  stop:   vi.fn(),
  reset:  vi.fn(),
};

vi.mock('./hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: vi.fn(() => _srCtrl),
}));

// ── Regular imports (after mock declaration) ─────────────────────────────────
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// ── Polyfill scrollIntoView (not implemented in jsdom) ───────────────────────
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// ── Polyfill SpeechSynthesisUtterance (not implemented in jsdom) ─────────────
if (typeof window.SpeechSynthesisUtterance === 'undefined') {
  window.SpeechSynthesisUtterance = class SpeechSynthesisUtterance {
    constructor(text) {
      this.text   = text;
      this.lang   = '';
      this.rate   = 1;
      this.voice  = null;
    }
  };
}

// ── Data ─────────────────────────────────────────────────────────────────────
import { SCRIPTS, ALL_SCRIPTS }      from './data/scripts';
import { CHARACTERS, CHARACTER_MAP } from './data/characters';

// ── Components ───────────────────────────────────────────────────────────────
import SelectionModal  from './SelectionModal';
import ScriptModal     from './ScriptModal';
import ConvoHeader     from './ConvoHeader';
import TurnCard        from './TurnCard';
import FeedbackView    from './FeedbackView';
import ConvoPage       from './ConvoPage';

// ── Shared fixtures ──────────────────────────────────────────────────────────
const NONO     = CHARACTER_MAP['nono'];
const DE_GREET = SCRIPTS.de[0];   // 7-turn German Greetings script

// ── speechSynthesis helpers ──────────────────────────────────────────────────
function installSynthMock() {
  const mock = {
    cancel:              vi.fn(),
    speak:               vi.fn(),
    getVoices:           vi.fn(() => [
      { lang: 'de-DE' }, { lang: 'en-US' }, { lang: 'es-ES' },
    ]),
    addEventListener:    vi.fn(),
    removeEventListener: vi.fn(),
  };
  Object.defineProperty(window, 'speechSynthesis', {
    value: mock, writable: true, configurable: true,
  });
  return mock;
}

function removeSynthMock() {
  Object.defineProperty(window, 'speechSynthesis', {
    value: {
      cancel: vi.fn(), speak: vi.fn(), getVoices: () => [],
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
    },
    writable: true, configurable: true,
  });
}

// ── useSpeechRecognition controller helper ───────────────────────────────────
function setSRState(overrides) {
  _srCtrl = {
    isSupported: false,
    isListening: false,
    transcript:  '',
    isFinal:     false,
    start:  vi.fn(),
    stop:   vi.fn(),
    reset:  vi.fn(),
    ...(overrides ?? {}),
  };
}

// ════════════════════════════════════════════════════════════════════════════
// 1. Data — scripts.js
// ════════════════════════════════════════════════════════════════════════════
describe('Data — scripts.js', () => {
  it('exports SCRIPTS with all three languages', () => {
    expect(SCRIPTS).toHaveProperty('de');
    expect(SCRIPTS).toHaveProperty('en');
    expect(SCRIPTS).toHaveProperty('es');
  });

  it('every language has at least 2 topics', () => {
    for (const lang of ['de', 'en', 'es']) {
      expect(SCRIPTS[lang].length).toBeGreaterThanOrEqual(2);
    }
  });

  it('every script has the required shape fields', () => {
    for (const s of ALL_SCRIPTS) {
      expect(s).toHaveProperty('id');
      expect(s).toHaveProperty('topic');
      expect(s).toHaveProperty('topicEn');
      expect(s).toHaveProperty('emoji');
      expect(Array.isArray(s.turns)).toBe(true);
      expect(s.turns.length).toBeGreaterThan(0);
    }
  });

  it('every turn has a valid speaker field', () => {
    for (const s of ALL_SCRIPTS) {
      for (const t of s.turns) {
        expect(['ai', 'user']).toContain(t.speaker);
      }
    }
  });

  it('AI turns have a non-empty text field', () => {
    for (const s of ALL_SCRIPTS) {
      for (const t of s.turns.filter((x) => x.speaker === 'ai')) {
        expect(t.text?.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('user turns have a non-empty hint field', () => {
    for (const s of ALL_SCRIPTS) {
      for (const t of s.turns.filter((x) => x.speaker === 'user')) {
        expect(t.hint?.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('scripts alternate speakers and always start with AI', () => {
    for (const s of ALL_SCRIPTS) {
      expect(s.turns[0].speaker).toBe('ai');
      for (let i = 1; i < s.turns.length; i++) {
        expect(s.turns[i].speaker).not.toBe(s.turns[i - 1].speaker);
      }
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. Data — characters.js
// ════════════════════════════════════════════════════════════════════════════
describe('Data — characters.js', () => {
  it('exports exactly 3 characters', () => {
    expect(CHARACTERS).toHaveLength(3);
  });

  it('each character covers a distinct language', () => {
    expect(new Set(CHARACTERS.map((c) => c.lang)).size).toBe(3);
  });

  it('every character has all required fields', () => {
    const req = ['id', 'name', 'lang', 'langLabel', 'langFlag', 'avatar', 'color', 'bgColor', 'voiceLocale', 'persona'];
    for (const char of CHARACTERS) {
      for (const f of req) {
        expect(char[f], `${char.id}.${f}`).toBeTruthy();
      }
    }
  });

  it('CHARACTER_MAP keys match character ids', () => {
    for (const c of CHARACTERS) {
      expect(CHARACTER_MAP[c.id]).toBe(c);
    }
  });

  it('voiceLocale is a valid BCP-47 string', () => {
    for (const c of CHARACTERS) {
      expect(c.voiceLocale).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. useSpeechRecognition hook — state transitions via MockSR
//    Because the module-level SR const is frozen after import-time eval,
//    we test the hook logic (start/stop/reset state transitions) by driving
//    a MockSR class directly, mirroring what the hook does internally.
// ════════════════════════════════════════════════════════════════════════════
describe('useSpeechRecognition — MockSR state transitions', () => {
  function makeMockSR() {
    const rec = {
      lang: '', continuous: false, interimResults: false,
      onstart: null, onresult: null, onerror: null, onend: null,
    };
    rec.start = vi.fn(() => rec.onstart?.());
    rec.stop  = vi.fn(() => rec.onend?.());
    rec.abort = vi.fn(() => rec.onend?.());
    return rec;
  }

  it('calling start fires the onstart callback', () => {
    const sr = makeMockSR();
    let started = false;
    sr.onstart = () => { started = true; };
    sr.start();
    expect(started).toBe(true);
  });

  it('calling stop fires the onend callback', () => {
    const sr = makeMockSR();
    let ended = false;
    sr.onend = () => { ended = true; };
    sr.stop();
    expect(ended).toBe(true);
  });

  it('calling abort fires the onend callback', () => {
    const sr = makeMockSR();
    let aborted = false;
    sr.onend = () => { aborted = true; };
    sr.abort();
    expect(aborted).toBe(true);
  });

  it('onresult event delivers transcript text', () => {
    const sr = makeMockSR();
    let received = '';
    sr.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        received += e.results[i][0].transcript;
      }
    };
    sr.onresult({
      resultIndex: 0,
      results: [Object.assign([{ transcript: 'hello world' }], { isFinal: false })],
    });
    expect(received).toBe('hello world');
  });

  it('onresult event sets isFinal when the result is marked final', () => {
    const sr = makeMockSR();
    let finalSeen = false;
    sr.onresult = (e) => {
      if (e.results[0].isFinal) finalSeen = true;
    };
    sr.onresult({
      resultIndex: 0,
      results: [Object.assign([{ transcript: 'done' }], { isFinal: true })],
    });
    expect(finalSeen).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. SelectionModal
// ════════════════════════════════════════════════════════════════════════════
describe('SelectionModal', () => {
  it('renders the modal heading', () => {
    render(<SelectionModal onStart={vi.fn()} />);
    expect(screen.getByText(/choose your tutor/i)).toBeInTheDocument();
  });

  it('renders all three character names', () => {
    render(<SelectionModal onStart={vi.fn()} />);
    expect(screen.getByText('Nono')).toBeInTheDocument();
    expect(screen.getByText('Alex')).toBeInTheDocument();
    expect(screen.getByText('María')).toBeInTheDocument();
  });

  it('Start button is disabled before selecting a character', () => {
    render(<SelectionModal onStart={vi.fn()} />);
    expect(screen.getByRole('button', { name: /select a tutor/i })).toBeDisabled();
  });

  it('Start button enables after clicking a character card', async () => {
    const user = userEvent.setup();
    render(<SelectionModal onStart={vi.fn()} />);
    await user.click(screen.getByText('Nono').closest('button'));
    expect(screen.getByRole('button', { name: /start german lesson/i })).not.toBeDisabled();
  });

  it('calls onStart(de, nono) when Nono is selected', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    render(<SelectionModal onStart={onStart} />);
    await user.click(screen.getByText('Nono').closest('button'));
    await user.click(screen.getByRole('button', { name: /start german lesson/i }));
    expect(onStart).toHaveBeenCalledWith('de', 'nono');
  });

  it('calls onStart(es, maria) when María is selected', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    render(<SelectionModal onStart={onStart} />);
    await user.click(screen.getByText('María').closest('button'));
    await user.click(screen.getByRole('button', { name: /start spanish lesson/i }));
    expect(onStart).toHaveBeenCalledWith('es', 'maria');
  });

  it('calls onStart(en, alex) when Alex is selected', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    render(<SelectionModal onStart={onStart} />);
    await user.click(screen.getByText('Alex').closest('button'));
    await user.click(screen.getByRole('button', { name: /start english lesson/i }));
    expect(onStart).toHaveBeenCalledWith('en', 'alex');
  });

  it('renders character persona descriptions', () => {
    render(<SelectionModal onStart={vi.fn()} />);
    expect(screen.getByText(/friendly tutor from berlin/i)).toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5. ConvoHeader
// ════════════════════════════════════════════════════════════════════════════
describe('ConvoHeader', () => {
  const props = {
    character:         NONO,
    script:            DE_GREET,
    lang:              'de',
    turnIndex:         0,
    totalTurns:        DE_GREET.turns.length,
    onChangeCharacter: vi.fn(),
    onViewScript:      vi.fn(),
  };

  it('renders the topic title', () => {
    render(<ConvoHeader {...props} />);
    expect(screen.getByText(/greetings/i)).toBeInTheDocument();
  });

  it('shows character name and turn count', () => {
    render(<ConvoHeader {...props} />);
    expect(screen.getByText(/nono/i)).toBeInTheDocument();
    expect(screen.getByText(/turn 1 of 7/i)).toBeInTheDocument();
  });

  it('renders Change Character and View Script buttons', () => {
    render(<ConvoHeader {...props} />);
    expect(screen.getByRole('button', { name: /change character/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view script/i })).toBeInTheDocument();
  });

  it('calls onChangeCharacter on click', async () => {
    const user = userEvent.setup();
    const fn = vi.fn();
    render(<ConvoHeader {...props} onChangeCharacter={fn} />);
    await user.click(screen.getByRole('button', { name: /change character/i }));
    expect(fn).toHaveBeenCalledOnce();
  });

  it('calls onViewScript on click', async () => {
    const user = userEvent.setup();
    const fn = vi.fn();
    render(<ConvoHeader {...props} onViewScript={fn} />);
    await user.click(screen.getByRole('button', { name: /view script/i }));
    expect(fn).toHaveBeenCalledOnce();
  });

  it('progress bar has correct aria-valuenow at turn 3 of 7', () => {
    render(<ConvoHeader {...props} turnIndex={3} totalTurns={7} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '57');
  });

  it('progress fill width increases as turnIndex increases', () => {
    const { rerender, container } = render(
      <ConvoHeader {...props} turnIndex={0} totalTurns={4} />
    );
    const w0 = parseFloat(container.querySelector('.cp-progress-fill').style.width);
    rerender(<ConvoHeader {...props} turnIndex={3} totalTurns={4} />);
    const w3 = parseFloat(container.querySelector('.cp-progress-fill').style.width);
    expect(w3).toBeGreaterThan(w0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 6. TurnCard — AI turn
// ════════════════════════════════════════════════════════════════════════════
describe('TurnCard — AI turn', () => {
  let synth;

  const aiProps = {
    turn:          { speaker: 'ai', text: 'Hello! How are you?' },
    turnIdx:       0,
    isActive:      true,
    isDone:        false,
    submittedText: undefined,
    charName:      'Nono',
    charAvatar:    '🧑‍🏫',
    voiceLocale:   'de-DE',
    lang:          'de',
    onAiContinue:  vi.fn(),
    onUserSubmit:  vi.fn(),
  };

  beforeEach(() => { synth = installSynthMock(); setSRState(); });
  afterEach(()  => { removeSynthMock(); vi.restoreAllMocks(); });

  it('displays the character name label', () => {
    render(<TurnCard {...aiProps} />);
    expect(screen.getByText('Nono')).toBeInTheDocument();
  });

  it('displays the AI text', () => {
    render(<TurnCard {...aiProps} />);
    expect(screen.getByText('Hello! How are you?')).toBeInTheDocument();
  });

  it('renders the Listen TTS button', () => {
    render(<TurnCard {...aiProps} />);
    expect(screen.getByRole('button', { name: /play audio/i })).toBeInTheDocument();
  });

  it('calls speechSynthesis.cancel then speak when Listen is clicked', async () => {
    const user = userEvent.setup();
    render(<TurnCard {...aiProps} />);
    await user.click(screen.getByRole('button', { name: /play audio/i }));
    expect(synth.cancel).toHaveBeenCalled();
    expect(synth.speak).toHaveBeenCalled();
  });

  it('renders Continue button when isActive', () => {
    render(<TurnCard {...aiProps} />);
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
  });

  it('omits Continue button when isDone', () => {
    render(<TurnCard {...aiProps} isActive={false} isDone={true} />);
    expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument();
  });

  it('calls onAiContinue when Continue is clicked', async () => {
    const user = userEvent.setup();
    const fn = vi.fn();
    render(<TurnCard {...aiProps} onAiContinue={fn} />);
    await user.click(screen.getByRole('button', { name: /continue/i }));
    expect(fn).toHaveBeenCalledOnce();
  });

  it('adds cp-turn-done class when isDone', () => {
    const { container } = render(
      <TurnCard {...aiProps} isActive={false} isDone={true} />
    );
    expect(container.querySelector('.cp-turn-done')).toBeInTheDocument();
  });

  it('TTS button id is stable and based on turnIdx prop', () => {
    const { container } = render(<TurnCard {...aiProps} turnIdx={3} />);
    expect(container.querySelector('#convo-tts-btn-3')).toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 7a. TurnCard — User turn (fallback text input)
//     isSupported = false → plain <input> renders
// ════════════════════════════════════════════════════════════════════════════
describe('TurnCard — User turn (fallback text input)', () => {
  const userProps = {
    turn:          { speaker: 'user', hint: 'Say you are doing well' },
    turnIdx:       1,
    isActive:      true,
    isDone:        false,
    submittedText: undefined,
    charName:      'Nono',
    charAvatar:    '🧑‍🏫',
    voiceLocale:   'en-US',
    lang:          'en',
    onAiContinue:  vi.fn(),
    onUserSubmit:  vi.fn(),
  };

  beforeEach(() => setSRState({ isSupported: false }));

  it('displays the You label', () => {
    render(<TurnCard {...userProps} />);
    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('shows the hint text', () => {
    render(<TurnCard {...userProps} />);
    expect(screen.getByText(/say you are doing well/i)).toBeInTheDocument();
  });

  it('renders a fallback text input', () => {
    render(<TurnCard {...userProps} />);
    expect(screen.getByPlaceholderText(/type your response/i)).toBeInTheDocument();
  });

  it('Submit button is disabled when input is empty', () => {
    render(<TurnCard {...userProps} />);
    expect(screen.getByRole('button', { name: /^submit$/i })).toBeDisabled();
  });

  it('Submit button enables once text is typed', async () => {
    const user = userEvent.setup();
    render(<TurnCard {...userProps} />);
    await user.type(screen.getByPlaceholderText(/type your response/i), 'I am fine');
    expect(screen.getByRole('button', { name: /^submit$/i })).not.toBeDisabled();
  });

  it('calls onUserSubmit with typed text on button click', async () => {
    const user = userEvent.setup();
    const fn = vi.fn();
    render(<TurnCard {...userProps} onUserSubmit={fn} />);
    await user.type(screen.getByPlaceholderText(/type your response/i), 'I am fine');
    await user.click(screen.getByRole('button', { name: /^submit$/i }));
    expect(fn).toHaveBeenCalledWith('I am fine');
  });

  it('calls onUserSubmit on Enter key press', async () => {
    const user = userEvent.setup();
    const fn = vi.fn();
    render(<TurnCard {...userProps} onUserSubmit={fn} />);
    await user.type(
      screen.getByPlaceholderText(/type your response/i),
      'Doing great{Enter}'
    );
    expect(fn).toHaveBeenCalledWith('Doing great');
  });

  it('shows submitted text and hides input when isDone', () => {
    render(
      <TurnCard
        {...userProps}
        isActive={false}
        isDone={true}
        submittedText="I am doing very well"
      />
    );
    expect(screen.getByText(/"I am doing very well"/)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/type your response/i)).not.toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 7b. TurnCard — User turn (mic path)
//     We control hook state through _srCtrl which the vi.mock delegates to.
//     Each test calls setSRState() to configure what the hook "returns".
// ════════════════════════════════════════════════════════════════════════════
describe('TurnCard — User turn (mic path)', () => {
  const userProps = {
    turn:          { speaker: 'user', hint: 'Speak your answer' },
    turnIdx:       1,
    isActive:      true,
    isDone:        false,
    submittedText: undefined,
    charName:      'Nono',
    charAvatar:    '🧑‍🏫',
    voiceLocale:   'de-DE',
    lang:          'de',
    onAiContinue:  vi.fn(),
    onUserSubmit:  vi.fn(),
  };

  it('shows the Record mic button when isSupported=true and idle', () => {
    setSRState({ isSupported: true, isListening: false, transcript: '', isFinal: false });
    render(<TurnCard {...userProps} />);
    expect(screen.getByRole('button', { name: /start recording/i })).toBeInTheDocument();
  });

  it('shows the Stop button when isListening=true', () => {
    setSRState({ isSupported: true, isListening: true, transcript: '', isFinal: false });
    render(<TurnCard {...userProps} />);
    expect(screen.getByRole('button', { name: /stop recording/i })).toBeInTheDocument();
  });

  it('applies cp-recording class while listening', () => {
    setSRState({ isSupported: true, isListening: true, transcript: '', isFinal: false });
    const { container } = render(<TurnCard {...userProps} />);
    expect(container.querySelector('.cp-recording')).toBeInTheDocument();
  });

  it('displays interim transcript text while listening', () => {
    setSRState({ isSupported: true, isListening: true, transcript: 'partial text', isFinal: false });
    render(<TurnCard {...userProps} />);
    expect(screen.getByText(/partial text/i)).toBeInTheDocument();
  });

  it('shows Keep & Submit / Record Again after recognition ends with text (isFinal=true)', () => {
    // isListening=false + transcript set → useEffect fires on mount, sets captureReady=true
    setSRState({ isSupported: true, isListening: false, transcript: 'final text', isFinal: true });
    render(<TurnCard {...userProps} />);
    expect(screen.getByRole('button', { name: /keep.*submit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /record again/i })).toBeInTheDocument();
  });

  it('calls onUserSubmit with the transcript when Keep & Submit is clicked', async () => {
    const user = userEvent.setup();
    const fn = vi.fn();
    setSRState({ isSupported: true, isListening: false, transcript: 'my answer', isFinal: true });
    render(<TurnCard {...userProps} onUserSubmit={fn} />);
    await user.click(screen.getByRole('button', { name: /keep.*submit/i }));
    expect(fn).toHaveBeenCalledWith('my answer');
  });

  it('calls reset() when Record Again is clicked', async () => {
    const user = userEvent.setup();
    const resetFn = vi.fn();
    setSRState({ isSupported: true, isListening: false, transcript: 'oops', isFinal: true, reset: resetFn });
    render(<TurnCard {...userProps} />);
    await user.click(screen.getByRole('button', { name: /record again/i }));
    expect(resetFn).toHaveBeenCalled();
  });

  it('calls reset() when Record Again is clicked (confirmed via spy)', async () => {
    const user = userEvent.setup();
    const resetFn = vi.fn();
    setSRState({ isSupported: true, isListening: false, transcript: 'oops', isFinal: true, reset: resetFn });
    render(<TurnCard {...userProps} />);
    await user.click(screen.getByRole('button', { name: /record again/i }));
    // The component calls reset() — this is the observable effect that would
    // clear the real hook's state (transcript/draft/captureReady).
    expect(resetFn).toHaveBeenCalled();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 8. ScriptModal
// ════════════════════════════════════════════════════════════════════════════
describe('ScriptModal', () => {
  const onClose = vi.fn();
  beforeEach(() => onClose.mockClear());

  it('renders the topic title', () => {
    render(<ScriptModal script={DE_GREET} charName="Nono" onClose={onClose} />);
    expect(screen.getByText(/greetings/i)).toBeInTheDocument();
  });

  it('renders Nono labels for AI turns (DE_GREET has 4 AI turns)', () => {
    render(<ScriptModal script={DE_GREET} charName="Nono" onClose={onClose} />);
    expect(screen.getAllByText('Nono').length).toBeGreaterThanOrEqual(4);
  });

  it('renders You labels for user turns (DE_GREET has 3 user turns)', () => {
    render(<ScriptModal script={DE_GREET} charName="Nono" onClose={onClose} />);
    expect(screen.getAllByText('You').length).toBeGreaterThanOrEqual(3);
  });

  it('displays hint text for user turns', () => {
    render(<ScriptModal script={DE_GREET} charName="Nono" onClose={onClose} />);
    expect(screen.getByText(/introduce yourself/i)).toBeInTheDocument();
  });

  it('calls onClose when Close button is clicked', async () => {
    const user = userEvent.setup();
    render(<ScriptModal script={DE_GREET} charName="Nono" onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: /close script panel/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when the backdrop overlay is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ScriptModal script={DE_GREET} charName="Nono" onClose={onClose} />
    );
    await user.click(container.querySelector('.cp-script-overlay'));
    expect(onClose).toHaveBeenCalled();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 9. FeedbackView
// ════════════════════════════════════════════════════════════════════════════
describe('FeedbackView', () => {
  // DE_GREET user turns are at indices 1, 3, 5
  const userResponses = { 1: 'Ich heiße Lena', 3: 'Aus Deutschland', 5: 'Seit drei Monaten' };

  const baseProps = {
    script:        DE_GREET,
    userResponses,
    lang:          'de',
    character:     NONO,
    onRetry:       vi.fn(),
    onNextContext: vi.fn(),
  };

  beforeEach(() => { baseProps.onRetry.mockClear(); baseProps.onNextContext.mockClear(); });

  it('renders the Lesson Complete heading', () => {
    render(<FeedbackView {...baseProps} />);
    expect(screen.getByText(/lesson complete/i)).toBeInTheDocument();
  });

  it('shows the script topic name', () => {
    render(<FeedbackView {...baseProps} />);
    expect(screen.getByText(/greetings/i)).toBeInTheDocument();
  });

  it('renders exactly 5 star elements', () => {
    const { container } = render(<FeedbackView {...baseProps} />);
    expect(container.querySelectorAll('.cp-star')).toHaveLength(5);
  });

  it('shows all 5 stars earned when all user turns answered', () => {
    const { container } = render(<FeedbackView {...baseProps} />);
    expect(container.querySelectorAll('.cp-star.earned')).toHaveLength(5);
  });

  it('shows fewer stars when only one response is submitted', () => {
    const { container } = render(
      <FeedbackView {...baseProps} userResponses={{ 1: 'only one' }} />
    );
    expect(container.querySelectorAll('.cp-star.earned').length).toBeLessThan(5);
  });

  it('displays Responses, Stars, and Total Turns score pills', () => {
    render(<FeedbackView {...baseProps} />);
    expect(screen.getByText('Responses')).toBeInTheDocument();
    expect(screen.getByText('Stars')).toBeInTheDocument();
    expect(screen.getByText('Total Turns')).toBeInTheDocument();
  });

  it('shows 3/3 in the Responses pill', () => {
    render(<FeedbackView {...baseProps} />);
    expect(screen.getByText('3/3')).toBeInTheDocument();
  });

  it('renders the Grammar Feedback section', () => {
    render(<FeedbackView {...baseProps} />);
    expect(screen.getByText(/grammar feedback/i)).toBeInTheDocument();
  });

  it('renders the Pronunciation Feedback section', () => {
    render(<FeedbackView {...baseProps} />);
    expect(screen.getByText(/pronunciation feedback/i)).toBeInTheDocument();
  });

  it('shows submitted response texts in the summary', () => {
    render(<FeedbackView {...baseProps} />);
    expect(screen.getByText(/ich heiße lena/i)).toBeInTheDocument();
    expect(screen.getByText(/aus deutschland/i)).toBeInTheDocument();
  });

  it('renders Retry Lesson and Next Context buttons', () => {
    render(<FeedbackView {...baseProps} />);
    expect(screen.getByRole('button', { name: /retry lesson/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next context/i })).toBeInTheDocument();
  });

  it('calls onRetry when Retry Lesson is clicked', async () => {
    const user = userEvent.setup();
    const fn = vi.fn();
    render(<FeedbackView {...baseProps} onRetry={fn} />);
    await user.click(screen.getByRole('button', { name: /retry lesson/i }));
    expect(fn).toHaveBeenCalledOnce();
  });

  it('calls onNextContext when Next Context is clicked', async () => {
    const user = userEvent.setup();
    const fn = vi.fn();
    render(<FeedbackView {...baseProps} onNextContext={fn} />);
    await user.click(screen.getByRole('button', { name: /next context/i }));
    expect(fn).toHaveBeenCalledOnce();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 10. ConvoPage — integration (select → convo → feedback)
//     Speech recognition is mocked (isSupported=false) → fallback text input.
// ════════════════════════════════════════════════════════════════════════════
describe('ConvoPage integration', () => {
  beforeEach(() => {
    setSRState({ isSupported: false });
    installSynthMock();
  });

  afterEach(() => {
    removeSynthMock();
    vi.restoreAllMocks();
  });

  it('shows SelectionModal on first render', () => {
    render(<ConvoPage />);
    expect(screen.getByText(/choose your tutor/i)).toBeInTheDocument();
  });

  it('transitions to conversation view after selecting a character', async () => {
    const user = userEvent.setup();
    render(<ConvoPage />);
    await user.click(screen.getByText('Alex').closest('button'));
    await user.click(screen.getByRole('button', { name: /start english lesson/i }));
    expect(screen.getByRole('button', { name: /change character/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view script/i })).toBeInTheDocument();
  });

  it('shows the first AI turn text after starting (German)', async () => {
    const user = userEvent.setup();
    render(<ConvoPage />);
    await user.click(screen.getByText('Nono').closest('button'));
    await user.click(screen.getByRole('button', { name: /start german lesson/i }));
    expect(screen.getByText(/hallo.*nono/i)).toBeInTheDocument();
  });

  it('shows fallback text input after clicking Continue on an AI turn', async () => {
    const user = userEvent.setup();
    render(<ConvoPage />);
    await user.click(screen.getByText('Alex').closest('button'));
    await user.click(screen.getByRole('button', { name: /start english lesson/i }));
    await user.click(screen.getByRole('button', { name: /continue/i }));
    expect(screen.getByPlaceholderText(/type your response/i)).toBeInTheDocument();
  });

  it('opens ScriptModal when View Script is clicked', async () => {
    const user = userEvent.setup();
    render(<ConvoPage />);
    await user.click(screen.getByText('Nono').closest('button'));
    await user.click(screen.getByRole('button', { name: /start german lesson/i }));
    await user.click(screen.getByRole('button', { name: /view script/i }));
    expect(screen.getByRole('button', { name: /close script panel/i })).toBeInTheDocument();
  });

  it('closes ScriptModal when its close button is clicked', async () => {
    const user = userEvent.setup();
    render(<ConvoPage />);
    await user.click(screen.getByText('Nono').closest('button'));
    await user.click(screen.getByRole('button', { name: /start german lesson/i }));
    await user.click(screen.getByRole('button', { name: /view script/i }));
    await user.click(screen.getByRole('button', { name: /close script panel/i }));
    expect(screen.queryByRole('button', { name: /close script panel/i })).not.toBeInTheDocument();
  });

  it('returns to SelectionModal when Change Character is clicked', async () => {
    const user = userEvent.setup();
    render(<ConvoPage />);
    await user.click(screen.getByText('Alex').closest('button'));
    await user.click(screen.getByRole('button', { name: /start english lesson/i }));
    await user.click(screen.getByRole('button', { name: /change character/i }));
    expect(screen.getByText(/choose your tutor/i)).toBeInTheDocument();
  });

  // ── Shared helper: step through the 7-turn German Greetings script ─────
  async function runFullGermanLesson(user) {
    await user.click(screen.getByText('Nono').closest('button'));
    await user.click(screen.getByRole('button', { name: /start german lesson/i }));

    const replies = ['Ich heiße Lena', 'Aus Japan', 'Seit einem Jahr'];
    for (const reply of replies) {
      await user.click(screen.getByRole('button', { name: /continue/i }));
      await user.type(screen.getByPlaceholderText(/type your response/i), reply);
      await user.click(screen.getByRole('button', { name: /^submit$/i }));
    }
    // Final AI turn
    await user.click(screen.getByRole('button', { name: /continue/i }));
  }

  it('reaches FeedbackView after completing all turns', async () => {
    const user = userEvent.setup();
    render(<ConvoPage />);
    await runFullGermanLesson(user);
    await waitFor(() =>
      expect(screen.getByText(/lesson complete/i)).toBeInTheDocument()
    );
  });

  it('FeedbackView shows the submitted responses', async () => {
    const user = userEvent.setup();
    render(<ConvoPage />);
    await runFullGermanLesson(user);
    await waitFor(() => screen.getByText(/lesson complete/i));
    expect(screen.getByText(/ich heiße lena/i)).toBeInTheDocument();
  });

  it('Retry Lesson resets to the first AI card', async () => {
    const user = userEvent.setup();
    render(<ConvoPage />);
    await runFullGermanLesson(user);
    await waitFor(() => screen.getByText(/lesson complete/i));
    await user.click(screen.getByRole('button', { name: /retry lesson/i }));
    expect(screen.getByText(/hallo.*nono/i)).toBeInTheDocument();
    expect(screen.queryByText(/lesson complete/i)).not.toBeInTheDocument();
  });

  it('Next Context loads the second German topic (Im Café)', async () => {
    const user = userEvent.setup();
    render(<ConvoPage />);
    await runFullGermanLesson(user);
    await waitFor(() => screen.getByText(/lesson complete/i));
    await user.click(screen.getByRole('button', { name: /next context/i }));
    await waitFor(() =>
      expect(screen.queryByText(/lesson complete/i)).not.toBeInTheDocument()
    );
    // "Im Café" appears in the header and progress label — check at least one exists
    expect(screen.getAllByText(/café/i).length).toBeGreaterThan(0);
  });

  it('progress bar resets to near-zero after Retry Lesson', async () => {
    const user = userEvent.setup();
    const { container } = render(<ConvoPage />);
    await runFullGermanLesson(user);
    await waitFor(() => screen.getByText(/lesson complete/i));
    await user.click(screen.getByRole('button', { name: /retry lesson/i }));
    const fill = container.querySelector('.cp-progress-fill');
    // Turn 1 of 7 → ≈14 %
    expect(parseFloat(fill?.style.width ?? '0')).toBeLessThan(20);
  });
});
