/**
 * AI character definitions.
 * Each character is paired with one target language.
 *
 * @typedef {Object} Character
 * @property {string} id            - Unique identifier
 * @property {string} name          - Display name
 * @property {string} lang          - Language code: 'de' | 'en' | 'es'
 * @property {string} langLabel     - Human-readable language name
 * @property {string} langFlag      - Flag emoji
 * @property {string} avatar        - Avatar emoji
 * @property {string} color         - CSS accent colour for this character
 * @property {string} voiceLocale   - BCP-47 locale for SpeechSynthesis & SpeechRecognition
 * @property {string} persona       - Short persona description shown in the modal
 */

export const CHARACTERS = [
  {
    id: 'nono',
    name: 'Nono',
    lang: 'de',
    langLabel: 'German',
    langFlag: '🇩🇪',
    avatar: '🧑‍🏫',
    color: '#1565c0',
    bgColor: '#e3f2fd',
    voiceLocale: 'de-DE',
    persona:
      'Friendly tutor from Berlin. Patient, encouraging, and loves explaining German grammar with real-world examples.',
  },
  {
    id: 'alex',
    name: 'Alex',
    lang: 'en',
    langLabel: 'English',
    langFlag: '🇬🇧',
    avatar: '🧑‍💼',
    color: '#6a1b9a',
    bgColor: '#f3e5f5',
    voiceLocale: 'en-US',
    persona:
      'Professional English coach from London. Clear, methodical, and great at building confidence through conversation.',
  },
  {
    id: 'maria',
    name: 'María',
    lang: 'es',
    langLabel: 'Spanish',
    langFlag: '🇪🇸',
    avatar: '👩‍🎓',
    color: '#e65100',
    bgColor: '#fff3e0',
    voiceLocale: 'es-ES',
    persona:
      'Warm and expressive Spanish teacher from Madrid. Makes every learner feel like a native speaker in the making.',
  },
];

/** Quick lookup by character id */
export const CHARACTER_MAP = Object.fromEntries(CHARACTERS.map((c) => [c.id, c]));
