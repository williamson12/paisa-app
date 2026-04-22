import { motion, AnimatePresence } from "framer-motion";

/** Full-screen animated splash screen */
export function Splash({ subtitle }) {
  return (
    <motion.div
      className="splash"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="splash-logo"
        animate={{ scale: [1, 0.92, 1], opacity: [1, 0.5, 1] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      >
        ₹
      </motion.div>
      <motion.p
        className="splash-name"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        PAISA
      </motion.p>
      {subtitle && (
        <motion.p
          className="splash-sub"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  );
}

/** Page-level fade-up wrapper */
export function PageMotion({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Toast notification */
export function Toast({ toast }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.msg}
          className={`toast ${toast.type === "err" ? "toast-e" : "toast-o"}`}
          initial={{ opacity: 0, y: -12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
        >
          {toast.msg}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** SVG ring / donut chart */
export function Ring({ pct, color, size = 72, children }) {
  const r    = size / 2 - 6;
  const cx   = size / 2;
  const circ = 2 * Math.PI * r;
  const safeP = isFinite(pct) && !isNaN(pct) ? pct : 0;
  const dash  = circ * (safeP / 100);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={6} />
        <circle
          cx={cx} cy={cx} r={r} fill="none"
          stroke={color} strokeWidth={6} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray 0.9s cubic-bezier(.4,0,.2,1)" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {children}
      </div>
    </div>
  );
}

/** Single transaction row */
import { CATEGORIES } from "../utils/constants";

export function TransactionRow({ t, fmt, onDelete }) {
  const cat = CATEGORIES.find(c => c.name === t.category) || { icon: "💸", color: "#94A3B8" };
  return (
    <motion.div
      className="txn-row"
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ duration: 0.22 }}
    >
      <div className="txn-icon" style={{ background: `${cat.color}18` }}>
        {cat.icon}
      </div>
      <div className="txn-info">
        <p className="txn-title">{t.note || t.category}</p>
        <p className="txn-meta">{t.category} · {t.payMode}</p>
      </div>
      <div className="txn-right">
        <p className="txn-amount" style={{ color: t.type === "income" ? "#4ADE80" : "#FF6B6B" }}>
          {t.type === "income" ? "+" : "−"}{fmt(t.amount)}
        </p>
        {onDelete && (
          <button className="txn-del" onClick={onDelete} aria-label="Delete transaction">
            remove
          </button>
        )}
      </div>
    </motion.div>
  );
}
