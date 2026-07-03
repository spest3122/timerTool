import { NavLink } from 'react-router'
import './BottomNav.css'

const TimerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12L12 3l9 9" /><path d="M9 21V12h6v9" />
  </svg>
)
const QuizIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3 8-8" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
  </svg>
)
const SpeakerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 003 3v8a3 3 0 01-6 0V4a3 3 0 013-3z" />
    <path d="M19 10v2a7 7 0 01-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
  </svg>
)

const VocabIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    <line x1="9" y1="7" x2="15" y2="7" />
    <line x1="9" y1="11" x2="15" y2="11" />
  </svg>
)

const RecorderIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v20M17 5v14M22 9v6M7 5v14M2 9v6" />
  </svg>
)

export default function BottomNav() {
  const cls = ({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`
  return (
    <>
      <NavLink to="/" end className={cls} aria-label="Timer">
        <TimerIcon />Timer
      </NavLink>
      <NavLink to="/quiz" className={cls} aria-label="Quiz">
        <QuizIcon />Quiz
      </NavLink>
      <NavLink to="/speaker" className={cls} aria-label="Speaker">
        <SpeakerIcon />Speaker
      </NavLink>

      <NavLink to="/vocab" className={cls} aria-label="Vocab">
        <VocabIcon />Vocab
      </NavLink>

      <NavLink to="/recorder" className={cls} aria-label="Recorder">
        <RecorderIcon />Recorder
      </NavLink>
    </>
  )
}
