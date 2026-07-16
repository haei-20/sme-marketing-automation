import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter } from "react-router-dom";

import { App } from "./App";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { AuthProvider } from "./contexts/AuthContext";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <AppErrorBoundary>
          <AuthProvider>
            <App />
          </AuthProvider>
        </AppErrorBoundary>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
);
