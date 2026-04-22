import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageMotion } from "../components/UI.jsx";
import { fetchAdvisorAdvice } from "../services/advisor.js";
import { safe } from "../utils/formatters.js";

export function AdvisorPage({ data, financials, fmt }) {
  const { spent, balance, catData, savings, sRate } = financials;
  const [advice,  setAdvice]  = useState("");
  const [loading, setLoading] = useState(false);
  const [errMsg,  setErrMsg]  = useState("");

  const go = async () => {
    setLoading(true); setAdvice(""); setErrMsg("");
    try {
      const text = await fetchAdvisorAdvice({
        monthlyIncome: data.monthlyIncome || 0,
        totalSpent:    spent,
        balance,
        savings,
        savingsRate:   `${sRate.toFixed(1)}%`,
        topCategories: catData.slice(0, 5).map(c => ({ name: c.name, amount: c.total })),
      });
      setAdvice(text);
    } catch (err) {
      setErrMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const rules = [
    { l: "50%", d: "Needs — Rent, EMIs, Bills",    t: (data.monthlyIncome || 0) * 0.5, c: "#FF6B6B" },
    { l: "30%", d: "Wants — Lifestyle, Dining",    t: (data.monthlyIncome || 0) * 0.3, c: "#FBBF24" },
    { l: "20%", d: "Savings — Investments",       t: (data.monthlyIncome || 0) * 0.2, c: "#C8FA64" },
  ];

  const scoreColor = sRate >= 20 ? "var(--paisa-green)" : sRate >= 10 ? "#FBBF24" : "var(--paisa-red)";

  return (
    <PageMotion>
      <div className="pg">
        <p className="ptitle">Advisor</p>

        {/* Savings Rate Card */}
        <motion.div
          className="gc"
          style={{ marginBottom: 20, textAlign: "center", padding: "40px 24px" }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="ey">Current Savings Rate</p>
          <p style={{ fontFamily: "'Bricolage Grotesque',serif", fontSize: 64, fontWeight: 900, color: scoreColor, lineHeight: 1, marginTop: 8, letterSpacing: "-0.04em" }}>
            {sRate.toFixed(0)}<span style={{ fontSize: 28, opacity: 0.6 }}>%</span>
          </p>
        </motion.div>

        {/* Rule 50-30-20 */}
        <div className="gc" style={{ marginBottom: 20 }}>
          <p className="sh">Budget Allocation (50-30-20)</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {rules.map(r => (
              <div key={r.l}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{r.d}</p>
                  <p style={{ fontSize: 13, fontWeight: 800, color: r.c }}>{fmt(r.t)}</p>
                </div>
                <div className="st">
                  <div className="sf" style={{ width: `${r.t > 0 ? Math.min(100, (spent / (data.monthlyIncome || 1)) * 100) : 0}%`, background: r.c, opacity: 0.8 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Action */}
        <motion.button
          id="advisor-cta"
          className="ctab"
          onClick={go}
          disabled={loading}
          style={{ marginBottom: 24 }}
        >
          {loading ? "Analyzing Portfolio..." : "✦ Generate AI Financial Report"}
        </motion.button>

        {/* Loading State / Shimmer */}
        {loading && (
          <div className="gc" style={{ marginBottom: 20, borderStyle: "dashed" }}>
            <div className="shimmer" style={{ width: "40%", height: 14, marginBottom: 16 }} />
            <div className="shimmer" style={{ width: "100%", height: 12, marginBottom: 10 }} />
            <div className="shimmer" style={{ width: "90%", height: 12, marginBottom: 10 }} />
            <div className="shimmer" style={{ width: "95%", height: 12 }} />
          </div>
        )}

        {/* Error */}
        <AnimatePresence>
          {errMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              style={{ background: "rgba(255,107,107,0.05)", border: "1.5px solid rgba(255,107,107,0.15)", borderRadius: 20, padding: 20, marginBottom: 20 }}
            >
              <p style={{ fontSize: 14, color: "var(--paisa-red)", lineHeight: 1.6, fontWeight: 500 }}>{errMsg}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Response */}
        <AnimatePresence>
          {advice && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="gc"
              style={{ background: "linear-gradient(135deg, rgba(200, 250, 100, 0.04), transparent)", borderColor: "rgba(200, 250, 100, 0.2)", marginBottom: 20 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--paisa-green)", boxShadow: "0 0 15px var(--paisa-green)" }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: "var(--paisa-green)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Intelligence Report
                </span>
              </div>
              <div style={{ fontSize: 15, lineHeight: 1.9, color: "#E4E4E7", whiteSpace: "pre-line", fontWeight: 400 }}>
                {advice}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Indian Financial Hacks */}
        <div className="gc">
          <p className="sh">Pro Tips for India 🇮🇳</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              "Maximize 80C with ELSS for shorter lock-in vs PPF.",
              "Use a Liquid Fund for your emergency corpus for 6-7% returns.",
              "Annual insurance payments are ~10% cheaper than monthly.",
              "D-Mart bulk buying saves ~15% on monthly household staples."
            ].map((tip, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--paisa-green)", flexShrink: 0 }} />
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.5 }}>{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageMotion>
  );
}
