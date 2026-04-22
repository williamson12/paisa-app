export const STORAGE_KEY = "paisa_v2_data";

export const CATEGORIES = [
  { name: "Groceries & Food",    icon: "🛒", color: "#C8FA64" },
  { name: "EMI / Loan",          icon: "🏦", color: "#FF6B6B" },
  { name: "Rent",                icon: "🏠", color: "#A78BFA" },
  { name: "Utilities",           icon: "💡", color: "#60A5FA" },
  { name: "Transport",           icon: "🚗", color: "#34D399" },
  { name: "Education",           icon: "📚", color: "#FBBF24" },
  { name: "Medical",             icon: "💊", color: "#F87171" },
  { name: "Entertainment",       icon: "🎬", color: "#F472B6" },
  { name: "Clothing",            icon: "👗", color: "#C084FC" },
  { name: "Savings / Investment",icon: "💰", color: "#4ADE80" },
  { name: "Dining Out",          icon: "🍽️",  color: "#FB923C" },
  { name: "Online Shopping",     icon: "📦", color: "#38BDF8" },
  { name: "Subscriptions",       icon: "📱", color: "#818CF8" },
  { name: "Religious / Charity", icon: "🙏", color: "#FDE68A" },
  { name: "Miscellaneous",       icon: "✦",  color: "#94A3B8" },
];

export const PAY_MODES = ["UPI", "Cash", "Credit Card", "Debit Card", "Net Banking", "EMI", "Cheque"];

export const DEFAULT_DATA = { monthlyIncome: 0, monthlyBudget: 0, transactions: [] };
