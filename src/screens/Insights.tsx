import { useMemo } from "react";
import { useStore } from "../lib/store";
import { CrownIcon, LockIcon } from "../components/icons";

export function Insights({ onUpgrade }: { onUpgrade: () => void }) {
  const { state } = useStore();
  const { reactions, foods, profile } = state;

  const triggers = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of reactions) {
      const key = r.suspectedTrigger.trim() || "Unknown";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [reactions]);

  const bySeverity = useMemo(() => {
    const c = { mild: 0, moderate: 0, severe: 0 };
    for (const r of reactions) c[r.severity]++;
    return c;
  }, [reactions]);

  const last6 = useMemo(() => {
    const now = new Date();
    const buckets: { label: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString(undefined, { month: "short" });
      const count = reactions.filter((r) => {
        const rd = new Date(r.occurredAt);
        return (
          rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth()
        );
      }).length;
      buckets.push({ label, count });
    }
    return buckets;
  }, [reactions]);

  const maxMonth = Math.max(1, ...last6.map((b) => b.count));
  const maxTrigger = Math.max(1, ...triggers.map((t) => t[1]));
  const safeRate =
    foods.length === 0
      ? 0
      : Math.round(
          (foods.filter((f) => f.verdict === "safe").length / foods.length) * 100,
        );

  return (
    <div className="screen">
      <div className="screen-head">
        <div>
          <div className="screen-title">Insights</div>
          <div className="screen-sub">Understand your patterns</div>
        </div>
      </div>

      <div style={profile.isPro ? undefined : { position: "relative" }}>
        <div
          style={
            profile.isPro
              ? undefined
              : { filter: "blur(5px)", pointerEvents: "none", userSelect: "none" }
          }
        >
          <div className="stat-grid">
            <div className="stat">
              <div className="num">{reactions.length}</div>
              <div className="lbl">Total reactions</div>
            </div>
            <div className="stat">
              <div className="num">{safeRate}%</div>
              <div className="lbl">Foods safe</div>
            </div>
            <div className="stat">
              <div className="num">{bySeverity.severe}</div>
              <div className="lbl">Severe</div>
            </div>
          </div>

          <div className="section-label">Reactions over time</div>
          <div className="card">
            <div className="bar-chart">
              {last6.map((b) => (
                <div className="bar-col" key={b.label}>
                  <div className="tiny muted">{b.count || ""}</div>
                  <div
                    className="bar"
                    style={{ height: `${(b.count / maxMonth) * 100}%` }}
                  />
                  <div className="bar-lbl">{b.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="section-label">Top suspected triggers</div>
          <div className="card">
            {triggers.length === 0 ? (
              <p className="tiny muted">No reactions logged yet.</p>
            ) : (
              triggers.map(([name, count]) => (
                <div key={name} style={{ padding: "8px 0" }}>
                  <div className="spread" style={{ marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{name}</span>
                    <span className="tiny muted">
                      {count}×
                    </span>
                  </div>
                  <div
                    style={{
                      height: 8,
                      borderRadius: 4,
                      background: "var(--teal-tint)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${(count / maxTrigger) * 100}%`,
                        background: "var(--teal)",
                        borderRadius: 4,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {!profile.isPro && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              padding: 24,
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 18,
                background: "var(--card)",
                boxShadow: "var(--shadow)",
                display: "grid",
                placeItems: "center",
                color: "var(--teal)",
              }}
            >
              <LockIcon size={28} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 800, fontSize: 18 }}>
                Insights are a Pro feature
              </div>
              <div className="tiny muted" style={{ marginTop: 4, maxWidth: 260 }}>
                Unlock trends, top triggers, and safe-rate tracking to understand
                your reactions.
              </div>
            </div>
            <button
              className="btn gold"
              style={{ width: "auto", padding: "13px 22px" }}
              onClick={onUpgrade}
            >
              <CrownIcon size={18} /> Unlock with Pro
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
