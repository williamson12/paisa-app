import { useMemo } from "react";
import { safe } from "../utils/formatters";
import { CATEGORIES } from "../utils/constants";

/**
 * Derives all computed financial metrics from raw data.
 * Memoised so child pages don't re-compute on every render.
 */
export function useFinancials(data) {
  return useMemo(() => {
    const txns   = data.transactions || [];
    const spent  = safe(txns.filter(t => t.type === "expense").reduce((s, t) => s + (t.amount || 0), 0));
    const extraIncome = safe(txns.filter(t => t.type === "income").reduce((s, t) => s + (t.amount || 0), 0));
    const income = safe((data.monthlyIncome || 0) + extraIncome);
    const balance = safe(income - spent);
    const budget  = safe(data.monthlyBudget || 0);
    const bPct    = budget > 0 ? Math.min(safe(spent / budget * 100), 100) : 0;
    const savings = safe((data.monthlyIncome || 0) - spent);
    const sRate   = data.monthlyIncome > 0 ? Math.max(0, safe(savings / data.monthlyIncome * 100)) : 0;

    const catData = CATEGORIES
      .map(c => ({
        ...c,
        total: safe(txns.filter(t => t.type === "expense" && t.category === c.name).reduce((s, t) => s + (t.amount || 0), 0)),
      }))
      .filter(c => c.total > 0)
      .sort((a, b) => b.total - a.total);

    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const ds = d.toISOString().split("T")[0];
      return {
        day: d.toLocaleDateString("en-IN", { weekday: "short" }),
        spent: safe(txns.filter(t => t.type === "expense" && t.date === ds).reduce((s, t) => s + (t.amount || 0), 0)),
      };
    });

    const healthScore = Math.min(10, Math.max(1, Math.round(sRate / 10)));

    return { txns, spent, income, balance, budget, bPct, savings, sRate, catData, last7, healthScore };
  }, [data]);
}
