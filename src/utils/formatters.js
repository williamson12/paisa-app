/** Safe numeric coerce — returns 0 for NaN/Infinity */
export const safe = (n) => (isFinite(n) && !isNaN(n) ? n : 0);

/** INR full format: ₹1,23,456 */
export const fmt = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(safe(n));

/** INR short format: ₹1.2L / ₹45K / ₹890 */
export const fmtS = (n) => {
  const v = safe(n);
  if (v >= 100_000) return `₹${(v / 100_000).toFixed(1)}L`;
  if (v >= 1_000)   return `₹${(v / 1_000).toFixed(1)}K`;
  return `₹${Math.round(v)}`;
};

/** Today's date as YYYY-MM-DD */
export const todayStr = () => new Date().toISOString().split("T")[0];

/** Detect mobile browsers and touch-first narrow devices. */
export const isMobile = () => {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  const ua = navigator.userAgent || "";
  const mobileUa = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Silk|Kindle/i.test(ua);
  const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;

  return mobileUa || (coarsePointer && window.innerWidth < 900);
};

/** Clamp a value between min and max */
export const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

/** Generate a unique ID */
export const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Validate a transaction before saving.
 * Returns null on success or an error string.
 */
export const validateTransaction = ({ amount, date }) => {
  const parsed = parseFloat(amount);
  if (!amount || isNaN(parsed) || parsed <= 0) return "Enter a valid amount greater than 0.";
  if (parsed > 10_000_000) return "Amount too large. Max ₹1 Crore per transaction.";
  if (!date) return "Please select a date.";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "Invalid date.";
  const future = new Date(); future.setFullYear(future.getFullYear() + 1);
  if (d > future) return "Date cannot be more than 1 year in the future.";
  return null;
};

/**
 * Validate setup form (income / budget).
 * Returns null on success or an error string.
 */
export const validateSetup = ({ income }) => {
  const parsed = parseFloat(income);
  if (!income || isNaN(parsed) || parsed <= 0) return "Enter a valid monthly income.";
  if (parsed > 100_000_000) return "Income value is unrealistically large.";
  return null;
};
