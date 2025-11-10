import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import * as Sentry from "@sentry/react";

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN as string,
    environment: import.meta.env.MODE || 'production',
  });
}

createRoot(document.getElementById("root")!).render(
  // Wrap in Sentry ErrorBoundary if Sentry is configured
  import.meta.env.VITE_SENTRY_DSN ? (
    <Sentry.ErrorBoundary fallback={<div>Something went wrong</div>}>
      <App />
    </Sentry.ErrorBoundary>
  ) : (
    <App />
  )
);
