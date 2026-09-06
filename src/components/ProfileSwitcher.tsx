import { useState } from "react";
import { newId, useStore } from "../lib/store";
import { Sheet, SheetHeader } from "./ui";
import { PlusIcon } from "./icons";

const EMOJI_CHOICES = ["🧑", "👩", "👨", "👦", "👧", "👶", "👵", "👴", "🐶", "🐱"];

export function ProfileSwitcher({ onUpgrade }: { onUpgrade: () => void }) {
  const { state, dispatch, ent } = useStore();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: 10,
          overflowX: "auto",
          padding: "2px 2px 12px",
          margin: "0 -2px",
        }}
      >
        {state.profiles.map((p) => {
          const on = p.id === state.activeProfileId;
          return (
            <button
              key={p.id}
              onClick={() => dispatch({ type: "setActiveProfile", id: p.id })}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 5,
                flexShrink: 0,
                width: 64,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 24,
                  background: on ? "var(--teal)" : "var(--card)",
                  boxShadow: "var(--shadow)",
                  border: on ? "2px solid var(--teal)" : "2px solid transparent",
                }}
              >
                {p.emoji}
              </div>
              <span
                className="tiny"
                style={{
                  fontWeight: on ? 700 : 500,
                  color: on ? "var(--teal-dark)" : "var(--ink-soft)",
                  maxWidth: 62,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {p.relation === "self" ? p.name || "You" : p.name}
              </span>
            </button>
          );
        })}
        <button
          onClick={() => (ent.canAddProfile ? setAddOpen(true) : onUpgrade())}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 5,
            flexShrink: 0,
            width: 64,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              color: "var(--teal)",
              background: "var(--teal-tint)",
              border: "2px dashed var(--teal)",
            }}
          >
            <PlusIcon size={22} />
          </div>
          <span className="tiny muted">Add</span>
        </button>
      </div>

      <AddProfile open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}

function AddProfile({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { dispatch } = useStore();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("👧");

  function add() {
    dispatch({
      type: "addProfile",
      profile: {
        id: newId(),
        name: name.trim() || "Family member",
        emoji,
        relation: "family",
      },
    });
    setName("");
    setEmoji("👧");
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose}>
      <SheetHeader title="Add a profile" onClose={onClose} />
      <p className="tiny muted" style={{ marginBottom: 14 }}>
        Track allergens separately for a child or loved one.
      </p>
      <div className="field">
        <label>Name</label>
        <input
          className="input"
          placeholder="e.g. Mia"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="field">
        <label>Avatar</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {EMOJI_CHOICES.map((e) => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              style={{
                width: 46,
                height: 46,
                borderRadius: 12,
                fontSize: 24,
                background: emoji === e ? "var(--teal-tint)" : "#fff",
                border: `1.5px solid ${emoji === e ? "var(--teal)" : "var(--line)"}`,
              }}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
      <button className="btn" onClick={add}>
        Add profile
      </button>
    </Sheet>
  );
}
