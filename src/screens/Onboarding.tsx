import { useState } from "react";
import { ALLERGEN_CATALOG } from "../lib/allergens";
import { useStore } from "../lib/store";
import type { Severity, UserAllergen } from "../lib/types";
import { ShieldIcon } from "../components/icons";

const SEVERITIES: { value: Severity; label: string; desc: string }[] = [
  { value: "mild", label: "Mild", desc: "Discomfort, but not dangerous" },
  { value: "moderate", label: "Moderate", desc: "Notable reaction, avoid it" },
  { value: "severe", label: "Severe", desc: "Anaphylaxis risk — strictly avoid" },
];

export function Onboarding() {
  const { dispatch } = useStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Record<string, Severity>>({});

  const chosen = Object.keys(selected);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = "moderate";
      return next;
    });
  }

  function setSeverity(id: string, sev: Severity) {
    setSelected((prev) => ({ ...prev, [id]: sev }));
  }

  function finish() {
    const allergens: UserAllergen[] = chosen.map((id) => {
      const def = ALLERGEN_CATALOG.find((a) => a.id === id)!;
      return {
        id,
        label: def.label,
        emoji: def.emoji,
        severity: selected[id],
      };
    });
    dispatch({
      type: "completeOnboarding",
      displayName: name.trim(),
      allergens,
    });
  }

  return (
    <div className="screen" style={{ paddingBottom: 40 }}>
      {step === 0 && (
        <div style={{ paddingTop: 30 }}>
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 22,
              background: "var(--teal)",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              marginBottom: 22,
            }}
          >
            <ShieldIcon size={40} />
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em" }}>
            Welcome to
            <br />
            Allergen Pal
          </h1>
          <p className="muted" style={{ marginTop: 12, fontSize: 16, lineHeight: 1.5 }}>
            Your pocket companion for staying safe. Check foods for hidden
            allergens, log reactions, and always know what to avoid.
          </p>
          <div className="field" style={{ marginTop: 26 }}>
            <label>What should we call you?</label>
            <input
              className="input"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <button className="btn" onClick={() => setStep(1)}>
            Get started
          </button>
          <p className="tiny muted" style={{ textAlign: "center", marginTop: 14 }}>
            No account needed. Your data stays on your device.
          </p>
        </div>
      )}

      {step === 1 && (
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>What are you allergic to?</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            Pick all that apply. You can change these anytime.
          </p>
          <div className="chip-grid" style={{ marginTop: 18 }}>
            {ALLERGEN_CATALOG.map((a) => {
              const on = !!selected[a.id];
              return (
                <button
                  key={a.id}
                  className={`chip ${on ? "on" : ""}`}
                  onClick={() => toggle(a.id)}
                >
                  <span className="emoji">{a.emoji}</span>
                  <span className="chip-label">{a.label}</span>
                  <span className="check">{on ? "✓" : ""}</span>
                </button>
              );
            })}
          </div>
          <button
            className="btn"
            style={{ marginTop: 22 }}
            disabled={chosen.length === 0}
            onClick={() => setStep(2)}
          >
            Continue{chosen.length ? ` (${chosen.length})` : ""}
          </button>
          <button className="btn ghost" onClick={finish}>
            Skip for now
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>How severe are they?</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            This sets how firmly we warn you about each one.
          </p>
          <div style={{ marginTop: 18 }}>
            {chosen.map((id) => {
              const def = ALLERGEN_CATALOG.find((a) => a.id === id)!;
              return (
                <div className="card" key={id} style={{ marginBottom: 12 }}>
                  <div className="row" style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: 24 }}>{def.emoji}</span>
                    <span style={{ fontWeight: 700, fontSize: 16 }}>
                      {def.label}
                    </span>
                  </div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {SEVERITIES.map((s) => {
                      const on = selected[id] === s.value;
                      return (
                        <button
                          key={s.value}
                          onClick={() => setSeverity(id, s.value)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "11px 12px",
                            borderRadius: 12,
                            border: `1.5px solid ${
                              on ? "var(--teal)" : "var(--line)"
                            }`,
                            background: on ? "var(--teal-tint)" : "#fff",
                            textAlign: "left",
                          }}
                        >
                          <span
                            className={`pill ${s.value}`}
                            style={{ minWidth: 74, justifyContent: "center" }}
                          >
                            {s.label}
                          </span>
                          <span className="tiny muted">{s.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <button className="btn" style={{ marginTop: 8 }} onClick={finish}>
            Finish setup
          </button>
        </div>
      )}
    </div>
  );
}
