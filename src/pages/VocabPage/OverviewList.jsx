import { VocabImage } from './VocabComponents'

/**
 * OverviewList — responsive grid showing all vocabulary items.
 * Clicking an item switches to FocusView at that index.
 *
 * @param {object[]} items         - full vocabulary deck
 * @param {string}   lang          - active language code
 * @param {number}   activeIndex   - currently active card index (for visual highlight)
 * @param {Function} onSelectItem  - callback(index) to jump to FocusView
 */
export default function OverviewList({ items, lang, activeIndex, onSelectItem }) {
  return (
    <section className="overview-view" aria-label="Vocabulary overview grid">
      <h2 className="overview-heading">
        All words · {items.length} items
      </h2>

      <div
        className="overview-grid"
        role="list"
      >
        {items.map((item, i) => {
          const label = item.translations[lang].singular
          const isActive = i === activeIndex

          return (
            <article
              key={item.id}
              role="listitem"
              className="overview-item"
              style={{
                animationDelay: `${i * 40}ms`,
                outline: isActive ? '2px solid var(--vocab-accent)' : 'none',
              }}
              onClick={() => onSelectItem(i)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelectItem(i)
                }
              }}
              aria-label={`${label} — open focus card`}
            >
              <VocabImage
                src={item.imageUrl}
                alt={label}
                className="overview-item-image"
                placeholderClass="overview-item-img-placeholder"
                emoji="🖼️"
              />
              <div className="overview-item-label">
                <span>{label}</span>
                <span className="overview-item-arrow" aria-hidden="true">›</span>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
