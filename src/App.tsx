import { useEffect, useState } from "react";
import { useStore } from "./lib/store";
import { Onboarding } from "./screens/Onboarding";
import { Recipes } from "./screens/Recipes";
import { Foods } from "./screens/Foods";
import { Reactions } from "./screens/Reactions";
import { Insights } from "./screens/Insights";
import { Profile } from "./screens/Profile";
import { CheckFood } from "./screens/CheckFood";
import { ConvertRecipe } from "./components/ConvertRecipe";
import { UpgradeSheet } from "./components/UpgradeSheet";
import { Toast } from "./components/ui";
import { PulseIcon, UserIcon, SearchIcon } from "./components/icons";

export type Tab = "recipes" | "check" | "reactions" | "profile" | "insights";

export default function App() {
  const { state } = useStore();
  const [tab, setTab] = useState<Tab>("recipes");
  const [checkOpen, setCheckOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
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
      {tab === "recipes" && (
        <Recipes
          onConvert={() => setConvertOpen(true)}
          onUpgrade={() => openUpgrade()}
          go={setTab}
        />
      )}
      {tab === "check" && (
        <Foods onCheck={() => setCheckOpen(true)} onUpgrade={() => openUpgrade()} />
      )}
      {tab === "reactions" && <Reactions />}
      {tab === "insights" && (
        <Insights onUpgrade={() => openUpgrade("Unlock insights and see your patterns.")} />
      )}
      {tab === "profile" && (
        <Profile onUpgrade={() => openUpgrade()} onToast={setToast} />
      )}

      <nav className="tabbar">
        <TabButton
          label="Recipes"
          active={tab === "recipes"}
          onClick={() => setTab("recipes")}
          icon={<ChefIcon />}
        />
        <TabButton
          label="Check"
          active={tab === "check"}
          onClick={() => setTab("check")}
          icon={<SearchIcon />}
        />
        <div className="tab fab">
          <button
            className="fab-btn"
            aria-label="Convert a recipe"
            onClick={() => setConvertOpen(true)}
          >
            <ChefIcon light />
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

      <ConvertRecipe
        open={convertOpen}
        onClose={() => setConvertOpen(false)}
        onNeedUpgrade={(reason) => {
          setConvertOpen(false);
          openUpgrade(reason);
        }}
        onSaved={setToast}
      />
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

function ChefIcon({ light }: { light?: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke={light ? "#fff" : "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 21h10" />
      <path d="M7 21v-6h10v6" />
      <path d="M17 15a4 4 0 0 0 1-7.9A4.5 4.5 0 0 0 9.5 5 4 4 0 0 0 6 7.1 4 4 0 0 0 7 15" />
    </svg>
  );
}
