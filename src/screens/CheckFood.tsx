import { useMemo, useState } from "react";
import { allergenById, scanIngredients, verdictFor } from "../lib/allergens";
import { newId, useStore } from "../lib/store";
import type { Verdict } from "../lib/types";
import { Sheet, SheetHeader } from "../components/ui";
import { SearchIcon } from "../components/icons";
import { BarcodeScanner } from "../components/BarcodeScanner";
import type { ProductLookup } from "../lib/openfoodfacts";

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
  onNeedUpgrade: (reason?: string) => void;
  onSaved: (msg: string) => void;
}) {
  const { active, dispatch, ent } = useStore();
  const [name, setName] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [brand, setBrand] = useState("");
  const [barcode, setBarcode] = useState("");
  const [checked, setChecked] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);

  const flagged = useMemo(
    () => (checked ? scanIngredients(ingredients, active.allergens) : []),
    [checked, ingredients, active.allergens],
  );
  const verdict = verdictFor(flagged, active.allergens);

  function reset() {
    setName("");
    setIngredients("");
    setBrand("");
    setBarcode("");
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

  function openScanner() {
    if (!ent.canScanBarcode) {
      onNeedUpgrade("Barcode scanning is a Pro feature.");
      return;
    }
    setScanOpen(true);
  }

  function onScanResult(p: ProductLookup) {
    setScanOpen(false);
    if (p.name) setName(p.name);
    if (p.brand) setBrand(p.brand);
    if (p.barcode) setBarcode(p.barcode);
    if (p.ingredients) {
      setIngredients(p.ingredients);
      setChecked(false);
    }
  }

  function save() {
    if (!ent.canSaveFood) {
      onNeedUpgrade("You've reached the free limit of saved foods.");
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
        brand: brand || undefined,
        barcode: barcode || undefined,
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

      {active.allergens.length === 0 && (
        <div className="card" style={{ marginBottom: 14, background: "var(--caution-tint)" }}>
          <p className="tiny" style={{ color: "var(--caution)", fontWeight: 600 }}>
            Add your allergens in Profile first so we know what to watch for.
          </p>
        </div>
      )}

      <button className="btn secondary" style={{ marginBottom: 14 }} onClick={openScanner}>
        📷 Scan barcode{!ent.canScanBarcode ? " (Pro)" : ""}
      </button>

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
          Tip: scan the barcode or copy the ingredients straight off the packaging.
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
                const ua = active.allergens.find((a) => a.id === id);
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

      <BarcodeScanner
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onResult={onScanResult}
      />
    </Sheet>
  );
}
