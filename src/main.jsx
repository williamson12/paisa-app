import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

import { ErrorBoundary } from "react-error-boundary";

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif", textAlign: "center", marginTop: "20vh" }}>
      <h2 style={{ color: "#d32f2f" }}>Something went wrong.</h2>
      <p style={{ color: "#666", marginBottom: "20px" }}>The application encountered an unexpected error.</p>
      <pre style={{ background: "#f5f5f5", padding: "15px", borderRadius: "8px", overflowX: "auto", fontSize: "12px", textAlign: "left", maxWidth: "800px", margin: "0 auto" }}>
        {error.message}
      </pre>
      <button 
        onClick={() => {
          localStorage.clear();
          window.location.reload();
        }} 
        style={{ marginTop: "20px", padding: "10px 20px", background: "#000", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
      >
        Clear Cache & Reload
      </button>
    </div>
  );
}

const myErrorHandler = (error, info) => {
  // Observability: Log error to external service here (e.g. Sentry, Datadog)
  console.error("Global React Error Boundary Caught:", error, info);
};

// StrictMode is intentionally removed.
// React 18/19 StrictMode double-invokes useEffect in development, which causes
// getRedirectResult() to be called twice. The second call returns null (token
// already consumed), causing onAuthStateChanged to fire null and bouncing the
// user back to the login page on every sign-in. This is a known incompatibility
// between Firebase redirect auth and React StrictMode.
createRoot(document.getElementById("root")).render(
  <ErrorBoundary FallbackComponent={ErrorFallback} onError={myErrorHandler}>
    <App />
  </ErrorBoundary>
);
