import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import axios from "axios";
import { configure } from "mobx";
import { ThemeProvider } from "./contexts/ThemeContext";
import { BrowserRouter } from "react-router-dom";
// Configure MobX
configure({
  enforceActions: "never",
  computedRequiresReaction: false,
  reactionRequiresObservable: false,
  observableRequiresReaction: false,
  disableErrorBoundaries: false,
});

// Configure axios defaults
axios.defaults.baseURL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";
axios.defaults.withCredentials = true;

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
