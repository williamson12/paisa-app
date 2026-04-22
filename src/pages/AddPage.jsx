import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { PageMotion } from "../components/UI.jsx";
import { CATEGORIES, PAY_MODES } from "../utils/constants.js";
import { todayStr, validateTransaction, uid } from "../utils/formatters.js";

const QUICK_ITEMS = [
  { l: "Rent",       c: "Rent",             a: 11000 },
  { l: "Groceries",  c: "Groceries & Food", a: 500 },
  { l: "Coffee",     c: "Dining Out",       a: 60 },
  { l: "Petrol",     c: "Transport",        a: 200 },
  { l: "Quick",      c: "Miscellaneous",    a: 100 },
  { l: "Quick",      c: "Miscellaneous",    a: 500 },
];

export function AddPage({ data, save, showToast }) {
  const [type,    setType]    = useState("expense");
  const [amount,  setAmount]  = useState("");
  const [cat,     setCat]     = useState("Groceries & Food");
  const [note,    setNote]    = useState("");
  const [date,    setDate]    = useState(todayStr());
  const [pay,     setPay]     = useState("UPI");
  const [loading, setLoading] = useState(false);
  const amountRef = useRef();

  useEffect(() => { amountRef.current?.focus(); }, []);

  const submit = async () => {
    const err = validateTransaction({ amount, date });
    if (err) { showToast(err, "err"); return; }
    setLoading(true);
    await save({
      ...data,
      transactions: [
        ...(data.transactions || []),
        { type, amount: parseFloat(amount), category: cat, note: note.trim().slice(0, 120), date, payMode: pay, id: uid() },
      ],
    });
    setLoading(false);
    showToast(type === "expense" ? `Recorded −₹${parseFloat(amount)}` : `Added +₹${parseFloat(amount)}`);
    setAmount(""); setNote(""); setDate(todayStr());
    amountRef.current?.focus();
  };

  const isExpense = type === "expense";

  return (
    <PageMotion>
      <div className="pg">
        <p className="ptitle">Add</p>

        {/* Type Toggle */}
        <div className="ttog" role="group" aria-label="Transaction type">
          <button
            id="type-expense"
            className={`topt ${isExpense ? "texp" : ""}`}
            onClick={() => { setType("expense"); setCat("Groceries & Food"); }}
          >
            Expense
          </button>
          <button
            id="type-income"
            className={`topt ${!isExpense ? "tinc" : ""}`}
            onClick={() => { setType("income"); setCat("Miscellaneous"); }}
          >
            Income
          </button>
        </div>

        {/* Amount Input */}
        <div className="awrap">
          <span className="asym">₹</span>
          <input
            ref={amountRef}
            id="add-amount"
            className="ainp"
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            style={{ color: isExpense ? "#FF6B6B" : "#4ADE80" }}
            aria-label="Amount"
          />
        </div>

        {/* Fields */}
        <div className="fstack">
          <div className="fw">
            <label className="fl" htmlFor="add-category">Category</label>
            <select id="add-category" className="fs" value={cat} onChange={e => setCat(e.target.value)}>
              {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div className="fw">
            <label className="fl" htmlFor="add-note">Note</label>
            <input
              id="add-note"
              className="fi"
              placeholder="What was this for?"
              value={note}
              maxLength={120}
              onChange={e => setNote(e.target.value)}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="fw">
              <label className="fl" htmlFor="add-date">Date</label>
              <input id="add-date" className="fi" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="fw">
              <label className="fl" htmlFor="add-pay">Via</label>
              <select id="add-pay" className="fs" value={pay} onChange={e => setPay(e.target.value)}>
                {PAY_MODES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* CTA */}
        <motion.button
          id="add-submit"
          className="ctab"
          onClick={submit}
          disabled={loading}
          style={{
            background: isExpense
              ? "linear-gradient(135deg,#FF6B6B,#EF4444)"
              : "linear-gradient(135deg,#4ADE80,#16A34A)",
            color: isExpense ? "#fff" : "#000",
          }}
          whileHover={{ y: -2 }}
          whileTap={{ y: 0, scale: 0.98 }}
        >
          {loading ? "Recording…" : isExpense ? "Record Expense →" : "Add Income →"}
        </motion.button>

        {/* Quick Add */}
        <p className="fl" style={{ marginTop: 24, marginBottom: 10 }}>Quick add</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {QUICK_ITEMS.map((q, i) => (
            <motion.button
              key={i}
              className="qchip"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setType("expense"); setAmount(String(q.a)); setCat(q.c); setNote(q.l); }}
            >
              {q.l} <span style={{ color: "#C8FA64" }}>₹{q.a}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </PageMotion>
  );
}
