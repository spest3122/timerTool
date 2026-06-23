import { NavLink } from 'react-router'
import './NavSidebar.css'

const TimerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12L12 3l9 9" />
    <path d="M9 21V12h6v9" />
  </svg>
)
const QuizIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3 8-8" />
    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
  </svg>
)
const SpeakerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 003 3v8a3 3 0 01-6 0V4a3 3 0 013-3z" />
    <path d="M19 10v2a7 7 0 01-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
)

export default function NavSidebar() {
  return (
    <nav id="navSidebar" aria-label="Main navigation">
      <div className="nav-logo" title="Multilingual Time Trainer">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="white">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="6" x2="12" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <line x1="12" y1="12" x2="16" y2="14" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      <NavLink to="/" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} aria-label="Timer" title="Timer">
        <TimerIcon />
        <span className="nav-label">Timer</span>
      </NavLink>

      <div className="nav-divider" />

      <NavLink to="/quiz" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} aria-label="German Quiz" title="Quiz">
        <QuizIcon />
        <span className="nav-label">Quiz</span>
      </NavLink>

      <NavLink to="/speaker" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} aria-label="Speaker practice" title="Speaker">
        <SpeakerIcon />
        <span className="nav-label">Speaker</span>
      </NavLink>
    </nav>
  )
}
