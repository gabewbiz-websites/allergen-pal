import { useState } from "react";
import { useStore } from "../lib/store";
import { Sheet } from "./ui";
import { CrownIcon } from "./icons";

const FEATURES = [
  { fi: "📊", title: "Trends & insights", desc: "See which allergens trigger you most and spot patterns over time." },
  { fi: "♾️", title: "Unlimited food history", desc: "Save every food you check — free keeps your last 10." },
  { fi: "🆔", title: "Emergency card export", desc: "Share or print a card with your allergies for schools, sitters & ER." },
  { fi: "👨‍👩‍👧", title: "Family profiles", desc: "Track allergens for your kids and loved ones in one place." },
  { fi: "☁️", title: "Cloud backup", desc: "Keep your data safe and synced across your devices." },
];

type Plan = "monthly" | "yearly";

export function UpgradeSheet({
  open,
  onClose,
  reason,
}: {
  open: boolean;
  onClose: () => void;
  reason?: string;
}) {
  const { dispatch } = useStore();
  const [plan, setPlan] = useState<Plan>("yearly");

  function purchase() {
    // Monetization hook: replace with Stripe / RevenueCat / App Store IAP.
    // The `isPro` flag is the single gate every premium feature reads.
    dispatch({ type: "setPro", isPro: true });
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
          price="$29.99 / yr"
          sub="Just $2.50/mo · Save 50%"
          badge="Best value"
        />
        <PlanOption
          selected={plan === "monthly"}
          onClick={() => setPlan("monthly")}
          title="Monthly"
          price="$4.99 / mo"
          sub="Billed monthly · cancel anytime"
        />
      </div>

      <button className="btn gold" style={{ marginTop: 16 }} onClick={purchase}>
        Start 7-day free trial
      </button>
      <p className="tiny muted" style={{ textAlign: "center", marginTop: 10 }}>
        Then {plan === "yearly" ? "$29.99/year" : "$4.99/month"}. Cancel anytime.
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
