import { VocabImage, SpeakButton } from './VocabComponents'

const ChevronLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const ChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

/**
 * FocusView — shows one vocabulary card at a time with
 * navigation arrows, pronunciation button, and dot indicators.
 *
 * Speech is handled entirely inside SpeakButton via SettingsContext —
 * no speak prop needed here.
 *
 * @param {object[]} items  - full vocabulary deck
 * @param {number}   index  - active card index
 * @param {string}   lang   - active language code ('en'|'de'|'es')
 * @param {Function} onPrev - go to previous card
 * @param {Function} onNext - go to next card
 * @param {Function} onDot  - jump to specific card index
 */
export default function FocusView({ items, index, lang, onPrev, onNext, onDot }) {
  const item        = items[index]
  const translation = item.translations[lang]
  const total       = items.length

  return (
    <section className="focus-view" aria-label="Vocabulary focus card">
      {/* Card counter */}
      <p className="focus-counter" aria-live="polite">
        {index + 1} / {total}
      </p>

      {/* Main learning card */}
      <article className="focus-card" key={item.id}>
        <VocabImage
          src={item.imageUrl}
          alt={translation.singular}
          className="focus-card-image"
          placeholderClass="focus-card-img-placeholder"
          emoji="🖼️"
        />

        <div className="focus-card-body">
          <div className="focus-word-row">
            <div className="focus-word-block">
              <div className="focus-word-label">Singular · Plural</div>
              <div className="focus-word-singular">{translation.singular}</div>
              <div className="focus-word-plural">
                pl. <strong>{translation.plural}</strong>
              </div>
            </div>

            {/* SpeakButton reads voice + lang from SettingsContext internally */}
            <SpeakButton
              text={`${translation.singular}. ${translation.plural}`}
            />
          </div>
        </div>
      </article>

      {/* Navigation */}
      <nav className="focus-nav" aria-label="Card navigation">
        <button
          id="vocabPrevBtn"
          className="focus-nav-btn"
          onClick={onPrev}
          aria-label="Previous card"
          title="Previous (← arrow key)"
        >
          <ChevronLeft />
        </button>

        <div className="focus-nav-dots" role="tablist" aria-label="Jump to card">
          {items.map((it, i) => (
            <button
              key={it.id}
              role="tab"
              aria-selected={i === index}
              aria-label={`Card ${i + 1}: ${it.translations[lang].singular}`}
              className={`focus-nav-dot${i === index ? ' active' : ''}`}
              onClick={() => onDot(i)}
            />
          ))}
        </div>

        <button
          id="vocabNextBtn"
          className="focus-nav-btn"
          onClick={onNext}
          aria-label="Next card"
          title="Next (→ arrow key)"
        >
          <ChevronRight />
        </button>
      </nav>
    </section>
  )
}
