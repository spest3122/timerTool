# Project Rules

## Environment

- This project requires **Node.js v22+**. The exact version is pinned in `.nvmrc`.
- Before running any command (`npm install`, `npm run dev`, `vitest`, etc.), check if `nvm` is available and switch to the correct version:
  ```bash
  export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && nvm use
  ```
- If `nvm use` fails (version not installed), run `nvm install` first, then `nvm use`.
- Always verify the active Node version with `node -v` before proceeding.

## Tech Stack

- **Framework**: React 19 (with JSX) + React Router 7 (hash-based routing for GitHub Pages)
- **Bundler**: Vite 8
- **Testing**: Vitest 4 + @testing-library/react 16 + jsdom
- **Styling**: Vanilla CSS with CSS custom properties (design tokens defined in `src/index.css`)
- **Icons**: lucide-react (ConvoPage), inline SVG components elsewhere
- **Deployment**: GitHub Pages via `gh-pages` package (`npm run deploy`)
- **Base path**: `/timerTool/` (configured in `vite.config.js`)

## Project Structure

```
src/
├── main.jsx              ← Entry point & router config
├── App.jsx               ← Shell layout (NavSidebar, BottomNav, SettingsDrawer, Outlet)
├── index.css             ← Global design tokens & resets
├── App.css               ← Shell layout styles
├── context/
│   └── SettingsContext.jsx  ← Language, voice, TTS (shared across all pages)
├── components/
│   ├── NavSidebar/       ← Desktop left sidebar nav
│   ├── BottomNav/        ← Mobile bottom tab bar
│   └── SettingsDrawer/   ← Language/voice settings drawer
├── pages/
│   ├── TimerPage/        ← Analog clock with drag-to-set, Date & Season panel
│   ├── QuizPage/         ← Fill-in-the-blank grammar quiz
│   ├── SpeakerPage/      ← Text-to-speech reader with speech recognition
│   ├── VocabPage/        ← Vocabulary flashcard trainer
│   ├── RecorderPage/     ← Audio recorder with WAV export & IndexedDB history
│   └── ConvoPage/        ← Conversation practice with AI tutor characters
├── data/
│   └── vocabularyData.js ← Vocabulary items with en/de/es translations
└── utils/
    ├── timeLanguage.js   ← Number-to-word spelling & time phrases (DE/EN/ES)
    └── quizLogic.js      ← Spaced Repetition System (currently unused)
```

## Coding Conventions

- Use **functional components** with hooks. No class components.
- Use CSS custom properties from `src/index.css` for all colors, spacing, radii, and shadows. Never hardcode design values.
- Each page/component lives in its own directory: `ComponentName/ComponentName.jsx` + `ComponentName.css` + optional `ComponentName.test.jsx`.
- Keep components under ~250 lines. If a component grows larger, extract sub-components or custom hooks.
- Use `useRef` for imperative DOM access. Never use `document.getElementById` or `document.querySelector` inside React components.
- Data (quiz questions, vocabulary, etc.) belongs in `src/data/`, not inside component files.
- All user-visible text related to language learning should support the three languages: German (`de`), English (`en`), and Spanish (`es`).

## Testing

- Run tests with: `npm test` (watch mode) or `npx vitest run` (single run).
- Run coverage with: `npm run coverage`.
- Always run tests after making changes to verify correctness and catch regressions.
- Test files live next to the code they test: `Component.test.jsx` or `util.test.js`.
- Use `@testing-library/react` for component tests. Prefer `screen.getByRole`, `screen.getByLabelText`, and `screen.getByText` queries over test IDs.
- Mock browser APIs (SpeechSynthesis, SpeechRecognition, AudioContext, IndexedDB) in tests as needed.

## Deployment

- The app is deployed to GitHub Pages at: `https://spest3122.github.io/timerTool/`
- Uses `createHashRouter` (hash-based routing) because GitHub Pages doesn't support SPA fallback.
- Build with `npm run build`, deploy with `npm run deploy`.
- The `base` path in `vite.config.js` is set to `/timerTool/`.

## Design System

- The full design system spec is documented in `DESIGN.md`.
- Design tokens (colors, typography, spacing, shadows, border-radius) are defined in `src/index.css` as CSS custom properties.
- Follow the Notion-inspired aesthetic: clean surfaces, subtle shadows, Inter font family.
- Use the `--primary`, `--brand-*`, and `--card-tint-*` palettes. Don't introduce new colors without adding them to the design tokens first.

## Key Gotchas

- `index.js` in the project root is **legacy dead code** from before the React rewrite — do not use or reference it.
- `quizLogic.js` contains an SRS system that is **not wired to any component** yet.
- `BottomNav` has the Quiz link **commented out** — mobile users can't reach the Quiz page from the bottom nav.
- `vocabularyData.js` mixes Unsplash URLs and local image imports — be aware of the inconsistency.
- The `SettingsContext` dispatches a `CustomEvent('convo-tts-play')` that only ConvoPage listens to.
