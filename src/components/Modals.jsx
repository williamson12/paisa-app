import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { validateSetup } from "../utils/formatters";

/** Setup / Settings modal — income & budget config + month reset */
export function SetupModal({ data, save, close, showToast }) {
  const [inc, setInc] = useState(String(data.monthlyIncome || ""));
  const [bud, setBud] = useState(String(data.monthlyBudget || ""));
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const err = validateSetup({ income: inc });
    if (err) { showToast(err, "err"); return; }
    setBusy(true);
    await save({ ...data, monthlyIncome: parseFloat(inc), monthlyBudget: parseFloat(bud) || 0 });
    setBusy(false);
    showToast("Saved ✓");
    close();
  };

  const reset = async () => {
    setBusy(true);
    await save({ monthlyIncome: parseFloat(inc) || 0, monthlyBudget: parseFloat(bud) || 0, transactions: [] });
    setBusy(false);
    showToast("Month reset");
    close();
  };

  return (
    <Overlay onClose={close}>
      <p className="modal-title">Setup</p>
      <p className="modal-sub">Monthly configuration</p>
      <div className="fw" style={{ marginBottom: 14 }}>
        <label className="fl">Monthly Income (₹)</label>
        <input
          id="setup-income"
          className="fi" type="number" inputMode="numeric"
          placeholder="e.g. 55000" value={inc}
          onChange={e => setInc(e.target.value)}
        />
        <p style={{ fontSize: 11, color: "#71717a", marginTop: 4 }}>Salary + freelance + all sources</p>
      </div>
      <div className="fw" style={{ marginBottom: 28 }}>
        <label className="fl">Spending Budget (₹) — optional</label>
        <input
          id="setup-budget"
          className="fi" type="number" inputMode="numeric"
          placeholder="e.g. 40000" value={bud}
          onChange={e => setBud(e.target.value)}
        />
      </div>
      <button id="setup-save" className="ctab" onClick={submit} disabled={busy} style={{ marginBottom: 10 }}>
        {busy ? "Saving…" : "Save →"}
      </button>
      <button
        onClick={close}
        style={{ width: "100%", background: "transparent", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 14, color: "#a1a1aa", fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 600, cursor: "pointer", marginBottom: 10 }}
      >
        Cancel
      </button>
      <button
        onClick={reset} disabled={busy}
        style={{ width: "100%", background: "transparent", border: "1px solid rgba(255,107,107,0.2)", borderRadius: 14, padding: 14, color: "#FF6B6B", fontFamily: "'Outfit',sans-serif", fontSize: 13, cursor: "pointer" }}
      >
        ⚠ Reset Month Data
      </button>
    </Overlay>
  );
}

/** Profile / account modal */
export function ProfileModal({ user, onSignOut, close, data, spent, sRate, fmtS }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const txnCount = (data.transactions || []).length;

  const handleSignOut = async () => {
    if (!confirming) { setConfirming(true); return; }
    setBusy(true);
    await onSignOut();
  };

  return (
    <Overlay onClose={close}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <button
          onClick={close}
          style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#a1a1aa", flexShrink: 0 }}
          aria-label="Close profile"
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="M12 5l-7 7 7 7" />
          </svg>
        </button>
        <p className="modal-title" style={{ marginBottom: 0 }}>Profile</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 0 28px" }}>
        {user?.photoURL
          ? <img src={user.photoURL} alt="Avatar" style={{ width: 80, height: 80, borderRadius: 24, border: "2px solid rgba(200,250,100,0.3)", objectFit: "cover", marginBottom: 16 }} />
          : <div style={{ width: 80, height: 80, borderRadius: 24, background: "rgba(200,250,100,0.1)", border: "2px solid rgba(200,250,100,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, marginBottom: 16 }}>👤</div>
        }
        <p style={{ fontFamily: "'Bricolage Grotesque',serif", fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 4 }}>{user?.displayName || "Paisa User"}</p>
        <p style={{ fontSize: 13, color: "#71717a" }}>{user?.email || ""}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 28 }}>
        {[
          { label: "Transactions", value: txnCount },
          { label: "Savings Rate", value: `${sRate.toFixed(0)}%` },
          { label: "Total Spent",  value: fmtS(spent) },
        ].map(s => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 10px", textAlign: "center" }}>
            <p style={{ fontFamily: "'Bricolage Grotesque',serif", fontSize: 18, fontWeight: 800, color: "#C8FA64", marginBottom: 4 }}>{s.value}</p>
            <p style={{ fontSize: 10, color: "#71717a", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>{s.label}</p>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {confirming ? (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
          >
            <p style={{ fontSize: 13, color: "#a1a1aa", textAlign: "center", marginBottom: 4 }}>Are you sure you want to sign out?</p>
            <button onClick={handleSignOut} disabled={busy} style={{ width: "100%", padding: 14, borderRadius: 14, background: "rgba(255,107,107,0.12)", border: "1px solid rgba(255,107,107,0.3)", color: "#FF6B6B", fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              {busy ? "Signing out…" : "Yes, Sign Out"}
            </button>
            <button onClick={() => setConfirming(false)} style={{ width: "100%", padding: 14, borderRadius: 14, background: "transparent", border: "1px solid rgba(255,255,255,0.07)", color: "#a1a1aa", fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          </motion.div>
        ) : (
          <motion.button
            key="signout"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleSignOut}
            style={{ width: "100%", padding: 14, borderRadius: 14, background: "transparent", border: "1px solid rgba(255,107,107,0.2)", color: "#FF6B6B", fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </motion.button>
        )}
      </AnimatePresence>
    </Overlay>
  );
}

/** Reusable bottom-sheet overlay */
function Overlay({ children, onClose }) {
  return (
    <motion.div
      className="mbg"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        className="mbox"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 34 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
