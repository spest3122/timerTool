import { useSettings } from '../../context/SettingsContext'
import { uiTranslations } from '../../utils/timeLanguage'
import './SettingsDrawer.css'

export default function SettingsDrawer({ open, onClose }) {
  const { language, setLanguage, filteredVoices, selectedVoiceIndex, setSelectedVoiceIndex } = useSettings()
  const t = uiTranslations[language] || uiTranslations.de

  return (
    <>
      {/* Overlay */}
      <div
        id="drawerOverlay"
        className={open ? 'open' : ''}
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <aside
        id="settingsDrawer"
        className={open ? 'open' : ''}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        aria-hidden={!open}
      >
        <div className="drawer-header">
          <h2>⚙️ Settings</h2>
          <button id="drawerCloseBtn" aria-label="Close settings" onClick={onClose}>✕</button>
        </div>

        <div className="drawer-body">
          <span className="drawer-section-title">Language</span>

          <div className="drawer-field">
            <label htmlFor="langSelect">Language / Sprache / Idioma</label>
            <select
              id="langSelect"
              value={language}
              onChange={e => setLanguage(e.target.value)}
            >
              <option value="de">Deutsch (German)</option>
              <option value="en">English</option>
              <option value="es">Español (Spanish)</option>
            </select>
          </div>

          <div className="drawer-divider" />

          <span className="drawer-section-title">Voice</span>

          <div className="drawer-field">
            <label id="voiceLabel" htmlFor="voiceSelect">
              {t.voiceLabel} ({language.toUpperCase()} Voice)
            </label>
            <select
              id="voiceSelect"
              value={selectedVoiceIndex}
              onChange={e => setSelectedVoiceIndex(e.target.value)}
            >
              <option value="">System Default Voice</option>
              {filteredVoices.map((voice, i) => (
                <option key={i} value={i}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>
        </div>
      </aside>
    </>
  )
}
