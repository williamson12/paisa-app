import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { PageMotion } from "../components/UI.jsx";
import { safe } from "../utils/formatters.js";

const TOOLTIP_STYLE = {
  background: "#111116",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  color: "#fff",
  fontSize: 12,
};

export function ChartsPage({ financials, fmt, fmtS }) {
  const { txns, catData, last7, spent, sRate } = financials;

  const payModeData = Object.entries(
    txns
      .filter(t => t.type === "expense")
      .reduce((acc, t) => { acc[t.payMode] = (acc[t.payMode] || 0) + (t.amount || 0); return acc; }, {})
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <PageMotion>
      <div className="pg">
        <p className="ptitle">Insights</p>

        {/* KPI Cards */}
        <div className="r2c" style={{ marginBottom: 14 }}>
          {[
            { l: "Total Spent",  v: fmtS(spent), c: "#FF6B6B", i: "📉" },
            { l: "Savings Rate", v: `${sRate.toFixed(0)}%`, c: sRate >= 20 ? "#C8FA64" : "#FBBF24", i: "📈" },
          ].map(s => (
            <div key={s.l} className="gc fcc" style={{ gap: 4 }}>
              <span style={{ fontSize: 22 }}>{s.i}</span>
              <p style={{ fontFamily: "'Bricolage Grotesque',serif", fontSize: 24, fontWeight: 900, color: s.c }}>{s.v}</p>
              <p style={{ fontSize: 11, color: "#a1a1aa" }}>{s.l}</p>
            </div>
          ))}
        </div>

        {/* 7-Day Bar Chart */}
        <div className="gc" style={{ marginBottom: 14 }}>
          <p className="sh">Last 7 Days</p>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={last7} margin={{ top: 0, right: 0, left: -22, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#a1a1aa", fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
              <Tooltip
                formatter={v => [fmt(v), "Spent"]}
                contentStyle={TOOLTIP_STYLE}
                cursor={{ fill: "rgba(200,250,100,0.04)" }}
              />
              <Bar dataKey="spent" fill="#C8FA64" radius={[6, 6, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Donut */}
        {catData.length > 0 && (
          <div className="gc" style={{ marginBottom: 14 }}>
            <p className="sh">Category Breakdown</p>
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie
                  data={catData} cx="50%" cy="50%"
                  innerRadius={48} outerRadius={72}
                  dataKey="total" paddingAngle={3} strokeWidth={0}
                >
                  {catData.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Pie>
                <Tooltip
                  formatter={v => [fmt(v)]}
                  contentStyle={TOOLTIP_STYLE}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
              {catData.map(c => (
                <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: c.color, display: "inline-block" }} />
                  <span style={{ color: "#a1a1aa" }}>{c.name.split(" ")[0]}</span>
                  <span style={{ color: c.color, fontWeight: 700 }}>{safe(c.total / spent * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment Methods */}
        {payModeData.length > 0 && (
          <div className="gc">
            <p className="sh">Payment Methods</p>
            {payModeData.map(p => (
              <div key={p.name} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 13, color: "#d4d4d8" }}>{p.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#C8FA64" }}>{fmt(p.value)}</span>
                </div>
                <div className="st">
                  <div className="sf" style={{ width: `${safe(p.value / spent * 100)}%`, background: "linear-gradient(90deg,#C8FA64,#86EFAC)" }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageMotion>
  );
}
