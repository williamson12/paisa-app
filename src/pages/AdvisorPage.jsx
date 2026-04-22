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
      setErrMsg(`⚠️ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const rules = [
    { l: "50%", d: "Needs — Rent, EMIs, Groceries, Bills",    t: (data.monthlyIncome || 0) * 0.5, c: "#FF6B6B" },
    { l: "30%", d: "Wants — Dining, Shopping, Entertainment", t: (data.monthlyIncome || 0) * 0.3, c: "#FBBF24" },
    { l: "20%", d: "Savings — SIP, FD, Emergency Fund",       t: (data.monthlyIncome || 0) * 0.2, c: "#C8FA64" },
  ];

  const scoreColor = sRate >= 20 ? "#C8FA64" : sRate >= 10 ? "#FBBF24" : "#FF6B6B";
  const scoreLabel = sRate >= 30 ? "Excellent — building real wealth"
                   : sRate >= 20 ? "Good — stay consistent"
                   : sRate >= 10 ? "Average — push to 20%"
                   : "Critical — review expenses now";

  return (
    <PageMotion>
      <div className="pg">
        <p className="ptitle">CA Advisor</p>

        {/* Savings Rate Hero */}
        <motion.div
          className="gc"
          style={{ marginBottom: 14, textAlign: "center", padding: "28px 20px", background: "linear-gradient(135deg,rgba(200,250,100,0.05),rgba(0,0,0,0))" }}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
        >
          <p className="ey">Your Savings Rate</p>
          <p style={{ fontFamily: "'Bricolage Grotesque',serif", fontSize: 52, fontWeight: 900, color: scoreColor, lineHeight: 1, marginTop: 6 }}>
            {sRate.toFixed(0)}<span style={{ fontSize: 24 }}>%</span>
          </p>
          <p style={{ fontSize: 12, color: "#a1a1aa", marginTop: 6 }}>{scoreLabel}</p>
        </motion.div>

        {/* 50-30-20 Rule */}
        <div className="gc" style={{ marginBottom: 14 }}>
          <p className="sh">50–30–20 for {data.monthlyIncome > 0 ? `₹${((data.monthlyIncome || 0) / 1000).toFixed(0)}K/mo` : "your income"}</p>
          {rules.map(r => (
            <div key={r.l} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${r.c}18`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13, color: r.c, flexShrink: 0 }}>{r.l}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, color: "#a1a1aa", marginBottom: 4 }}>{r.d}</p>
                <div className="st">
                  <div className="sf" style={{ width: `${r.t > 0 ? Math.min(100, safe(spent / r.t * 50)) : 0}%`, background: r.c }} />
                </div>
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: r.c, flexShrink: 0 }}>{fmt(r.t)}</p>
            </div>
          ))}
        </div>

        {/* AI CTA Button */}
        <motion.button
          id="advisor-cta"
          className="ctab"
          onClick={go}
          disabled={loading}
          style={{ marginBottom: 16 }}
          whileHover={!loading ? { y: -2 } : {}}
          whileTap={!loading ? { scale: 0.98 } : {}}
        >
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              {["●", "●", "●"].map((d, i) => (
                <motion.span
                  key={i}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
                  style={{ fontSize: 16, color: "#000" }}
                >
                  {d}
                </motion.span>
              ))}
            </span>
          ) : "✦  Get My Personalised CA Report"}
        </motion.button>

        {/* Error */}
        <AnimatePresence>
          {errMsg && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: 16, padding: "16px 18px", marginBottom: 14 }}
            >
              <p style={{ fontSize: 13, color: "#FF6B6B", lineHeight: 1.7 }}>{errMsg}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Report */}
        <AnimatePresence>
          {advice && (
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="gc"
              style={{ borderColor: "rgba(200,250,100,0.2)", background: "linear-gradient(135deg,rgba(200,250,100,0.03),transparent)", marginBottom: 14 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#C8FA64", display: "inline-block", boxShadow: "0 0 8px #C8FA64" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#C8FA64", letterSpacing: "0.08em" }}>
                  AI CA ANALYSIS · {new Date().toLocaleDateString("en-IN")}
                </span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.85, color: "#d4d4d8", whiteSpace: "pre-line" }}>{advice}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Static CA Hacks */}
        <div className="gc">
          <p className="sh">CA-Approved Hacks 🇮🇳</p>
          {[
            "₹1,000/mo SIP in Nifty 50 Index Fund → ₹23L+ in 10 years at 12%",
            "6-month emergency fund in Liquid Fund (better returns than savings a/c)",
            "PPF: ₹1.5L/year = tax-free 7.1% + Section 80C deduction",
            "Use credit card for all expenses → cashback/air miles on essentials",
            "Annual OTT plans save 30-40% vs monthly renewals",
            "D-Mart bulk buying for staples = ~18% savings vs daily kirana",
          ].map((tip, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
              <span style={{ color: "#C8FA64", fontSize: 12, marginTop: 2, flexShrink: 0 }}>→</span>
              <p style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.6 }}>{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </PageMotion>
  );
}
