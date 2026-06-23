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
    </>
  )
}
