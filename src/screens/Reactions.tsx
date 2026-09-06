import { useState } from "react";
import { newId, useStore } from "../lib/store";
import { fmtDate, Sheet, SheetHeader } from "../components/ui";
import { PlusIcon, TrashIcon } from "../components/icons";
import type { ReactionEntry, Severity } from "../lib/types";

const SYMPTOMS = [
  "Hives", "Itching", "Swelling", "Stomach pain", "Nausea", "Vomiting",
  "Diarrhea", "Trouble breathing", "Coughing", "Runny nose", "Dizziness",
  "Headache",
];

const SEVERITIES: Severity[] = ["mild", "moderate", "severe"];

export function Reactions() {
  const { active, dispatch } = useStore();
  const reactions = active.reactions;
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<ReactionEntry | null>(null);

  return (
    <div className="screen">
      <div className="screen-head">
        <div>
          <div className="screen-title">Reactions</div>
          <div className="screen-sub">Track what happened & when</div>
        </div>
        <button className="btn sm" onClick={() => setOpen(true)}>
          <PlusIcon size={16} /> Log
        </button>
      </div>

      {reactions.length === 0 ? (
        <div className="empty">
          <div className="big">📝</div>
          <p style={{ fontWeight: 600, color: "var(--ink-soft)" }}>
            No reactions logged
          </p>
          <p className="tiny" style={{ marginTop: 6 }}>
            Logging reactions helps you and your doctor spot triggers.
          </p>
          <button className="btn sm" style={{ margin: "16px auto 0" }} onClick={() => setOpen(true)}>
            Log a reaction
          </button>
        </div>
      ) : (
        <div className="card">
          {reactions.map((r) => (
            <button
              key={r.id}
              className="item"
              onClick={() => setDetail(r)}
              style={{ width: "100%", textAlign: "left", background: "none" }}
            >
              <div
                className="lead"
                style={{
                  background:
                    r.severity === "mild"
                      ? "var(--safe-tint)"
                      : r.severity === "moderate"
                        ? "var(--caution-tint)"
                        : "var(--avoid-tint)",
                }}
              >
                {r.severity === "severe" ? "🚨" : r.severity === "moderate" ? "⚠️" : "•"}
              </div>
              <div className="grow">
                <div className="name">{r.suspectedTrigger || "Unknown trigger"}</div>
                <div className="tiny muted">
                  {fmtDate(r.occurredAt)} · {r.symptoms.slice(0, 2).join(", ")}
                  {r.symptoms.length > 2 ? "…" : ""}
                </div>
              </div>
              <span className={`pill ${r.severity}`}>{r.severity}</span>
            </button>
          ))}
        </div>
      )}

      <LogReaction open={open} onClose={() => setOpen(false)} />

      <Sheet open={!!detail} onClose={() => setDetail(null)}>
        {detail && (
          <>
            <SheetHeader title="Reaction details" onClose={() => setDetail(null)} />
            <div className="card">
              <div className="spread" style={{ marginBottom: 14 }}>
                <span className={`pill ${detail.severity}`}>{detail.severity}</span>
                <span className="tiny muted">{fmtDate(detail.occurredAt)}</span>
              </div>
              <Row label="Suspected trigger" value={detail.suspectedTrigger || "—"} />
              <Row label="Symptoms" value={detail.symptoms.join(", ") || "—"} />
              {detail.notes && <Row label="Notes" value={detail.notes} />}
            </div>
            <button
              className="btn danger"
              style={{ marginTop: 14 }}
              onClick={() => {
                dispatch({ type: "removeReaction", id: detail.id });
                setDetail(null);
              }}
            >
              <TrashIcon size={18} /> Delete
            </button>
          </>
        )}
      </Sheet>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: "8px 0", borderTop: "1px solid var(--line)" }}>
      <div className="tiny muted">{label}</div>
      <div style={{ fontWeight: 600, marginTop: 2 }}>{value}</div>
    </div>
  );
}

function LogReaction({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { active, dispatch } = useStore();
  const [severity, setSeverity] = useState<Severity>("mild");
  const [trigger, setTrigger] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [when, setWhen] = useState(() => toLocalInput(Date.now()));

  function reset() {
    setSeverity("mild");
    setTrigger("");
    setSymptoms([]);
    setNotes("");
    setWhen(toLocalInput(Date.now()));
  }

  function toggleSymptom(s: string) {
    setSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  }

  function save() {
    dispatch({
      type: "addReaction",
      reaction: {
        id: newId(),
        severity,
        symptoms,
        suspectedTrigger: trigger.trim(),
        notes: notes.trim() || undefined,
        occurredAt: new Date(when).getTime() || Date.now(),
        createdAt: Date.now(),
      },
    });
    reset();
    onClose();
  }

  const triggerSuggestions = active.allergens.map((a) => a.label);

  return (
    <Sheet open={open} onClose={onClose}>
      <SheetHeader title="Log a reaction" onClose={onClose} />

      <div className="field">
        <label>Severity</label>
        <div className="seg">
          {SEVERITIES.map((s) => (
            <button
              key={s}
              className={severity === s ? "on" : ""}
              onClick={() => setSeverity(s)}
              style={{ textTransform: "capitalize" }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Suspected trigger</label>
        <input
          className="input"
          list="trigger-suggestions"
          placeholder="What do you think caused it?"
          value={trigger}
          onChange={(e) => setTrigger(e.target.value)}
        />
        <datalist id="trigger-suggestions">
          {triggerSuggestions.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </div>

      <div className="field">
        <label>Symptoms</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {SYMPTOMS.map((s) => {
            const on = symptoms.includes(s);
            return (
              <button
                key={s}
                onClick={() => toggleSymptom(s)}
                className="pill"
                style={{
                  padding: "9px 13px",
                  fontSize: 13,
                  border: `1.5px solid ${on ? "var(--teal)" : "var(--line)"}`,
                  background: on ? "var(--teal-tint)" : "#fff",
                  color: on ? "var(--teal-dark)" : "var(--ink-soft)",
                }}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <div className="field">
        <label>When did it happen?</label>
        <input
          className="input"
          type="datetime-local"
          value={when}
          onChange={(e) => setWhen(e.target.value)}
        />
      </div>

      <div className="field">
        <label>Notes (optional)</label>
        <textarea
          className="textarea"
          placeholder="Anything else worth remembering…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <button className="btn" onClick={save}>
        Save reaction
      </button>
    </Sheet>
  );
}

function toLocalInput(ts: number): string {
  const d = new Date(ts);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}
