/**
 * AI character definitions — scene partners, grouped by language.
 *
 * Each language has ≥ 2 characters so the user can choose who to practise
 * with after the app language is already set in Settings.
 *
 * @typedef {Object} Character
 * @property {string} id          - Unique identifier
 * @property {string} name        - Display name
 * @property {string} lang        - Language code: 'de' | 'en' | 'es'
 * @property {string} langLabel   - Human-readable language name
 * @property {string} langFlag    - Flag emoji
 * @property {string} avatar      - Avatar emoji
 * @property {string} color       - CSS accent colour
 * @property {string} bgColor     - CSS background tint
 * @property {string} voiceLocale - BCP-47 locale for SpeechSynthesis & SpeechRecognition
 * @property {string} role        - Scene archetype shown as a badge
 * @property {string} persona     - Short blurb shown in the selection card
 */

export const CHARACTERS_BY_LANG = {
  /* ─── German ─────────────────────────────────────────────── */
  de: [
    {
      id: 'nono',
      name: 'Nono',
      lang: 'de',
      langLabel: 'German',
      langFlag: '🇩🇪',
      avatar: '🎭',
      color: '#1565c0',
      bgColor: '#e3f2fd',
      voiceLocale: 'de-DE',
      role: 'Café regular',
      persona: 'A chatty Berlin local who loves coffee and small talk. Plays everyday scenes in fluent German.',
    },
    {
      id: 'john_de',
      name: 'John',
      lang: 'de',
      langLabel: 'German',
      langFlag: '🇩🇪',
      avatar: '🗞️',
      color: '#2e7d32',
      bgColor: '#f0fdf4',
      voiceLocale: 'de-DE',
      role: 'Street reporter',
      persona: 'A curious Hamburg journalist always looking for a story. Asks sharp questions in natural German.',
    },
  ],

  /* ─── English ─────────────────────────────────────────────── */
  en: [
    {
      id: 'alex',
      name: 'Alex',
      lang: 'en',
      langLabel: 'English',
      langFlag: '🇬🇧',
      avatar: '🎬',
      color: '#6a1b9a',
      bgColor: '#f3e5f5',
      voiceLocale: 'en-US',
      role: 'Office colleague',
      persona: 'A friendly London professional. Acts out workplace and social situations in natural English.',
    },
    {
      id: 'emma',
      name: 'Emma',
      lang: 'en',
      langLabel: 'English',
      langFlag: '🇬🇧',
      avatar: '☕',
      color: '#ad1457',
      bgColor: '#fce4ec',
      voiceLocale: 'en-GB',
      role: 'Barista',
      persona: 'A warm Edinburgh barista who chats with everyone. Makes everyday English conversations feel natural.',
    },
  ],

  /* ─── Spanish ─────────────────────────────────────────────── */
  es: [
    {
      id: 'maria',
      name: 'María',
      lang: 'es',
      langLabel: 'Spanish',
      langFlag: '🇪🇸',
      avatar: '🌟',
      color: '#e65100',
      bgColor: '#fff3e0',
      voiceLocale: 'es-ES',
      role: 'Market vendor',
      persona: 'A lively Madrid local full of warmth. Brings Spanish street life to life — one scene at a time.',
    },
    {
      id: 'carlos',
      name: 'Carlos',
      lang: 'es',
      langLabel: 'Spanish',
      langFlag: '🇪🇸',
      avatar: '🎸',
      color: '#00695c',
      bgColor: '#e0f2f1',
      voiceLocale: 'es-ES',
      role: 'Music teacher',
      persona: 'A laid-back Seville music teacher. Uses rhythm and repetition to make Spanish click.',
    },
  ],
};

/** Flat array of all characters (all languages) */
export const CHARACTERS = Object.values(CHARACTERS_BY_LANG).flat();

/** Quick lookup by character id */
export const CHARACTER_MAP = Object.fromEntries(CHARACTERS.map((c) => [c.id, c]));
