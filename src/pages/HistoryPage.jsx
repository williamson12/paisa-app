import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { PageMotion, TransactionRow } from "../components/UI.jsx";
import { safe } from "../utils/formatters.js";

export function HistoryPage({ data, save, showToast, fmt }) {
  const [filt, setFilt] = useState("all");
  const [q,    setQ]    = useState("");

  const txns = data.transactions || [];

  const del = async (id) => {
    await save({ ...data, transactions: txns.filter(t => t.id !== id) });
    showToast("Deleted");
  };

  const filtered = [...txns]
    .filter(t => {
      if (filt !== "all" && t.type !== filt) return false;
      if (q) {
        const lq = q.toLowerCase();
        return t.note?.toLowerCase().includes(lq) || t.category?.toLowerCase().includes(lq);
      }
      return true;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const grouped = filtered.reduce((acc, t) => {
    (acc[t.date] = acc[t.date] || []).push(t);
    return acc;
  }, {});

  return (
    <PageMotion>
      <div className="pg">
        <p className="ptitle">History</p>

        {/* Search */}
        <div className="swrap">
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx={11} cy={11} r={8} /><line x1={21} y1={21} x2={16.65} y2={16.65} />
          </svg>
          <input
            id="history-search"
            className="si"
            placeholder="Search transactions…"
            value={q}
            onChange={e => setQ(e.target.value)}
            aria-label="Search transactions"
          />
          {q && (
            <button onClick={() => setQ("")} style={{ background: "none", border: "none", color: "#71717a", cursor: "pointer", fontSize: 16, lineHeight: 1 }} aria-label="Clear search">✕</button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="prow">
          {["all", "expense", "income"].map(f => (
            <button
              key={f}
              id={`filter-${f}`}
              className={`pill ${filt === f ? "pilla" : ""}`}
              onClick={() => setFilt(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#71717a", fontWeight: 600 }}>
            {filtered.length} txns
          </span>
        </div>

        {/* Grouped Transactions */}
        {Object.keys(grouped).length === 0
          ? <p className="em">Nothing matches. Try a different filter.</p>
          : Object.entries(grouped).map(([date, list]) => {
              const ds = safe(list.filter(t => t.type === "expense").reduce((s, t) => s + (t.amount || 0), 0));
              const di = safe(list.filter(t => t.type === "income").reduce((s, t) => s + (t.amount || 0), 0));
              return (
                <div key={date} style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, padding: "0 2px" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#a1a1aa", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      {new Date(date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                    </span>
                    <div style={{ display: "flex", gap: 10 }}>
                      {di > 0 && <span style={{ color: "#4ADE80", fontSize: 12, fontWeight: 600 }}>+{fmt(di)}</span>}
                      {ds > 0 && <span style={{ color: "#FF6B6B", fontSize: 12, fontWeight: 600 }}>−{fmt(ds)}</span>}
                    </div>
                  </div>
                  <div className="gc" style={{ padding: "4px 16px" }}>
                    <AnimatePresence>
                      {list.map(t => (
                        <TransactionRow key={t.id} t={t} fmt={fmt} onDelete={() => del(t.id)} />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })
        }
      </div>
    </PageMotion>
  );
}
