import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { SettingsProvider } from './context/SettingsContext'
import App from './App'
import TimerPage from './pages/TimerPage/TimerPage'
import QuizPage from './pages/QuizPage/QuizPage'
import SpeakerPage from './pages/SpeakerPage/SpeakerPage'
import DateSeasonPage from './pages/DateSeasonPage/DateSeasonPage'
import VocabPage from './pages/VocabPage/VocabPage'
import './index.css'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true,       element: <TimerPage /> },
      { path: 'quiz',      element: <QuizPage /> },
      { path: 'speaker',   element: <SpeakerPage /> },
      { path: 'dates',     element: <DateSeasonPage /> },
      { path: 'vocab',     element: <VocabPage /> },
    ],
  },
], { basename: '/timerTool' })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SettingsProvider>
      <RouterProvider router={router} />
    </SettingsProvider>
  </StrictMode>
)
