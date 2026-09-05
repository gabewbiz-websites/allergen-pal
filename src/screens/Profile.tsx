import { useState } from "react";
import { ALLERGEN_CATALOG } from "../lib/allergens";
import { useStore } from "../lib/store";
import type { Severity, UserAllergen } from "../lib/types";
import { Sheet, SheetHeader } from "../components/ui";
import { CrownIcon, ShareIcon, ShieldIcon } from "../components/icons";

const SEVERITIES: Severity[] = ["mild", "moderate", "severe"];

export function Profile({
  onUpgrade,
  onToast,
}: {
  onUpgrade: () => void;
  onToast: (m: string) => void;
}) {
  const { state, dispatch } = useStore();
  const { profile, allergens } = state;
  const [editAllergens, setEditAllergens] = useState(false);
  const [editEmergency, setEditEmergency] = useState(false);

  function shareCard() {
    if (!profile.isPro) {
      onUpgrade();
      return;
    }
    const e = profile.emergency;
    const lines = [
      "🚨 ALLERGY EMERGENCY CARD",
      "",
      `Name: ${e.fullName || profile.displayName || "—"}`,
      "",
      "ALLERGIES:",
      ...(allergens.length
        ? allergens.map(
            (a) => `  • ${a.label} (${a.severity})`,
          )
        : ["  • None listed"]),
      "",
      e.medications ? `Medications: ${e.medications}` : "",
      e.bloodType ? `Blood type: ${e.bloodType}` : "",
      e.emergencyContactName || e.emergencyContactPhone
        ? `Emergency contact: ${e.emergencyContactName} ${e.emergencyContactPhone}`.trim()
        : "",
      e.doctorPhone ? `Doctor: ${e.doctorPhone}` : "",
      e.notes ? `Notes: ${e.notes}` : "",
      "",
      "— Made with Allergen Pal",
    ].filter(Boolean);
    const text = lines.join("\n");

    if (navigator.share) {
      navigator.share({ title: "Allergy Emergency Card", text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text).then(
        () => onToast("Emergency card copied"),
        () => onToast("Could not share"),
      );
    }
  }

  return (
    <div className="screen">
      <div className="screen-head">
        <div className="screen-title">Profile</div>
        {profile.isPro && (
          <span className="pro-badge">
            <CrownIcon size={13} /> PRO
          </span>
        )}
      </div>

      <div className="card row" style={{ gap: 14 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "var(--teal-tint)",
            color: "var(--teal-dark)",
            display: "grid",
            placeItems: "center",
            fontSize: 24,
            fontWeight: 800,
          }}
        >
          {(profile.displayName || "?").charAt(0).toUpperCase()}
        </div>
        <div className="grow">
          <div style={{ fontWeight: 800, fontSize: 18 }}>
            {profile.displayName || "Your profile"}
          </div>
          <div className="tiny muted">
            {allergens.length} allergen{allergens.length === 1 ? "" : "s"} tracked
          </div>
        </div>
      </div>

      {!profile.isPro && (
        <button
          className="pro-hero"
          onClick={onUpgrade}
          style={{ width: "100%", marginTop: 14, textAlign: "center" }}
        >
          <div className="crown">
            <CrownIcon size={36} />
          </div>
          <div style={{ fontWeight: 800, fontSize: 20, marginTop: 4 }}>
            Upgrade to Pro
          </div>
          <div style={{ opacity: 0.9, fontSize: 13, marginTop: 4 }}>
            Insights, unlimited history, emergency card & more
          </div>
        </button>
      )}

      <div className="section-label">My allergens</div>
      <div className="card">
        {allergens.length === 0 ? (
          <p className="tiny muted">No allergens yet. Add the ones you react to.</p>
        ) : (
          allergens.map((a) => (
            <div className="spread" key={a.id} style={{ padding: "8px 0" }}>
              <div className="row">
                <span style={{ fontSize: 22 }}>{a.emoji}</span>
                <span style={{ fontWeight: 600 }}>{a.label}</span>
              </div>
              <span className={`pill ${a.severity}`}>{a.severity}</span>
            </div>
          ))
        )}
        <button
          className="btn secondary"
          style={{ marginTop: 12 }}
          onClick={() => setEditAllergens(true)}
        >
          Manage allergens
        </button>
      </div>

      <div className="section-label">Emergency card</div>
      <div className="card">
        <div className="row" style={{ marginBottom: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: "var(--avoid-tint)",
              color: "var(--avoid)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <ShieldIcon size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700 }}>Emergency info</div>
            <div className="tiny muted">For schools, sitters & first responders</div>
          </div>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <button className="btn secondary" onClick={() => setEditEmergency(true)}>
            Edit info
          </button>
          <button className="btn" onClick={shareCard}>
            {!profile.isPro && <CrownIcon size={16} />}
            <ShareIcon size={18} /> Share
          </button>
        </div>
      </div>

      <div className="section-label">Account</div>
      <div className="card">
        {profile.isPro ? (
          <button
            className="btn ghost"
            onClick={() => {
              dispatch({ type: "setPro", isPro: false });
              onToast("Switched to free plan");
            }}
          >
            Manage subscription
          </button>
        ) : (
          <button className="btn secondary" onClick={onUpgrade}>
            <CrownIcon size={16} /> See Pro plans
          </button>
        )}
        <button
          className="btn danger"
          style={{ marginTop: 10 }}
          onClick={() => {
            if (confirm("Erase all your data? This cannot be undone.")) {
              dispatch({ type: "reset" });
            }
          }}
        >
          Erase all data
        </button>
      </div>

      <p className="tiny muted" style={{ textAlign: "center", marginTop: 20, lineHeight: 1.5 }}>
        Allergen Pal helps you stay aware but isn't a substitute for medical
        advice. Always read labels and consult your doctor.
      </p>

      <ManageAllergens open={editAllergens} onClose={() => setEditAllergens(false)} />
      <EditEmergency open={editEmergency} onClose={() => setEditEmergency(false)} />
    </div>
  );
}

function ManageAllergens({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const [draft, setDraft] = useState<Record<string, Severity>>({});

  // Seed draft from current state whenever opened.
  function seed() {
    const d: Record<string, Severity> = {};
    for (const a of state.allergens) d[a.id] = a.severity;
    return d;
  }
  const [seeded, setSeeded] = useState(false);
  if (open && !seeded) {
    setDraft(seed());
    setSeeded(true);
  }
  if (!open && seeded) setSeeded(false);

  function toggle(id: string) {
    setDraft((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = "moderate";
      return next;
    });
  }

  function save() {
    const allergens: UserAllergen[] = Object.keys(draft).map((id) => {
      const def = ALLERGEN_CATALOG.find((a) => a.id === id)!;
      return { id, label: def.label, emoji: def.emoji, severity: draft[id] };
    });
    dispatch({ type: "setAllergens", allergens });
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose}>
      <SheetHeader title="Manage allergens" onClose={onClose} />
      {ALLERGEN_CATALOG.map((a) => {
        const on = !!draft[a.id];
        return (
          <div className="card" key={a.id} style={{ marginBottom: 10 }}>
            <button
              className="spread"
              onClick={() => toggle(a.id)}
              style={{ width: "100%", background: "none" }}
            >
              <div className="row">
                <span style={{ fontSize: 22 }}>{a.emoji}</span>
                <span style={{ fontWeight: 700 }}>{a.label}</span>
              </div>
              <span
                className="check"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  border: `2px solid ${on ? "var(--teal)" : "var(--line)"}`,
                  background: on ? "var(--teal)" : "#fff",
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {on ? "✓" : ""}
              </span>
            </button>
            {on && (
              <div className="seg" style={{ marginTop: 12 }}>
                {SEVERITIES.map((s) => (
                  <button
                    key={s}
                    className={draft[a.id] === s ? "on" : ""}
                    onClick={() => setDraft((p) => ({ ...p, [a.id]: s }))}
                    style={{ textTransform: "capitalize" }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <button className="btn" style={{ marginTop: 6 }} onClick={save}>
        Save
      </button>
    </Sheet>
  );
}

function EditEmergency({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const e = state.profile.emergency;
  const [form, setForm] = useState(e);
  const [seeded, setSeeded] = useState(false);
  if (open && !seeded) {
    setForm(e);
    setSeeded(true);
  }
  if (!open && seeded) setSeeded(false);

  function set<K extends keyof typeof form>(key: K, val: string) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  function save() {
    dispatch({ type: "updateProfile", patch: { emergency: form } });
    onClose();
  }

  const fields: { key: keyof typeof form; label: string; ph: string }[] = [
    { key: "fullName", label: "Full name", ph: "Jane Doe" },
    { key: "emergencyContactName", label: "Emergency contact", ph: "Contact name" },
    { key: "emergencyContactPhone", label: "Contact phone", ph: "(555) 555-5555" },
    { key: "medications", label: "Medications", ph: "e.g. EpiPen, antihistamine" },
    { key: "bloodType", label: "Blood type", ph: "e.g. O+" },
    { key: "doctorPhone", label: "Doctor's phone", ph: "(555) 555-5555" },
    { key: "notes", label: "Other notes", ph: "Anything responders should know" },
  ];

  return (
    <Sheet open={open} onClose={onClose}>
      <SheetHeader title="Emergency info" onClose={onClose} />
      {fields.map((f) => (
        <div className="field" key={f.key}>
          <label>{f.label}</label>
          <input
            className="input"
            placeholder={f.ph}
            value={form[f.key]}
            onChange={(ev) => set(f.key, ev.target.value)}
          />
        </div>
      ))}
      <button className="btn" onClick={save}>
        Save
      </button>
    </Sheet>
  );
}
