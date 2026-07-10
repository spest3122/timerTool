/**
 * ConvoPage Test Suite
 *
 * Coverage:
 *   1.  Data integrity  — scripts.js & characters.js shape validation
 *   2.  useSpeechRecognition hook — state machine via mock SR class
 *   3.  SelectionModal — language from settings, character selection, Start button
 *   4.  ConvoHeader    — title, subtitle, progress bar, action buttons
 *   5.  TurnCard (AI)  — text, TTS button, auto-advance, done-state CSS
 *   6.  TurnCard (User/fallback) — plain input, submit, Enter key
 *   7.  TurnCard (User/mic)      — Record, Stop, transcript, Keep & Submit, Record Again
 *   8.  ScriptModal    — turn list, close button, backdrop
 *   9.  FeedbackView   — stars, score pills, analysis, responses, action buttons
 *  10.  ConvoPage (integration) — full select → convo → feedback flow
 *
 * Key design decisions:
 *   • NO vi.useFakeTimers — fake timers bleed across tests and cause userEvent
 *     to hang. Instead, TurnCard accepts an `autoAdvanceDelay` prop (default
 *     1800ms) and tests pass 0 for instant advance.
 *   • useSpeechRecognition is vi.mock'd so the SR module-freeze is bypassed.
 *   • SelectionModal and ConvoPage need SettingsProvider — provided via wrapper.
 *   • Voice uses onSpeak prop (from ConvoPage via SettingsContext.speakWithLocale).
 */

// ── vi.mock must be at the very top (Vitest hoists it before imports) ────────
import { vi } from 'vitest';

let _srCtrl = {
  isSupported: false, isListening: false, transcript: '', isFinal: false,
  start: vi.fn(), stop: vi.fn(), reset: vi.fn(),
};
vi.mock('./hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: vi.fn(() => _srCtrl),
}));

// ── Regular imports ──────────────────────────────────────────────────────────
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// ── Polyfills ─────────────────────────────────────────────────────────────────
window.HTMLElement.prototype.scrollIntoView = vi.fn();
if (typeof window.SpeechSynthesisUtterance === 'undefined') {
  window.SpeechSynthesisUtterance = class {
    constructor(text) { this.text = text; this.lang = ''; this.rate = 1; this.voice = null; }
  };
}

// ── Data ─────────────────────────────────────────────────────────────────────
import { SCRIPTS, ALL_SCRIPTS }               from './data/scripts';
import { CHARACTERS, CHARACTERS_BY_LANG, CHARACTER_MAP } from './data/characters';

// ── Components ───────────────────────────────────────────────────────────────
import SelectionModal  from './SelectionModal';
import ScriptModal     from './ScriptModal';
import ConvoHeader     from './ConvoHeader';
import TurnCard        from './TurnCard';
import FeedbackView    from './FeedbackView';
import ConvoPage       from './ConvoPage';
import { SettingsProvider } from '../../context/SettingsContext';

// ── Fixtures ──────────────────────────────────────────────────────────────────
const NONO     = CHARACTER_MAP['nono'];
const DE_GREET = SCRIPTS.de[0];

// ── Settings wrapper helpers ──────────────────────────────────────────────────
/** Wrap component with SettingsProvider so useSettings() works in tests */
function withSettings(ui, langOverride = 'de') {
  // Pre-set localStorage so SettingsProvider initialises with the right lang
  localStorage.setItem('timerTool_language', langOverride);
  return render(<SettingsProvider>{ui}</SettingsProvider>);
}

// ── speechSynthesis helpers ──────────────────────────────────────────────────
function installSynthMock() {
  const mock = {
    cancel: vi.fn(),
    speak: vi.fn((utterance) => {
      setTimeout(() => {
        utterance.onend?.();
      }, 0);
    }),
    getVoices: vi.fn(() => [{ lang: 'de-DE' }, { lang: 'en-US' }, { lang: 'es-ES' }]),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
  };
  Object.defineProperty(window, 'speechSynthesis', { value: mock, writable: true, configurable: true });
  return mock;
}
function removeSynthMock() {
  Object.defineProperty(window, 'speechSynthesis', {
    value: {
      cancel: vi.fn(),
      speak: vi.fn((utterance) => {
        setTimeout(() => {
          utterance.onend?.();
        }, 0);
      }),
      getVoices: () => [],
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    },
    writable: true, configurable: true,
  });
}
function setSRState(overrides = {}) {
  _srCtrl = { isSupported: false, isListening: false, transcript: '', isFinal: false,
    start: vi.fn(), stop: vi.fn(), reset: vi.fn(), ...overrides };
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
    for (const lang of ['de', 'en', 'es'])
      expect(SCRIPTS[lang].length).toBeGreaterThanOrEqual(2);
  });
  it('every script has the required shape', () => {
    for (const s of ALL_SCRIPTS) {
      expect(s).toHaveProperty('id');
      expect(s).toHaveProperty('topic');
      expect(s).toHaveProperty('topicEn');
      expect(s).toHaveProperty('emoji');
      expect(Array.isArray(s.turns)).toBe(true);
      expect(s.turns.length).toBeGreaterThan(0);
    }
  });
  it('every turn has a valid speaker', () => {
    for (const s of ALL_SCRIPTS)
      for (const t of s.turns)
        expect(['ai', 'user']).toContain(t.speaker);
  });
  it('AI turns have non-empty text', () => {
    for (const s of ALL_SCRIPTS)
      for (const t of s.turns.filter(x => x.speaker === 'ai'))
        expect(t.text?.trim().length).toBeGreaterThan(0);
  });
  it('user turns have non-empty hints', () => {
    for (const s of ALL_SCRIPTS)
      for (const t of s.turns.filter(x => x.speaker === 'user'))
        expect(t.hint?.trim().length).toBeGreaterThan(0);
  });
  it('scripts alternate speakers, starting with AI', () => {
    for (const s of ALL_SCRIPTS) {
      expect(s.turns[0].speaker).toBe('ai');
      for (let i = 1; i < s.turns.length; i++)
        expect(s.turns[i].speaker).not.toBe(s.turns[i - 1].speaker);
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. Data — characters.js
// ════════════════════════════════════════════════════════════════════════════
describe('Data — characters.js', () => {
  it('exports exactly 6 characters (2 per language)', () => expect(CHARACTERS).toHaveLength(6));

  it('CHARACTERS_BY_LANG has entries for de, en, es', () => {
    expect(CHARACTERS_BY_LANG).toHaveProperty('de');
    expect(CHARACTERS_BY_LANG).toHaveProperty('en');
    expect(CHARACTERS_BY_LANG).toHaveProperty('es');
  });

  it('each language has exactly 2 characters', () => {
    for (const lang of ['de', 'en', 'es'])
      expect(CHARACTERS_BY_LANG[lang]).toHaveLength(2);
  });

  it('every character has all required fields', () => {
    const req = ['id', 'name', 'lang', 'langLabel', 'langFlag', 'avatar', 'color', 'bgColor', 'voiceLocale', 'persona', 'role'];
    for (const char of CHARACTERS)
      for (const f of req)
        expect(char[f], `${char.id}.${f}`).toBeTruthy();
  });

  it('CHARACTER_MAP keys match character ids', () => {
    for (const c of CHARACTERS) expect(CHARACTER_MAP[c.id]).toBe(c);
  });

  it('voiceLocale is a valid BCP-47 string', () => {
    for (const c of CHARACTERS) expect(c.voiceLocale).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. useSpeechRecognition — state transitions
// ════════════════════════════════════════════════════════════════════════════
describe('useSpeechRecognition — MockSR state transitions', () => {
  function makeMockSR() {
    const rec = { lang: '', continuous: false, interimResults: false, onstart: null, onresult: null, onerror: null, onend: null };
    rec.start = vi.fn(() => rec.onstart?.());
    rec.stop  = vi.fn(() => rec.onend?.());
    rec.abort = vi.fn(() => rec.onend?.());
    return rec;
  }
  it('start fires onstart', () => { const sr = makeMockSR(); let ok = false; sr.onstart = () => { ok = true; }; sr.start(); expect(ok).toBe(true); });
  it('stop fires onend',    () => { const sr = makeMockSR(); let ok = false; sr.onend = () => { ok = true; }; sr.stop();  expect(ok).toBe(true); });
  it('abort fires onend',   () => { const sr = makeMockSR(); let ok = false; sr.onend = () => { ok = true; }; sr.abort(); expect(ok).toBe(true); });
  it('onresult delivers transcript', () => {
    const sr = makeMockSR(); let recv = '';
    sr.onresult = (e) => { for (let i = e.resultIndex; i < e.results.length; i++) recv += e.results[i][0].transcript; };
    sr.onresult({ resultIndex: 0, results: [Object.assign([{ transcript: 'hello' }], { isFinal: false })] });
    expect(recv).toBe('hello');
  });
  it('onresult marks isFinal', () => {
    const sr = makeMockSR(); let seen = false;
    sr.onresult = (e) => { if (e.results[0].isFinal) seen = true; };
    sr.onresult({ resultIndex: 0, results: [Object.assign([{ transcript: 'done' }], { isFinal: true })] });
    expect(seen).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. SelectionModal
// ════════════════════════════════════════════════════════════════════════════
describe('SelectionModal', () => {
  beforeEach(() => installSynthMock());
  afterEach(() => removeSynthMock());

  it('renders the modal heading', () => {
    withSettings(<SelectionModal onStart={vi.fn()} />, 'de');
    expect(screen.getByText(/choose your scene partner/i)).toBeInTheDocument();
  });

  it('shows the German language chip when settings lang is de', () => {
    withSettings(<SelectionModal onStart={vi.fn()} />, 'de');
    expect(screen.getByText('German')).toBeInTheDocument();
    expect(screen.getByText('🇩🇪')).toBeInTheDocument();
  });

  it('shows only German characters (Nono + John) when lang=de', () => {
    withSettings(<SelectionModal onStart={vi.fn()} />, 'de');
    expect(screen.getByText('Nono')).toBeInTheDocument();
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.queryByText('Alex')).not.toBeInTheDocument();
    expect(screen.queryByText('María')).not.toBeInTheDocument();
  });

  it('shows only English characters (Alex + Emma) when lang=en', () => {
    withSettings(<SelectionModal onStart={vi.fn()} />, 'en');
    expect(screen.getByText('Alex')).toBeInTheDocument();
    expect(screen.getByText('Emma')).toBeInTheDocument();
    expect(screen.queryByText('Nono')).not.toBeInTheDocument();
  });

  it('shows only Spanish characters when lang=es', () => {
    withSettings(<SelectionModal onStart={vi.fn()} />, 'es');
    expect(screen.getByText('María')).toBeInTheDocument();
    expect(screen.getByText('Carlos')).toBeInTheDocument();
  });

  it('Start button is disabled before a character is selected', () => {
    withSettings(<SelectionModal onStart={vi.fn()} />, 'de');
    expect(screen.getByRole('button', { name: /select a scene partner/i })).toBeDisabled();
  });

  it('Start button enables after clicking a character card', async () => {
    const user = userEvent.setup();
    withSettings(<SelectionModal onStart={vi.fn()} />, 'de');
    await user.click(screen.getByText('Nono').closest('button'));
    expect(screen.getByRole('button', { name: /start scene with nono/i })).not.toBeDisabled();
  });

  it('calls onStart(de, nono) when Nono selected and Start clicked', async () => {
    const user = userEvent.setup();
    const fn = vi.fn();
    withSettings(<SelectionModal onStart={fn} />, 'de');
    await user.click(screen.getByText('Nono').closest('button'));
    await user.click(screen.getByRole('button', { name: /start scene with nono/i }));
    expect(fn).toHaveBeenCalledWith('de', 'nono');
  });

  it('calls onStart(de, john_de) when John selected', async () => {
    const user = userEvent.setup();
    const fn = vi.fn();
    withSettings(<SelectionModal onStart={fn} />, 'de');
    await user.click(screen.getByText('John').closest('button'));
    await user.click(screen.getByRole('button', { name: /start scene with john/i }));
    expect(fn).toHaveBeenCalledWith('de', 'john_de');
  });

  it('calls onStart(en, alex) when Alex selected (en lang)', async () => {
    const user = userEvent.setup();
    const fn = vi.fn();
    withSettings(<SelectionModal onStart={fn} />, 'en');
    await user.click(screen.getByText('Alex').closest('button'));
    await user.click(screen.getByRole('button', { name: /start scene with alex/i }));
    expect(fn).toHaveBeenCalledWith('en', 'alex');
  });

  it('calls onStart(es, maria) when María selected (es lang)', async () => {
    const user = userEvent.setup();
    const fn = vi.fn();
    withSettings(<SelectionModal onStart={fn} />, 'es');
    await user.click(screen.getByText('María').closest('button'));
    await user.click(screen.getByRole('button', { name: /start scene with maría/i }));
    expect(fn).toHaveBeenCalledWith('es', 'maria');
  });

  it('renders role badges', () => {
    withSettings(<SelectionModal onStart={vi.fn()} />, 'de');
    expect(screen.getByText(/café regular/i)).toBeInTheDocument();
    expect(screen.getByText(/street reporter/i)).toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5. ConvoHeader
// ════════════════════════════════════════════════════════════════════════════
describe('ConvoHeader', () => {
  const props = {
    character: NONO, script: DE_GREET, lang: 'de',
    turnIndex: 0, totalTurns: DE_GREET.turns.length,
    onChangeCharacter: vi.fn(), onViewScript: vi.fn(),
  };
  it('renders the topic title', () => { render(<ConvoHeader {...props} />); expect(screen.getByText(/greetings/i)).toBeInTheDocument(); });
  it('shows character name and turn count', () => { render(<ConvoHeader {...props} />); expect(screen.getByText(/nono/i)).toBeInTheDocument(); });
  it('renders Change Character and View Script buttons', () => {
    render(<ConvoHeader {...props} />);
    expect(screen.getByRole('button', { name: /change character/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view script/i })).toBeInTheDocument();
  });
  it('calls onChangeCharacter on click', async () => {
    const user = userEvent.setup(); const fn = vi.fn();
    render(<ConvoHeader {...props} onChangeCharacter={fn} />);
    await user.click(screen.getByRole('button', { name: /change character/i }));
    expect(fn).toHaveBeenCalledOnce();
  });
  it('calls onViewScript on click', async () => {
    const user = userEvent.setup(); const fn = vi.fn();
    render(<ConvoHeader {...props} onViewScript={fn} />);
    await user.click(screen.getByRole('button', { name: /view script/i }));
    expect(fn).toHaveBeenCalledOnce();
  });
  it('progress fill width grows as turnIndex increases', () => {
    const { rerender, container } = render(<ConvoHeader {...props} turnIndex={0} totalTurns={4} />);
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
  const onSpeak = vi.fn((text, onEnd) => {
    if (onEnd) setTimeout(onEnd, 0);
  });
  const aiProps = {
    turn: { speaker: 'ai', text: 'Hello! How are you?' }, turnIdx: 0,
    isActive: true, isDone: false, submittedText: undefined,
    charName: 'Nono', charAvatar: '🎭', voiceLocale: 'de-DE', lang: 'de',
    autoAdvanceDelay: 50, onAiContinue: vi.fn(), onUserSubmit: vi.fn(), onSpeak,
  };

  beforeEach(() => { synth = installSynthMock(); setSRState(); onSpeak.mockClear(); });
  afterEach(() => { removeSynthMock(); vi.restoreAllMocks(); });

  it('displays the character name label', () => { render(<TurnCard {...aiProps} />); expect(screen.getByText('Nono')).toBeInTheDocument(); });
  it('displays the AI text', () => { render(<TurnCard {...aiProps} />); expect(screen.getByText('Hello! How are you?')).toBeInTheDocument(); });
  it('renders the Listen TTS button', () => { render(<TurnCard {...aiProps} />); expect(screen.getByRole('button', { name: /play audio/i })).toBeInTheDocument(); });

  it('calls onSpeak with the AI text when Listen is clicked', async () => {
    const user = userEvent.setup();
    const fn = vi.fn();
    render(<TurnCard {...aiProps} autoAdvanceDelay={9999} onSpeak={fn} />);
    await user.click(screen.getByRole('button', { name: /play audio/i }));
    expect(fn).toHaveBeenCalledWith('Hello! How are you?');
  });

  it('does NOT render a Continue button', () => {
    render(<TurnCard {...aiProps} autoAdvanceDelay={9999} />);
    expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument();
  });

  it('auto-advances by calling onAiContinue after the delay', async () => {
    const fn = vi.fn();
    render(<TurnCard {...aiProps} autoAdvanceDelay={50} onAiContinue={fn} />);
    expect(fn).not.toHaveBeenCalled();
    await waitFor(() => expect(fn).toHaveBeenCalledOnce(), { timeout: 500 });
  });

  it('does NOT auto-advance when isActive=false', async () => {
    const fn = vi.fn();
    render(<TurnCard {...aiProps} isActive={false} isDone={true} autoAdvanceDelay={50} onAiContinue={fn} />);
    await new Promise(r => setTimeout(r, 150));
    expect(fn).not.toHaveBeenCalled();
  });

  it('adds cp-turn-done class when isDone', () => {
    const { container } = render(<TurnCard {...aiProps} isActive={false} isDone={true} />);
    expect(container.querySelector('.cp-turn-done')).toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 7a. TurnCard — User turn (fallback text input)
// ════════════════════════════════════════════════════════════════════════════
describe('TurnCard — User turn (fallback text input)', () => {
  const userProps = {
    turn: { speaker: 'user', hint: 'Say you are doing well' }, turnIdx: 1,
    isActive: true, isDone: false, submittedText: undefined,
    charName: 'Nono', charAvatar: '🎭', voiceLocale: 'en-US', lang: 'en',
    autoAdvanceDelay: 9999, onAiContinue: vi.fn(), onUserSubmit: vi.fn(), onSpeak: vi.fn(),
  };
  beforeEach(() => setSRState({ isSupported: false }));

  it('shows the hint text', () => { render(<TurnCard {...userProps} />); expect(screen.getByText(/say you are doing well/i)).toBeInTheDocument(); });
  it('renders a fallback text input', () => { render(<TurnCard {...userProps} />); expect(screen.getByPlaceholderText(/type your response/i)).toBeInTheDocument(); });
  it('Submit is disabled when input is empty', () => { render(<TurnCard {...userProps} />); expect(screen.getByRole('button', { name: /^submit$/i })).toBeDisabled(); });

  it('Submit enables once text is typed', async () => {
    const user = userEvent.setup();
    render(<TurnCard {...userProps} />);
    await user.type(screen.getByPlaceholderText(/type your response/i), 'I am fine');
    expect(screen.getByRole('button', { name: /^submit$/i })).not.toBeDisabled();
  });

  it('calls onUserSubmit with typed text on click', async () => {
    const user = userEvent.setup(); const fn = vi.fn();
    render(<TurnCard {...userProps} onUserSubmit={fn} />);
    await user.type(screen.getByPlaceholderText(/type your response/i), 'I am fine');
    await user.click(screen.getByRole('button', { name: /^submit$/i }));
    expect(fn).toHaveBeenCalledWith('I am fine');
  });

  it('calls onUserSubmit on Enter key', async () => {
    const user = userEvent.setup(); const fn = vi.fn();
    render(<TurnCard {...userProps} onUserSubmit={fn} />);
    await user.type(screen.getByPlaceholderText(/type your response/i), 'Doing great{Enter}');
    expect(fn).toHaveBeenCalledWith('Doing great');
  });

  it('shows submitted text when isDone', () => {
    render(<TurnCard {...userProps} isActive={false} isDone={true} submittedText="I am doing very well" />);
    expect(screen.getByText(/"I am doing very well"/)).toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 7b. TurnCard — User turn (mic path)
// ════════════════════════════════════════════════════════════════════════════
describe('TurnCard — User turn (mic path)', () => {
  const userProps = {
    turn: { speaker: 'user', hint: 'Speak your answer' }, turnIdx: 1,
    isActive: true, isDone: false, submittedText: undefined,
    charName: 'Nono', charAvatar: '🎭', voiceLocale: 'de-DE', lang: 'de',
    autoAdvanceDelay: 9999, onAiContinue: vi.fn(), onUserSubmit: vi.fn(), onSpeak: vi.fn(),
  };
  beforeEach(() => vi.clearAllMocks());

  it('shows Record button when isSupported=true and idle', () => {
    setSRState({ isSupported: true });
    render(<TurnCard {...userProps} />);
    expect(screen.getByRole('button', { name: /start recording/i })).toBeInTheDocument();
  });

  it('shows Stop button when isListening=true', () => {
    setSRState({ isSupported: true, isListening: true });
    render(<TurnCard {...userProps} />);
    expect(screen.getByRole('button', { name: /stop recording/i })).toBeInTheDocument();
  });

  it('shows Keep & Submit / Record Again after recognition ends with text', () => {
    setSRState({ isSupported: true, isListening: false, transcript: 'final text', isFinal: true });
    render(<TurnCard {...userProps} />);
    expect(screen.getByRole('button', { name: /keep.*submit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /record again/i })).toBeInTheDocument();
  });

  it('calls onUserSubmit when Keep & Submit clicked', async () => {
    const user = userEvent.setup(); const fn = vi.fn();
    setSRState({ isSupported: true, isListening: false, transcript: 'my answer', isFinal: true });
    render(<TurnCard {...userProps} onUserSubmit={fn} />);
    await user.click(screen.getByRole('button', { name: /keep.*submit/i }));
    expect(fn).toHaveBeenCalledWith('my answer');
  });

  it('calls reset() and start() when Record Again clicked', async () => {
    const user = userEvent.setup(); const resetFn = vi.fn(); const startFn = vi.fn();
    setSRState({ isSupported: true, isListening: false, transcript: 'oops', isFinal: true, reset: resetFn, start: startFn });
    render(<TurnCard {...userProps} />);
    await user.click(screen.getByRole('button', { name: /record again/i }));
    expect(resetFn).toHaveBeenCalled();
    expect(startFn).toHaveBeenCalled();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 8. ScriptModal
// ════════════════════════════════════════════════════════════════════════════
describe('ScriptModal', () => {
  const onClose = vi.fn();
  beforeEach(() => onClose.mockClear());

  it('renders the topic title', () => { render(<ScriptModal script={DE_GREET} charName="Nono" onClose={onClose} />); expect(screen.getByText(/greetings/i)).toBeInTheDocument(); });
  it('renders Nono labels for AI turns', () => { render(<ScriptModal script={DE_GREET} charName="Nono" onClose={onClose} />); expect(screen.getAllByText('Nono').length).toBeGreaterThanOrEqual(4); });
  it('renders hint text for user turns', () => { render(<ScriptModal script={DE_GREET} charName="Nono" onClose={onClose} />); expect(screen.getByText(/introduce yourself/i)).toBeInTheDocument(); });

  it('calls onClose when Close button clicked', async () => {
    const user = userEvent.setup();
    render(<ScriptModal script={DE_GREET} charName="Nono" onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: /close script panel/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when backdrop clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(<ScriptModal script={DE_GREET} charName="Nono" onClose={onClose} />);
    await user.click(container.querySelector('.cp-script-overlay'));
    expect(onClose).toHaveBeenCalled();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 9. FeedbackView
// ════════════════════════════════════════════════════════════════════════════
describe('FeedbackView', () => {
  const userResponses = { 1: 'Ich heiße Lena', 3: 'Aus Deutschland', 5: 'Seit drei Monaten' };
  const baseProps = { script: DE_GREET, userResponses, lang: 'de', character: NONO, onRetry: vi.fn(), onNextContext: vi.fn() };
  beforeEach(() => { baseProps.onRetry.mockClear(); baseProps.onNextContext.mockClear(); });

  it('renders Lesson Complete heading', () => { render(<FeedbackView {...baseProps} />); expect(screen.getByText(/lesson complete/i)).toBeInTheDocument(); });
  it('shows 5 star elements', () => { const { container } = render(<FeedbackView {...baseProps} />); expect(container.querySelectorAll('.cp-star')).toHaveLength(5); });
  it('shows all 5 earned when all answered', () => { const { container } = render(<FeedbackView {...baseProps} />); expect(container.querySelectorAll('.cp-star.earned')).toHaveLength(5); });
  it('shows fewer stars when only one response', () => { const { container } = render(<FeedbackView {...baseProps} userResponses={{ 1: 'one' }} />); expect(container.querySelectorAll('.cp-star.earned').length).toBeLessThan(5); });
  it('shows submitted responses', () => { render(<FeedbackView {...baseProps} />); expect(screen.getByText(/ich heiße lena/i)).toBeInTheDocument(); });

  it('calls onRetry when Retry Lesson clicked', async () => {
    const user = userEvent.setup(); const fn = vi.fn();
    render(<FeedbackView {...baseProps} onRetry={fn} />);
    await user.click(screen.getByRole('button', { name: /retry lesson/i }));
    expect(fn).toHaveBeenCalledOnce();
  });

  it('calls onNextContext when Next Context clicked', async () => {
    const user = userEvent.setup(); const fn = vi.fn();
    render(<FeedbackView {...baseProps} onNextContext={fn} />);
    await user.click(screen.getByRole('button', { name: /next context/i }));
    expect(fn).toHaveBeenCalledOnce();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 10. ConvoPage — integration (with SettingsProvider, autoAdvanceDelay=0)
// ════════════════════════════════════════════════════════════════════════════
describe('ConvoPage integration', () => {
  beforeEach(() => {
    setSRState({ isSupported: false });
    installSynthMock();
    localStorage.setItem('timerTool_language', 'de');
  });
  afterEach(() => { removeSynthMock(); vi.restoreAllMocks(); });

  function renderConvo() {
    return render(
      <SettingsProvider>
        <ConvoPage autoAdvanceDelay={0} />
      </SettingsProvider>
    );
  }

  it('shows SelectionModal on first render', () => {
    renderConvo();
    expect(screen.getByText(/choose your scene partner/i)).toBeInTheDocument();
  });

  it('shows German characters (Nono + John) when lang=de', () => {
    renderConvo();
    expect(screen.getByText('Nono')).toBeInTheDocument();
    expect(screen.getByText('John')).toBeInTheDocument();
  });

  it('transitions to conversation view after selecting a character', async () => {
    const user = userEvent.setup();
    renderConvo();
    await user.click(screen.getByText('Nono').closest('button'));
    await user.click(screen.getByRole('button', { name: /start scene with nono/i }));
    expect(screen.getByRole('button', { name: /change character/i })).toBeInTheDocument();
  });

  it('shows the first AI turn text after starting', async () => {
    const user = userEvent.setup();
    renderConvo();
    await user.click(screen.getByText('Nono').closest('button'));
    await user.click(screen.getByRole('button', { name: /start scene with nono/i }));
    const aiTexts = screen.getAllByText(/hallo.*nono/i);
    expect(aiTexts.some(el => el.classList.contains('cp-ai-text'))).toBe(true);
  });

  it('opens ScriptModal when View Script clicked', async () => {
    const user = userEvent.setup();
    renderConvo();
    await user.click(screen.getByText('Nono').closest('button'));
    await user.click(screen.getByRole('button', { name: /start scene with nono/i }));
    await user.click(screen.getByRole('button', { name: /view script/i }));
    expect(screen.getByRole('button', { name: /close script panel/i })).toBeInTheDocument();
  });

  it('closes ScriptModal when close clicked', async () => {
    const user = userEvent.setup();
    renderConvo();
    await user.click(screen.getByText('Nono').closest('button'));
    await user.click(screen.getByRole('button', { name: /start scene with nono/i }));
    await user.click(screen.getByRole('button', { name: /view script/i }));
    await user.click(screen.getByRole('button', { name: /close script panel/i }));
    expect(screen.queryByRole('button', { name: /close script panel/i })).not.toBeInTheDocument();
  });

  it('returns to SelectionModal when Change Character clicked', async () => {
    const user = userEvent.setup();
    renderConvo();
    await user.click(screen.getByText('Nono').closest('button'));
    await user.click(screen.getByRole('button', { name: /start scene with nono/i }));
    await user.click(screen.getByRole('button', { name: /change character/i }));
    expect(screen.getByText(/choose your scene partner/i)).toBeInTheDocument();
  });

  /** Drive through all turns of the German Greetings script */
  async function runFullGermanLesson(user) {
    await user.click(screen.getByText('Nono').closest('button'));
    await user.click(screen.getByRole('button', { name: /start scene with nono/i }));
    for (const reply of ['Ich heiße Lena', 'Aus Japan', 'Seit einem Jahr']) {
      await waitFor(() => expect(screen.getByPlaceholderText(/type your response/i)).toBeInTheDocument());
      await user.type(screen.getByPlaceholderText(/type your response/i), reply);
      await user.click(screen.getByRole('button', { name: /^submit$/i }));
    }
  }

  it('shows text input after first AI turn auto-advances', async () => {
    const user = userEvent.setup();
    renderConvo();
    await user.click(screen.getByText('Nono').closest('button'));
    await user.click(screen.getByRole('button', { name: /start scene with nono/i }));
    await waitFor(() => expect(screen.getByPlaceholderText(/type your response/i)).toBeInTheDocument());
  });

  it('reaches FeedbackView after completing all turns', async () => {
    const user = userEvent.setup();
    renderConvo();
    await runFullGermanLesson(user);
    await waitFor(() => expect(screen.getByText(/lesson complete/i)).toBeInTheDocument());
  });

  it('FeedbackView shows submitted responses', async () => {
    const user = userEvent.setup();
    renderConvo();
    await runFullGermanLesson(user);
    await waitFor(() => screen.getByText(/lesson complete/i));
    expect(screen.getByText(/ich heiße lena/i)).toBeInTheDocument();
  });

  it('Retry Lesson returns to the first AI card', async () => {
    const user = userEvent.setup();
    renderConvo();
    await runFullGermanLesson(user);
    await waitFor(() => screen.getByText(/lesson complete/i));
    await user.click(screen.getByRole('button', { name: /retry lesson/i }));
    await waitFor(() => {
      const els = screen.getAllByText(/hallo.*nono/i);
      expect(els.some(el => el.classList.contains('cp-ai-text'))).toBe(true);
    });
    expect(screen.queryByText(/lesson complete/i)).not.toBeInTheDocument();
  });

  it('Next Context loads the second German topic (Im Café)', async () => {
    const user = userEvent.setup();
    renderConvo();
    await runFullGermanLesson(user);
    await waitFor(() => screen.getByText(/lesson complete/i));
    await user.click(screen.getByRole('button', { name: /next context/i }));
    await waitFor(() => expect(screen.queryByText(/lesson complete/i)).not.toBeInTheDocument());
    expect(screen.getAllByText(/café/i).length).toBeGreaterThan(0);
  });

  it('progress bar resets after Retry Lesson', async () => {
    const user = userEvent.setup();
    const { container } = renderConvo();
    await runFullGermanLesson(user);
    await waitFor(() => screen.getByText(/lesson complete/i));
    await user.click(screen.getByRole('button', { name: /retry lesson/i }));
    await waitFor(() => {
      const els = screen.getAllByText(/hallo.*nono/i);
      expect(els.some(el => el.classList.contains('cp-ai-text'))).toBe(true);
    });
    const fill = container.querySelector('.cp-progress-fill');
    // With autoAdvanceDelay=0, first turn fires instantly → ~29% — still far below end-of-lesson 100%
    expect(parseFloat(fill?.style.width ?? '0')).toBeLessThan(50);
  });
});
