import { motion } from "framer-motion";

const NAV_ITEMS = [
  {
    id: "home",
    label: "Home",
    icon: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <path d="M9 22V12h6v10" />
      </svg>
    ),
  },
  {
    id: "add",
    label: "Add",
    icon: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    id: "history",
    label: "History",
    icon: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
      </svg>
    ),
  },
  {
    id: "charts",
    label: "Insights",
    icon: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
  },
  {
    id: "advisor",
    label: "Advisor",
    icon: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
];

export function BottomNav({ tab, setTab }) {
  return (
    <nav className="bnav" role="navigation" aria-label="Main navigation">
      {NAV_ITEMS.map((n) => {
        const active = tab === n.id;
        return (
          <button
            key={n.id}
            id={`nav-${n.id}`}
            className={`nb ${active ? "nba" : ""}`}
            onClick={() => setTab(n.id)}
            aria-current={active ? "page" : undefined}
            aria-label={n.label}
          >
            <span className={`nb-icon ${active ? "nb-icon-active" : ""}`}>
              {n.icon}
            </span>
            <span className="nb-label">{n.label}</span>
            {active && (
              <motion.span
                className="ndot"
                layoutId="nav-dot"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
