import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createHashRouter, RouterProvider } from "react-router";
import { SettingsProvider } from "./context/SettingsContext";
import App from "./App";
import TimerPage from "./pages/TimerPage/TimerPage";
import QuizPage from "./pages/QuizPage/QuizPage";
import SpeakerPage from "./pages/SpeakerPage/SpeakerPage";
import VocabPage from "./pages/VocabPage/VocabPage";
import RecorderPage from "./pages/RecorderPage/RecorderPage";
import "./index.css";

const router = createHashRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <TimerPage /> },
      { path: "quiz", element: <QuizPage /> },
      { path: "speaker", element: <SpeakerPage /> },
      { path: "vocab", element: <VocabPage /> },
      { path: "recorder", element: <RecorderPage /> },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <SettingsProvider>
      <RouterProvider router={router} />
    </SettingsProvider>
  </StrictMode>,
);

