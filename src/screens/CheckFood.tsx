import { useMemo, useState } from "react";
import { allergenById, scanIngredients, verdictFor } from "../lib/allergens";
import { newId, useStore } from "../lib/store";
import type { Verdict } from "../lib/types";
import { Sheet, SheetHeader } from "../components/ui";
import { SearchIcon } from "../components/icons";

const VERDICT_META: Record<
  Verdict,
  { icon: string; head: string; desc: string }
> = {
  safe: {
    icon: "✅",
    head: "Looks safe",
    desc: "None of your allergens were found in these ingredients.",
  },
  caution: {
    icon: "⚠️",
    head: "Use caution",
    desc: "Contains something you're sensitive to. Double-check before eating.",
  },
  avoid: {
    icon: "⛔",
    head: "Do not eat",
    desc: "Contains a severe allergen. Avoid this food.",
  },
};

export function CheckFood({
  open,
  onClose,
  onNeedUpgrade,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onNeedUpgrade: () => void;
  onSaved: (msg: string) => void;
}) {
  const { state, dispatch, canSaveFood } = useStore();
  const [name, setName] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [checked, setChecked] = useState(false);

  const flagged = useMemo(
    () => (checked ? scanIngredients(ingredients, state.allergens) : []),
    [checked, ingredients, state.allergens],
  );
  const verdict = verdictFor(flagged, state.allergens);

  function reset() {
    setName("");
    setIngredients("");
    setChecked(false);
  }

  function close() {
    reset();
    onClose();
  }

  function check() {
    if (!ingredients.trim()) return;
    setChecked(true);
  }

  function save() {
    if (!canSaveFood) {
      onNeedUpgrade();
      return;
    }
    dispatch({
      type: "addFood",
      food: {
        id: newId(),
        name: name.trim() || "Unnamed food",
        ingredients: ingredients.trim(),
        flagged,
        verdict,
        createdAt: Date.now(),
      },
    });
    onSaved("Saved to your food history");
    close();
  }

  const meta = VERDICT_META[verdict];

  return (
    <Sheet open={open} onClose={close}>
      <SheetHeader title="Check a food" onClose={close} />

      {state.allergens.length === 0 && (
        <div className="card" style={{ marginBottom: 14, background: "var(--caution-tint)" }}>
          <p className="tiny" style={{ color: "var(--caution)", fontWeight: 600 }}>
            Add your allergens in Profile first so we know what to watch for.
          </p>
        </div>
      )}

      <div className="field">
        <label>Food or product name</label>
        <input
          className="input"
          placeholder="e.g. Trail mix bar"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="field">
        <label>Ingredients</label>
        <textarea
          className="textarea"
          placeholder="Paste or type the ingredient list from the label…"
          value={ingredients}
          onChange={(e) => {
            setIngredients(e.target.value);
            setChecked(false);
          }}
        />
        <p className="tiny muted" style={{ marginTop: 6 }}>
          Tip: copy the ingredients straight off the packaging for the best check.
        </p>
      </div>

      {!checked ? (
        <button className="btn" onClick={check} disabled={!ingredients.trim()}>
          <SearchIcon size={20} /> Check ingredients
        </button>
      ) : (
        <>
          <div className={`verdict ${verdict}`}>
            <div className="icon">{meta.icon}</div>
            <div className="head">{meta.head}</div>
            <div className="desc">{meta.desc}</div>
          </div>

          {flagged.length > 0 && (
            <div className="card" style={{ marginTop: 12 }}>
              <div className="section-label" style={{ margin: "0 0 10px" }}>
                Found in this food
              </div>
              {flagged.map((id) => {
                const ua = state.allergens.find((a) => a.id === id);
                const def = allergenById(id);
                return (
                  <div className="spread" key={id} style={{ padding: "8px 0" }}>
                    <div className="row">
                      <span style={{ fontSize: 22 }}>
                        {ua?.emoji ?? def?.emoji ?? "⚠️"}
                      </span>
                      <span style={{ fontWeight: 600 }}>
                        {ua?.label ?? def?.label ?? id}
                      </span>
                    </div>
                    {ua && <span className={`pill ${ua.severity}`}>{ua.severity}</span>}
                  </div>
                );
              })}
            </div>
          )}

          <div className="row" style={{ marginTop: 14, gap: 10 }}>
            <button className="btn secondary" onClick={() => setChecked(false)}>
              Edit
            </button>
            <button className="btn" onClick={save}>
              Save result
            </button>
          </div>
        </>
      )}
    </Sheet>
  );
}
