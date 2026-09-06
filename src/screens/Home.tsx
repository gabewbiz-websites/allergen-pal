import { useStore } from "../lib/store";
import { relTime } from "../components/ui";
import { SearchIcon, ChartIcon, ShieldIcon, CrownIcon } from "../components/icons";
import type { Tab } from "../App";
import { ProfileSwitcher } from "../components/ProfileSwitcher";

export function Home({
  onCheck,
  onUpgrade,
  go,
}: {
  onCheck: () => void;
  onUpgrade: () => void;
  go: (tab: Tab) => void;
}) {
  const { state, active, ent } = useStore();
  const { allergens, foods, reactions } = active;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const severeCount = allergens.filter((a) => a.severity === "severe").length;
  const recent = foods.slice(0, 3);
  const name = active.profile.relation === "self" ? active.profile.name : active.profile.name;

  return (
    <div className="screen">
      <div className="screen-head">
        <div>
          <div className="screen-sub">{greeting}</div>
          <div className="screen-title">{name || "Welcome"} 👋</div>
        </div>
        {ent.isPro ? (
          <span className="pro-badge">
            <CrownIcon size={13} /> PRO
          </span>
        ) : (
          <button className="pro-badge" onClick={onUpgrade}>
            <CrownIcon size={13} /> Go Pro
          </button>
        )}
      </div>

      {state.profiles.length > 1 && <ProfileSwitcher onUpgrade={onUpgrade} />}

      <button
        className="card"
        onClick={onCheck}
        style={{
          width: "100%",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          gap: 14,
          background: "linear-gradient(140deg, #0f9d8f, #0b7d72)",
          color: "#fff",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: "rgba(255,255,255,0.2)",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <SearchIcon size={26} />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18 }}>Check a food</div>
          <div style={{ opacity: 0.9, fontSize: 13 }}>
            Scan or paste ingredients for hidden allergens
          </div>
        </div>
      </button>

      <div className="stat-grid" style={{ marginTop: 14 }}>
        <div className="stat">
          <div className="num">{allergens.length}</div>
          <div className="lbl">Allergens</div>
        </div>
        <div className="stat">
          <div className="num">{foods.length}</div>
          <div className="lbl">Foods checked</div>
        </div>
        <div className="stat">
          <div className="num">{reactions.length}</div>
          <div className="lbl">Reactions</div>
        </div>
      </div>

      <div className="section-label">Your allergens</div>
      {allergens.length === 0 ? (
        <button
          className="card"
          onClick={() => go("profile")}
          style={{ width: "100%", textAlign: "left" }}
        >
          <div className="row">
            <ShieldIcon size={22} />
            <div>
              <div style={{ fontWeight: 700 }}>Set up your allergens</div>
              <div className="tiny muted">Tap to tell us what to watch for</div>
            </div>
          </div>
        </button>
      ) : (
        <div className="card">
          <div className="spread" style={{ marginBottom: 12 }}>
            <span className="tiny muted">
              {severeCount > 0
                ? `${severeCount} severe · strictly avoid`
                : "Tap Profile to manage"}
            </span>
            <button className="link tiny" onClick={() => go("profile")}>
              Manage
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {allergens.map((a) => (
              <span
                key={a.id}
                className="chip"
                style={{ padding: "8px 12px", width: "auto" }}
              >
                <span className="emoji" style={{ fontSize: 18 }}>
                  {a.emoji}
                </span>
                <span className="chip-label" style={{ fontSize: 14 }}>
                  {a.label}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="section-label">Insights</div>
      <button
        className="card"
        onClick={() => go("insights")}
        style={{ width: "100%", textAlign: "left" }}
      >
        <div className="spread">
          <div className="row">
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: "var(--teal-tint)",
                color: "var(--teal-dark)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <ChartIcon size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>Trends & insights</div>
              <div className="tiny muted">Spot your reaction patterns</div>
            </div>
          </div>
          {!ent.isPro && (
            <span className="pro-badge">
              <CrownIcon size={12} /> PRO
            </span>
          )}
        </div>
      </button>

      {recent.length > 0 && (
        <>
          <div className="section-label">Recent checks</div>
          <div className="card">
            {recent.map((f) => (
              <div className="item" key={f.id}>
                <div
                  className="lead"
                  style={{
                    background:
                      f.verdict === "safe"
                        ? "var(--safe-tint)"
                        : f.verdict === "caution"
                          ? "var(--caution-tint)"
                          : "var(--avoid-tint)",
                  }}
                >
                  {f.verdict === "safe" ? "✅" : f.verdict === "caution" ? "⚠️" : "⛔"}
                </div>
                <div className="grow">
                  <div className="name">{f.name}</div>
                  <div className="tiny muted">{relTime(f.createdAt)}</div>
                </div>
                <span className={`pill ${f.verdict}`}>{f.verdict}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
