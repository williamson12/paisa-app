import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// StrictMode is intentionally removed.
// React 18/19 StrictMode double-invokes useEffect in development, which causes
// getRedirectResult() to be called twice. The second call returns null (token
// already consumed), causing onAuthStateChanged to fire null and bouncing the
// user back to the login page on every sign-in. This is a known incompatibility
// between Firebase redirect auth and React StrictMode.
createRoot(document.getElementById("root")).render(<App />);
