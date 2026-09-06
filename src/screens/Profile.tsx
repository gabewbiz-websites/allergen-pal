import { useState } from "react";
import { ALLERGEN_CATALOG } from "../lib/allergens";
import { useStore } from "../lib/store";
import { useAuth } from "../lib/auth";
import { useBilling } from "../lib/useBilling";
import type { EmergencyInfo, Severity, UserAllergen } from "../lib/types";
import { Sheet, SheetHeader, fmtDate } from "../components/ui";
import { CrownIcon, ShareIcon, ShieldIcon } from "../components/icons";
import { ProfileSwitcher } from "../components/ProfileSwitcher";
import { AccountSheet } from "../components/AccountSheet";

const SEVERITIES: Severity[] = ["mild", "moderate", "severe"];

export function Profile({
  onUpgrade,
  onToast,
}: {
  onUpgrade: () => void;
  onToast: (m: string) => void;
}) {
  const { state, active, ent, dispatch } = useStore();
  const { email, signOut, syncNow, cloudEnabled } = useAuth();
  const { cancelSubscription, resumeSubscription, manageBilling } = useBilling();
  const [editAllergens, setEditAllergens] = useState(false);
  const [editEmergency, setEditEmergency] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [editProfile, setEditProfile] = useState(false);

  const allergens = active.allergens;

  function shareCard() {
    if (!ent.canExportEmergencyCard) {
      onUpgrade();
      return;
    }
    const e = active.emergency;
    const lines = [
      "🚨 ALLERGY EMERGENCY CARD",
      "",
      `Name: ${e.fullName || active.profile.name || "—"}`,
      "",
      "ALLERGIES:",
      ...(allergens.length
        ? allergens.map((a) => `  • ${a.label} (${a.severity})`)
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
        {ent.isPro && (
          <span className="pro-badge">
            <CrownIcon size={13} /> PRO
          </span>
        )}
      </div>

      {/* Account */}
      <div className="card">
        {email ? (
          <>
            <div className="row" style={{ gap: 14 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "var(--teal-tint)",
                  color: "var(--teal-dark)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 20,
                  fontWeight: 800,
                }}
              >
                {email.charAt(0).toUpperCase()}
              </div>
              <div className="grow" style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {email}
                </div>
                <div className="tiny muted">
                  {state.account.lastSyncedAt
                    ? `Synced ${fmtDate(state.account.lastSyncedAt)}`
                    : "Cloud sync on"}
                </div>
              </div>
            </div>
            <div className="row" style={{ gap: 10, marginTop: 12 }}>
              <button className="btn secondary" onClick={() => { syncNow(); onToast("Synced"); }}>
                Sync now
              </button>
              <button className="btn ghost" onClick={signOut}>
                Sign out
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="row" style={{ gap: 12 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "var(--teal-tint)",
                  color: "var(--teal-dark)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                ☁️
              </div>
              <div className="grow">
                <div style={{ fontWeight: 700 }}>Back up & sync</div>
                <div className="tiny muted">
                  {cloudEnabled
                    ? "Sign in to sync across your devices"
                    : "Using this device only (guest)"}
                </div>
              </div>
            </div>
            <button
              className="btn secondary"
              style={{ marginTop: 12 }}
              onClick={() => setAccountOpen(true)}
            >
              Sign in / Create account
            </button>
          </>
        )}
      </div>

      {/* Subscription */}
      <div className="section-label">Subscription</div>
      <SubscriptionCard
        onUpgrade={onUpgrade}
        onManage={async () => {
          const r = await manageBilling();
          if (!r.ok && r.error) onToast(r.error);
        }}
        onCancel={() => {
          cancelSubscription();
          onToast("Subscription will end at period close");
        }}
        onResume={() => {
          resumeSubscription();
          onToast("Subscription resumed");
        }}
      />

      {/* Family profiles */}
      <div className="section-label">Profiles</div>
      <div className="card">
        <ProfileSwitcher onUpgrade={onUpgrade} />
        <div className="spread" style={{ marginTop: 4 }}>
          <span className="tiny muted">
            {active.profile.relation === "self"
              ? "Account owner"
              : `Editing ${active.profile.name}`}
          </span>
          {active.profile.relation === "family" && (
            <button className="link tiny" onClick={() => setEditProfile(true)}>
              Edit / remove
            </button>
          )}
        </div>
        {!ent.isPro && (
          <p className="tiny muted" style={{ marginTop: 10 }}>
            Family profiles are a Pro feature.
          </p>
        )}
      </div>

      {/* Allergens */}
      <div className="section-label">
        {active.profile.relation === "self"
          ? "My allergens"
          : `${active.profile.name}'s allergens`}
      </div>
      <div className="card">
        {allergens.length === 0 ? (
          <p className="tiny muted">No allergens yet. Add the ones to watch for.</p>
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

      {/* Emergency card */}
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
            {!ent.canExportEmergencyCard && <CrownIcon size={16} />}
            <ShareIcon size={18} /> Share
          </button>
        </div>
      </div>

      {/* Data */}
      <div className="section-label">Data</div>
      <div className="card">
        <button
          className="btn danger"
          onClick={() => {
            if (confirm("Erase all data on this device? This cannot be undone.")) {
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
      <EditProfileSheet open={editProfile} onClose={() => setEditProfile(false)} />
      <AccountSheet open={accountOpen} onClose={() => setAccountOpen(false)} />
    </div>
  );
}

function SubscriptionCard({
  onUpgrade,
  onManage,
  onCancel,
  onResume,
}: {
  onUpgrade: () => void;
  onManage: () => void;
  onCancel: () => void;
  onResume: () => void;
}) {
  const { subscription: sub, provider } = useBilling();
  const { ent } = useStore();

  if (!ent.isPro) {
    return (
      <button
        className="pro-hero"
        onClick={onUpgrade}
        style={{ width: "100%", textAlign: "center" }}
      >
        <div className="crown">
          <CrownIcon size={36} />
        </div>
        <div style={{ fontWeight: 800, fontSize: 20, marginTop: 4 }}>
          Upgrade to Pro
        </div>
        <div style={{ opacity: 0.9, fontSize: 13, marginTop: 4 }}>
          Insights, unlimited history, barcode scan, family & more
        </div>
      </button>
    );
  }

  const planLabel = sub.plan === "yearly" ? "Yearly" : "Monthly";
  let statusLine = "";
  if (sub.status === "trialing" && sub.trialEnd)
    statusLine = `Free trial ends ${fmtDate(sub.trialEnd)}`;
  else if (sub.status === "canceled" && sub.currentPeriodEnd)
    statusLine = `Access ends ${fmtDate(sub.currentPeriodEnd)}`;
  else if (sub.status === "active" && sub.currentPeriodEnd)
    statusLine = `Renews ${fmtDate(sub.currentPeriodEnd)}`;

  return (
    <div className="card">
      <div className="spread">
        <div>
          <div className="row" style={{ gap: 8 }}>
            <span style={{ fontWeight: 800, fontSize: 16 }}>Pro · {planLabel}</span>
            <span className="pro-badge">
              <CrownIcon size={12} /> ACTIVE
            </span>
          </div>
          <div className="tiny muted" style={{ marginTop: 4 }}>
            {statusLine}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        {sub.status === "canceled" ? (
          <button className="btn secondary" onClick={onResume}>
            Resume subscription
          </button>
        ) : provider === "stripe" ? (
          <button className="btn secondary" onClick={onManage}>
            Manage billing
          </button>
        ) : (
          <button className="btn ghost" onClick={onCancel}>
            Cancel subscription
          </button>
        )}
      </div>
    </div>
  );
}

function EditProfileSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { active, dispatch } = useStore();
  const [name, setName] = useState(active.profile.name);
  const [seeded, setSeeded] = useState(false);
  if (open && !seeded) {
    setName(active.profile.name);
    setSeeded(true);
  }
  if (!open && seeded) setSeeded(false);

  function save() {
    dispatch({
      type: "renameProfile",
      id: active.profile.id,
      name: name.trim() || "Family member",
      emoji: active.profile.emoji,
    });
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose}>
      <SheetHeader title="Edit profile" onClose={onClose} />
      <div className="field">
        <label>Name</label>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <button className="btn" onClick={save}>
        Save
      </button>
      <button
        className="btn danger"
        style={{ marginTop: 10 }}
        onClick={() => {
          if (confirm(`Remove ${active.profile.name}'s profile and data?`)) {
            dispatch({ type: "removeProfile", id: active.profile.id });
            onClose();
          }
        }}
      >
        Remove this profile
      </button>
    </Sheet>
  );
}

function ManageAllergens({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { active, dispatch } = useStore();
  const [draft, setDraft] = useState<Record<string, Severity>>({});
  const [seeded, setSeeded] = useState(false);

  if (open && !seeded) {
    const d: Record<string, Severity> = {};
    for (const a of active.allergens) d[a.id] = a.severity;
    setDraft(d);
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
  const { active, dispatch } = useStore();
  const [form, setForm] = useState<EmergencyInfo>(active.emergency);
  const [seeded, setSeeded] = useState(false);
  if (open && !seeded) {
    setForm(active.emergency);
    setSeeded(true);
  }
  if (!open && seeded) setSeeded(false);

  function set<K extends keyof EmergencyInfo>(key: K, val: string) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  function save() {
    dispatch({ type: "setEmergency", emergency: form });
    onClose();
  }

  const fields: { key: keyof EmergencyInfo; label: string; ph: string }[] = [
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
