import { lazy, Suspense, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { BottomNav }     from "./components/BottomNav.jsx";
import { SetupModal, ProfileModal } from "./components/Modals.jsx";
import { Splash, Toast } from "./components/UI.jsx";
import { LoginPage }     from "./pages/LoginPage.jsx";
import { useAuth }       from "./hooks/useAuth.js";
import { useUserData }   from "./hooks/useUserData.js";
import { useToast }      from "./hooks/useToast.js";
import { useFinancials } from "./hooks/useFinancials.js";
import { fmt, fmtS }     from "./utils/formatters.js";

// Lazy-load heavy pages for code splitting
const HomePage    = lazy(() => import("./pages/HomePage.jsx").then(m => ({ default: m.HomePage })));
const AddPage     = lazy(() => import("./pages/AddPage.jsx").then(m => ({ default: m.AddPage })));
const HistoryPage = lazy(() => import("./pages/HistoryPage.jsx").then(m => ({ default: m.HistoryPage })));
const ChartsPage  = lazy(() => import("./pages/ChartsPage.jsx").then(m => ({ default: m.ChartsPage })));
const AdvisorPage = lazy(() => import("./pages/AdvisorPage.jsx").then(m => ({ default: m.AdvisorPage })));

export default function App() {
  return (
    <ErrorBoundary>
      <AuthGate />
    </ErrorBoundary>
  );
}

/* ── Auth Gate: handles splash → login → app ── */
function AuthGate() {
  const { authState, user, error, signIn, signOutUser } = useAuth();
  const [signInLoading, setSignInLoading] = useState(false);

  const handleSignIn = async () => {
    setSignInLoading(true);
    await signIn();
    setSignInLoading(false);
  };

  if (authState === "loading") {
    return <Splash />;
  }

  if (authState === "signed-out") {
    return (
      <LoginPage
        onSignIn={handleSignIn}
        error={error}
        loading={signInLoading}
      />
    );
  }

  return <MainApp user={user} onSignOut={signOutUser} />;
}

/* ── Main App: data + layout ── */
function MainApp({ user, onSignOut }) {
  const { data, loaded, needsSetup, setNeedsSetup, save } = useUserData(user.uid);
  const { toast, showToast } = useToast();
  const financials = useFinancials(data);

  const [tab,     setTab]     = useState("home");
  const [setup,   setSetup]   = useState(false);
  const [profile, setProfile] = useState(false);

  // Open setup automatically when new user has no data
  if (!setup && needsSetup) {
    setNeedsSetup(false);
    setSetup(true);
  }

  if (!loaded) {
    return <Splash subtitle="Syncing your data…" />;
  }

  const pages = {
    home:    <HomePage    data={data} financials={financials} fmt={fmt} fmtS={fmtS} user={user} openSetup={() => setSetup(true)} openProfile={() => setProfile(true)} />,
    add:     <AddPage     data={data} save={save} showToast={showToast} />,
    history: <HistoryPage data={data} save={save} showToast={showToast} fmt={fmt} />,
    charts:  <ChartsPage  financials={financials} fmt={fmt} fmtS={fmtS} />,
    advisor: <AdvisorPage data={data} financials={financials} fmt={fmt} />,
  };

  return (
    <div className="app-root">
      <div className="app-shell">
        {/* Page content with lazy loading + transition */}
        <Suspense fallback={<Splash subtitle="Loading…" />}>
          <AnimatePresence mode="wait">
            <div key={tab}>{pages[tab]}</div>
          </AnimatePresence>
        </Suspense>

        {/* Bottom Navigation */}
        <BottomNav tab={tab} setTab={setTab} />
      </div>

      {/* Modals */}
      <AnimatePresence>
        {setup && (
          <SetupModal
            key="setup"
            data={data}
            save={save}
            close={() => setSetup(false)}
            showToast={showToast}
          />
        )}
        {profile && (
          <ProfileModal
            key="profile"
            user={user}
            onSignOut={onSignOut}
            close={() => setProfile(false)}
            data={data}
            spent={financials.spent}
            sRate={financials.sRate}
            fmtS={fmtS}
          />
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <Toast toast={toast} />
    </div>
  );
}
