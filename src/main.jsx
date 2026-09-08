import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createHashRouter, RouterProvider } from "react-router";
import { SettingsProvider } from "./context/SettingsContext";
import App from "./App";
import { routes } from "./routes";
import "./index.css";

const router = createHashRouter(routes);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <SettingsProvider>
      <RouterProvider router={router} />
    </SettingsProvider>
  </StrictMode>,
);

