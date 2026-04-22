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
    showToast("Portfolio Updated");
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
      <p className="modal-title">Welcome to Paisa</p>
      <p className="modal-sub">Set your monthly income to unlock AI insights.</p>
      
      <div className="fw" style={{ marginBottom: 20 }}>
        <label className="fl">Monthly Income (₹)</label>
        <input
          id="setup-income"
          className="fi" type="number" inputMode="numeric"
          placeholder="e.g. 85000" value={inc}
          onChange={e => setInc(e.target.value)}
        />
      </div>

      <div className="fw" style={{ marginBottom: 32 }}>
        <label className="fl">Monthly Budget (Optional)</label>
        <input
          id="setup-budget"
          className="fi" type="number" inputMode="numeric"
          placeholder="e.g. 40000" value={bud}
          onChange={e => setBud(e.target.value)}
        />
      </div>

      <button id="setup-save" className="ctab" onClick={submit} disabled={busy} style={{ marginBottom: 12 }}>
        {busy ? "Saving..." : "Continue →"}
      </button>
      
      <button
        onClick={close}
        style={{ width: "100%", background: "transparent", border: "1.5px solid var(--glass-border)", borderRadius: 18, padding: 18, color: "var(--text-secondary)", fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 20 }}
      >
        Cancel
      </button>

      <button
        onClick={reset} disabled={busy}
        style={{ width: "100%", background: "transparent", border: "none", color: "var(--paisa-red)", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: 0.8 }}
      >
        Reset Transaction History
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
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <button
          onClick={close}
          style={{ width: 44, height: 44, borderRadius: 14, background: "var(--glass-bg)", border: "1.5px solid var(--glass-border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-secondary)" }}
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="M12 5l-7 7 7 7" />
          </svg>
        </button>
        <p className="modal-title">Settings</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 0 40px" }}>
        {user?.photoURL
          ? <img src={user.photoURL} alt="Avatar" style={{ width: 92, height: 92, borderRadius: 32, border: "3px solid rgba(200,250,100,0.2)", marginBottom: 20 }} />
          : <div style={{ width: 92, height: 92, borderRadius: 32, background: "var(--glass-bg)", border: "2px solid var(--glass-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, marginBottom: 20 }}>👤</div>
        }
        <p style={{ fontFamily: "'Bricolage Grotesque',serif", fontSize: 26, fontWeight: 900, color: "#fff", marginBottom: 6, letterSpacing: "-0.02em" }}>{user?.displayName || "Member"}</p>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", fontWeight: 500 }}>{user?.email || ""}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 32 }}>
        {[
          { label: "Txns", value: txnCount },
          { label: "Savings", value: `${sRate.toFixed(0)}%` },
          { label: "Spent",  value: fmtS(spent) },
        ].map(s => (
          <div key={s.label} className="gc" style={{ padding: "20px 10px", textAlign: "center", background: "var(--glass-bg)" }}>
            <p style={{ fontFamily: "'Bricolage Grotesque',serif", fontSize: 18, fontWeight: 900, color: "var(--paisa-green)", marginBottom: 4 }}>{s.value}</p>
            <p style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>{s.label}</p>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {confirming ? (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <button onClick={handleSignOut} disabled={busy} className="ctab" style={{ background: "var(--paisa-red)" }}>
              {busy ? "Signing out..." : "Confirm Sign Out"}
            </button>
            <button onClick={() => setConfirming(false)} style={{ width: "100%", padding: 18, borderRadius: 18, background: "transparent", border: "1.5px solid var(--glass-border)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
          </motion.div>
        ) : (
          <motion.button
            key="signout"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            onClick={() => setConfirming(true)}
            style={{ width: "100%", padding: 18, borderRadius: 20, background: "rgba(255,107,107,0.05)", border: "1.5px solid rgba(255,107,107,0.15)", color: "var(--paisa-red)", fontSize: 15, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
          >
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
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 300 }}
      >
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)", margin: "0 auto 32px" }} />
        {children}
      </motion.div>
    </motion.div>
  );
}
