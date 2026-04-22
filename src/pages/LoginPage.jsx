import { motion } from "framer-motion";

export function LoginPage({ onSignIn, error, loading }) {
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
