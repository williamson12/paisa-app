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
    <div style={styles.overlay}>
      <motion.div
        style={styles.card}
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Icon */}
        <div style={styles.iconWrap}>
          <span style={styles.icon}>🔒</span>
        </div>

        <h2 style={styles.heading}>Open in {systemBrowser}</h2>

        <p style={styles.body}>
          Google sign-in is blocked inside <strong>{name}</strong>'s browser for
          security reasons.
        </p>
        <p style={styles.body}>
          Please open this page in <strong>{systemBrowser}</strong> to continue.
        </p>

        {/* Step list */}
        <ol style={styles.steps}>
          <li style={styles.step}>
            Tap the <strong>⋯</strong> or <strong>⋮</strong> menu in the top
            corner of {name}.
          </li>
          <li style={styles.step}>
            Choose <strong>"Open in {systemBrowser}"</strong> or{" "}
            <strong>"Open in browser"</strong>.
          </li>
          <li style={styles.step}>
            Sign in with Google on the page that opens.
          </li>
        </ol>

        {/* CTA — works reliably on Android, partial help on iOS */}
        <motion.button
          id="open-system-browser-btn"
          style={styles.button}
          onClick={handleOpenBrowser}
          whileTap={{ scale: 0.97 }}
        >
          Open in {systemBrowser}
        </motion.button>

        <p style={styles.footnote}>
          If the button doesn't work, copy the URL from the address bar and
          paste it into {systemBrowser}.
        </p>
      </motion.div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0f0f14 0%, #1a1a2e 100%)",
    padding: "24px",
    zIndex: 9999,
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  card: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "20px",
    padding: "32px 28px",
    maxWidth: "400px",
    width: "100%",
    textAlign: "center",
    backdropFilter: "blur(16px)",
    boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    background: "rgba(255,180,0,0.15)",
    border: "1px solid rgba(255,180,0,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
  },
  icon: { fontSize: 28 },
  heading: {
    fontSize: 22,
    fontWeight: 700,
    color: "#f5f5f7",
    margin: "0 0 12px",
    letterSpacing: "-0.3px",
  },
  body: {
    fontSize: 14,
    color: "rgba(255,255,255,0.65)",
    lineHeight: 1.6,
    margin: "0 0 10px",
  },
  steps: {
    textAlign: "left",
    margin: "18px 0 22px",
    paddingLeft: "20px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  step: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 1.55,
  },
  button: {
    display: "block",
    width: "100%",
    padding: "14px 20px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: "0.2px",
    boxShadow: "0 4px 20px rgba(102,126,234,0.4)",
    marginBottom: 14,
  },
  footnote: {
    fontSize: 12,
    color: "rgba(255,255,255,0.35)",
    lineHeight: 1.5,
    margin: 0,
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
