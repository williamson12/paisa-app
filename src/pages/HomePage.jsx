import { motion } from "framer-motion";
import { PageMotion, Ring, TransactionRow } from "../components/UI.jsx";
import { safe, todayStr } from "../utils/formatters.js";

export function HomePage({ data, financials, fmt, fmtS, openSetup, openProfile, user }) {
  const { txns, spent, balance, budget, bPct, catData, sRate, healthScore } = financials;
  const todayTxns = txns.filter(t => t.date === todayStr());
  const todayAmt  = safe(todayTxns.filter(t => t.type === "expense").reduce((s, t) => s + (t.amount || 0), 0));

  return (
    <PageMotion>
      <div className="pg">
        {/* Header */}
        <div className="page-header">
          <div>
            <p className="ey">{new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>
            <h1 className="page-brand">Paisa</h1>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={openProfile} className="avatar-btn" aria-label="Open profile" title="Profile">
              {user?.photoURL
                ? <img src={user.photoURL} alt={user.displayName || "User"} className="avatar-img" />
                : <div className="avatar-placeholder">👤</div>
              }
            </button>
            <button className="ibtn" onClick={openSetup} aria-label="Open settings" title="Settings">
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <circle cx={12} cy={12} r={3} />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Hero Balance Card */}
        <motion.div
          className="hcard"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.4 }}
        >
          <div className="hglow" />
          <p className="ey" style={{ marginBottom: 4 }}>Available Balance</p>
          <p className={`hamount ${balance < 0 ? "hneg" : ""}`}>{fmt(balance)}</p>
          <div className="hstats">
            <div className="hsi">
              <span className="hsdot" style={{ background: "#4ADE80" }} />
              <div><p className="hsvl">{fmtS(data.monthlyIncome)}</p><p className="hslb">Income</p></div>
            </div>
            <div className="hdiv" />
            <div className="hsi">
              <span className="hsdot" style={{ background: "#FF6B6B" }} />
              <div><p className="hsvl">{fmtS(spent)}</p><p className="hslb">Spent</p></div>
            </div>
            <div className="hdiv" />
            <div className="hsi">
              <span className="hsdot" style={{ background: "#C8FA64" }} />
              <div><p className="hsvl">{sRate.toFixed(0)}%</p><p className="hslb">Saved</p></div>
            </div>
          </div>
        </motion.div>

        {/* Ring Cards */}
        <div className="r2c">
          {budget > 0 ? (
            <div className="gc fcc">
              <p className="ey">Budget</p>
              <Ring pct={bPct} color={bPct > 85 ? "#FF6B6B" : bPct > 65 ? "#FBBF24" : "#C8FA64"} size={72}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{bPct.toFixed(0)}%</p>
              </Ring>
              <p style={{ fontSize: 11, color: "#a1a1aa", textAlign: "center" }}>{fmtS(spent)} of {fmtS(budget)}</p>
              {bPct > 85 && <p className="wchip">Over budget!</p>}
            </div>
          ) : (
            <div className="gc fcc">
              <p className="ey">Today</p>
              <p style={{ fontFamily: "'Bricolage Grotesque',serif", fontSize: 26, fontWeight: 900, color: "#C8FA64" }}>{fmtS(todayAmt)}</p>
              <p style={{ fontSize: 11, color: "#a1a1aa" }}>{todayTxns.length} txns</p>
            </div>
          )}
          <div className="gc fcc">
            <p className="ey">Health</p>
            <Ring pct={healthScore * 10} color={healthScore >= 7 ? "#C8FA64" : healthScore >= 5 ? "#FBBF24" : "#FF6B6B"} size={72}>
              <p style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{healthScore}</p>
            </Ring>
            <p style={{ fontSize: 11, color: "#a1a1aa", textAlign: "center" }}>
              {healthScore >= 8 ? "Excellent" : healthScore >= 6 ? "Good" : healthScore >= 4 ? "Average" : "Critical"}
            </p>
          </div>
        </div>

        {/* Top Categories */}
        {catData.length > 0 && (
          <div className="gc" style={{ marginBottom: 14 }}>
            <p className="sh">Where money goes</p>
            {catData.slice(0, 4).map((c, i) => (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}
              >
                <span style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{c.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#d4d4d8" }}>{c.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: c.color }}>{fmt(c.total)}</span>
                  </div>
                  <div className="st"><div className="sf" style={{ width: `${safe(c.total / spent * 100)}%`, background: c.color }} /></div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Recent Transactions */}
        <div className="gc">
          <p className="sh">Recent</p>
          {txns.length === 0
            ? <p className="em">No transactions yet. Tap + to add.</p>
            : [...txns].reverse().slice(0, 5).map(t => (
                <TransactionRow key={t.id} t={t} fmt={fmt} />
              ))
          }
        </div>
      </div>
    </PageMotion>
  );
}
