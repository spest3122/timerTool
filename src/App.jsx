import { useState } from 'react'
import { Outlet } from 'react-router'
import NavSidebar from './components/NavSidebar/NavSidebar'
import BottomNav from './components/BottomNav/BottomNav'
import SettingsDrawer from './components/SettingsDrawer/SettingsDrawer'
import './App.css'

export default function App() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      {/* Desktop left sidebar */}
      <NavSidebar />

      {/* Mobile bottom tab bar */}
      <nav id="bottomNav" aria-label="Main navigation mobile">
        <BottomNav />
      </nav>

      {/* Main content area */}
      <div className="page-wrapper">
        {/* Settings toggle button — fixed top-right, visible on all pages */}
        <div id="settingsBar">
          <button
            id="settingsToggleBtn"
            aria-label="Open settings"
            title="Settings"
            onClick={() => setDrawerOpen(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
              <circle cx="9"  cy="6"  r="2.2" fill="currentColor" stroke="none" />
              <circle cx="15" cy="12" r="2.2" fill="currentColor" stroke="none" />
              <circle cx="9"  cy="18" r="2.2" fill="currentColor" stroke="none" />
            </svg>
          </button>
        </div>

        {/* Settings drawer + overlay */}
        <SettingsDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

        {/* Page content rendered by React Router */}
        <Outlet />
      </div>
    </>
  )
}
