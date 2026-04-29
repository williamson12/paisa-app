import { motion } from "framer-motion";
import { isInAppBrowser, getInAppBrowserName } from "../utils/inAppBrowser";

// ─── In-App Browser Gate ────────────────────────────────────────────────────
// Rendered BEFORE any Firebase call when Google OAuth is known to be blocked.
// The overlay is purely instructional — no auth state is modified.
function InAppBrowserOverlay({ appName }) {
  const name = appName || "this app";

  // Detect OS so we can name the correct system browser.
  const isIOS = /iP(hone|ad|od)/i.test(navigator.userAgent);
  const systemBrowser = isIOS ? "Safari" : "Chrome";

  // Best-effort: try to open the current URL in the system browser.
  // Works on Android via intent:// scheme; on iOS the user must do it manually.
  const handleOpenBrowser = () => {
    const url = window.location.href;
    if (/Android/i.test(navigator.userAgent)) {
      // Android intent URL forces the system browser
      window.location.href =
        "intent://" +
        url.replace(/^https?:\/\//, "") +
        "#Intent;scheme=https;action=android.intent.action.VIEW;end";
    } else {
      // iOS: copy URL to clipboard as a fallback hint
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(url).catch(() => {});
      }
      // Attempt to open — may or may not work depending on the app
      window.open(url, "_blank", "noopener");
    }
  };

  return (
    <div style={S.overlay}>
      <motion.div
        style={S.card}
        initial={{ opacity: 0, scale: 0.93, y: 28 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Logo badge — mirrors .login-logo */}
        <motion.div
          style={S.logoBadge}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 22 }}
        >
          🔒
        </motion.div>

        {/* Heading — Bricolage Grotesque like .login-brand */}
        <h2 style={S.heading}>Open in {systemBrowser}</h2>

        {/* Sub-text */}
        <p style={S.body}>
          Google sign-in is blocked inside{" "}
          <span style={S.accent}>{name}</span>'s browser for security reasons.
        </p>
        <p style={S.bodyDim}>
          Open this page in <span style={S.accent}>{systemBrowser}</span> to continue.
        </p>

        {/* Divider */}
        <div style={S.divider} />

        {/* Steps — styled like subtle .gc cards */}
        <ol style={S.steps}>
          {[
            <>Tap the <span style={S.mono}>⋯</span> or <span style={S.mono}>⋮</span> menu in the top corner of <span style={S.accent}>{name}</span>.</>,
            <>Choose <span style={S.accent}>"Open in {systemBrowser}"</span> or <span style={S.accent}>"Open in browser"</span>.</>,
            <>Sign in with Google on the page that opens.</>,
          ].map((text, i) => (
            <li key={i} style={S.stepItem}>
              <span style={S.stepNum}>{i + 1}</span>
              <span style={S.stepText}>{text}</span>
            </li>
          ))}
        </ol>

        {/* CTA — mirrors .ctab (lime→green gradient, black text) */}
        <motion.button
          id="open-system-browser-btn"
          style={S.cta}
          onClick={handleOpenBrowser}
          whileHover={{ boxShadow: "0 12px 32px rgba(200,250,100,0.22)" }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
        >
          Open in {systemBrowser}
        </motion.button>

        {/* Legal-style footnote — mirrors .login-legal */}
        <p style={S.footnote}>
          If the button doesn't work, copy the URL from the address bar and
          paste it directly into {systemBrowser}.
        </p>
      </motion.div>
    </div>
  );
}

// ── Design tokens aligned with index.css ─────────────────────────────────────
const S = {
  overlay: {
    position: "fixed",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    // Mirrors .login-root: pure black + subtle lime radial glow
    background: "radial-gradient(ellipse at 60% 0%, rgba(200,250,100,0.06) 0%, transparent 60%), #000",
    padding: "24px 20px",
    zIndex: 9999,
    fontFamily: "'Outfit', sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "400px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  // Mirrors .login-logo
  logoBadge: {
    width: 76,
    height: 76,
    borderRadius: "24px",
    background: "rgba(200,250,100,0.1)",
    border: "1px solid rgba(200,250,100,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 36,
    marginBottom: 28,
  },
  // Mirrors .login-brand
  heading: {
    fontFamily: "'Bricolage Grotesque', serif",
    fontSize: 36,
    fontWeight: 900,
    color: "#fff",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: "-0.5px",
  },
  body: {
    fontSize: 14,
    color: "#a1a1aa",
    textAlign: "center",
    lineHeight: 1.7,
    marginBottom: 6,
  },
  bodyDim: {
    fontSize: 14,
    color: "#52525b",
    textAlign: "center",
    lineHeight: 1.7,
    marginBottom: 0,
  },
  accent: {
    color: "#C8FA64",
    fontWeight: 600,
  },
  mono: {
    fontFamily: "monospace",
    color: "#E8E8F0",
    fontWeight: 700,
  },
  divider: {
    width: "100%",
    height: 1,
    background: "rgba(255,255,255,0.06)",
    margin: "24px 0",
  },
  // Step list — no ol default styling
  steps: {
    listStyle: "none",
    padding: 0,
    margin: "0 0 28px",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  // Each step mirrors a .gc card
  stepItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    background: "rgba(255,255,255,0.026)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "16px",
    padding: "14px 16px",
  },
  stepNum: {
    fontFamily: "'Bricolage Grotesque', serif",
    fontSize: 13,
    fontWeight: 800,
    color: "#C8FA64",
    minWidth: 20,
    lineHeight: 1.5,
    flexShrink: 0,
  },
  stepText: {
    fontSize: 13,
    color: "#a1a1aa",
    lineHeight: 1.6,
  },
  // Mirrors .ctab
  cta: {
    width: "100%",
    padding: "16px 24px",
    background: "linear-gradient(135deg, #C8FA64, #86EFAC)",
    color: "#000",
    border: "none",
    borderRadius: "16px",
    fontFamily: "'Outfit', sans-serif",
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
    letterSpacing: "0.02em",
    marginBottom: 20,
    boxShadow: "0 4px 24px rgba(200,250,100,0.15)",
  },
  // Mirrors .login-legal
  footnote: {
    fontSize: 11,
    color: "#52525b",
    textAlign: "center",
    lineHeight: 1.7,
  },
};
// ─────────────────────────────────────────────────────────────────────────────

export function LoginPage({ onSignIn, error, loading }) {
  // Show blocking overlay for in-app browsers before any auth UI.
  if (isInAppBrowser()) {
    return <InAppBrowserOverlay appName={getInAppBrowserName()} />;
  }

  return (
    <div className="login-root">
      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Logo */}
        <motion.div
          className="login-logo"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 22 }}
        >
          ₹
        </motion.div>

        <h1 className="login-brand">Paisa</h1>
        <p className="login-tagline">
          Your premium personal finance tracker.<br />
          Built for India. Powered by AI.
        </p>

        {/* Google Sign-In */}
        <motion.button
          id="google-signin-btn"
          className="google-btn"
          onClick={onSignIn}
          disabled={loading}
          whileHover={{ y: -2, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
        >
          {loading ? (
            <span style={{ fontSize: 14, color: "#111" }}>Signing in…</span>
          ) : (
            <>
              <GoogleLogo />
              <span>Continue with Google</span>
            </>
          )}
        </motion.button>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="login-error"
          >
            {error}
          </motion.div>
        )}

        <p className="login-legal">
          By signing in, your data is securely synced to your Google Account.
          No passwords needed. Works across all your devices.
        </p>

        {/* Trust badges */}
        <div className="login-badges">
          {["🔐 Google Auth", "☁️ Cloud Sync", "🇮🇳 Made for India"].map(b => (
            <span key={b} className="login-badge">{b}</span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
