import { useState } from "react";
import { Sheet } from "./ui";
import { CrownIcon } from "./icons";
import { useBilling } from "../lib/useBilling";
import { BILLING } from "../lib/billing";
import type { Plan } from "../lib/types";

const FEATURES = [
  { fi: "📊", title: "Trends & insights", desc: "See which allergens trigger you most and spot patterns over time." },
  { fi: "♾️", title: "Unlimited food history", desc: "Save every food you check — free keeps your last 10." },
  { fi: "🆔", title: "Emergency card export", desc: "Share or print a card with your allergies for schools, sitters & ER." },
  { fi: "👨‍👩‍👧", title: "Family profiles", desc: "Track allergens for your kids and loved ones in one place." },
  { fi: "☁️", title: "Cloud backup", desc: "Keep your data safe and synced across your devices." },
];

export function UpgradeSheet({
  open,
  onClose,
  reason,
}: {
  open: boolean;
  onClose: () => void;
  reason?: string;
}) {
  const { startCheckout } = useBilling();
  const [plan, setPlan] = useState<Plan>("yearly");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function purchase() {
    setBusy(true);
    setError(null);
    // In simulated mode this starts a local trial; in Stripe mode it hands off
    // to Stripe Checkout (which redirects away).
    const res = await startCheckout(plan);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Something went wrong. Please try again.");
      return;
    }
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="pro-hero">
        <div className="crown">
          <CrownIcon size={44} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginTop: 6 }}>
          Allergen Pal Pro
        </h2>
        <p style={{ opacity: 0.9, marginTop: 6, fontSize: 14 }}>
          {reason ?? "Unlock everything you need to stay safe with confidence."}
        </p>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        {FEATURES.map((f) => (
          <div className="feature-line" key={f.title}>
            <div className="fi">{f.fi}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{f.title}</div>
              <div className="muted tiny" style={{ marginTop: 2 }}>
                {f.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <PlanOption
          selected={plan === "yearly"}
          onClick={() => setPlan("yearly")}
          title="Yearly"
          price={`${BILLING.prices.yearly.amount} / yr`}
          sub={`Just ${BILLING.prices.yearly.perMonth}/mo · Save ${BILLING.prices.yearly.savingsPct}%`}
          badge="Best value"
        />
        <PlanOption
          selected={plan === "monthly"}
          onClick={() => setPlan("monthly")}
          title="Monthly"
          price={`${BILLING.prices.monthly.amount} / mo`}
          sub="Billed monthly · cancel anytime"
        />
      </div>

      <button
        className="btn gold"
        style={{ marginTop: 16 }}
        onClick={purchase}
        disabled={busy}
      >
        {busy ? "Starting…" : `Start ${BILLING.trialDays}-day free trial`}
      </button>
      {error && (
        <p className="tiny" style={{ textAlign: "center", marginTop: 10, color: "var(--avoid)" }}>
          {error}
        </p>
      )}
      <p className="tiny muted" style={{ textAlign: "center", marginTop: 10 }}>
        Then{" "}
        {plan === "yearly"
          ? `${BILLING.prices.yearly.amount}/year`
          : `${BILLING.prices.monthly.amount}/month`}
        . Cancel anytime.
      </p>
      <button
        className="btn ghost"
        style={{ marginTop: 4 }}
        onClick={onClose}
      >
        Maybe later
      </button>
    </Sheet>
  );
}

function PlanOption({
  selected,
  onClick,
  title,
  price,
  sub,
  badge,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  price: string;
  sub: string;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="card"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        textAlign: "left",
        marginBottom: 10,
        border: `2px solid ${selected ? "var(--teal)" : "transparent"}`,
        padding: 16,
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          border: `2px solid ${selected ? "var(--teal)" : "var(--line)"}`,
          background: selected ? "var(--teal)" : "#fff",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        {selected && (
          <div
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: "#fff",
            }}
          />
        )}
      </div>
      <div style={{ flex: 1 }}>
        <div className="row" style={{ gap: 8 }}>
          <span style={{ fontWeight: 800, fontSize: 16 }}>{title}</span>
          {badge && <span className="pro-badge">{badge}</span>}
        </div>
        <div className="tiny muted" style={{ marginTop: 2 }}>
          {sub}
        </div>
      </div>
      <div style={{ fontWeight: 800 }}>{price}</div>
    </button>
  );
}
