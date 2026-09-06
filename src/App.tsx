import { useEffect, useState } from "react";
import { useStore } from "./lib/store";
import { Onboarding } from "./screens/Onboarding";
import { Home } from "./screens/Home";
import { Foods } from "./screens/Foods";
import { Reactions } from "./screens/Reactions";
import { Insights } from "./screens/Insights";
import { Profile } from "./screens/Profile";
import { CheckFood } from "./screens/CheckFood";
import { UpgradeSheet } from "./components/UpgradeSheet";
import { Toast } from "./components/ui";
import {
  HomeIcon,
  ListIcon,
  PulseIcon,
  UserIcon,
  PlusIcon,
} from "./components/icons";

export type Tab = "home" | "foods" | "reactions" | "profile" | "insights";

export default function App() {
  const { state } = useStore();
  const [tab, setTab] = useState<Tab>("home");
  const [checkOpen, setCheckOpen] = useState(false);
  const [upgrade, setUpgrade] = useState<{ open: boolean; reason?: string }>({
    open: false,
  });
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  function openUpgrade(reason?: string) {
    setUpgrade({ open: true, reason });
  }

  if (!state.onboarded) {
    return (
      <div className="app">
        <Onboarding />
      </div>
    );
  }

  return (
    <div className="app">
      {tab === "home" && (
        <Home
          onCheck={() => setCheckOpen(true)}
          onUpgrade={() => openUpgrade()}
          go={setTab}
        />
      )}
      {tab === "foods" && (
        <Foods onCheck={() => setCheckOpen(true)} onUpgrade={() => openUpgrade()} />
      )}
      {tab === "reactions" && <Reactions />}
      {tab === "insights" && <Insights onUpgrade={() => openUpgrade("Unlock insights and see your patterns.")} />}
      {tab === "profile" && (
        <Profile onUpgrade={() => openUpgrade()} onToast={setToast} />
      )}

      <nav className="tabbar">
        <TabButton
          label="Home"
          active={tab === "home"}
          onClick={() => setTab("home")}
          icon={<HomeIcon />}
        />
        <TabButton
          label="Foods"
          active={tab === "foods"}
          onClick={() => setTab("foods")}
          icon={<ListIcon />}
        />
        <div className="tab fab">
          <button
            className="fab-btn"
            aria-label="Check a food"
            onClick={() => setCheckOpen(true)}
          >
            <PlusIcon />
          </button>
        </div>
        <TabButton
          label="Reactions"
          active={tab === "reactions"}
          onClick={() => setTab("reactions")}
          icon={<PulseIcon />}
        />
        <TabButton
          label="Profile"
          active={tab === "profile"}
          onClick={() => setTab("profile")}
          icon={<UserIcon />}
        />
      </nav>

      <CheckFood
        open={checkOpen}
        onClose={() => setCheckOpen(false)}
        onNeedUpgrade={(reason) => {
          setCheckOpen(false);
          openUpgrade(reason ?? "You've reached the free limit of saved foods.");
        }}
        onSaved={setToast}
      />
      <UpgradeSheet
        open={upgrade.open}
        reason={upgrade.reason}
        onClose={() => setUpgrade({ open: false })}
      />
      {toast && <Toast message={toast} />}
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button className={`tab ${active ? "active" : ""}`} onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  );
}
