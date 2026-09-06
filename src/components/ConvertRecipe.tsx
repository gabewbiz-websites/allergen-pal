import { useEffect, useState } from "react";
import { newId, useStore } from "../lib/store";
import { useAuth } from "../lib/auth";
import { AI_MONTHLY } from "../lib/entitlements";
import { getAiUsageThisMonth } from "../lib/cloud";
import { Sheet, SheetHeader } from "./ui";
import { RecipeResult } from "./RecipeResult";
import { parsePastedRecipe, rewriteRecipe } from "../lib/recipe";
import {
  aiEnabled,
  aiRewriteRecipe,
  fetchRecipeFromUrl,
  urlImportEnabled,
} from "../lib/recipeService";
import type { ParsedRecipe, RewriteResult, SavedRecipe } from "../lib/types";

export function ConvertRecipe({
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
  const { session } = useAuth();
  const [mode, setMode] = useState<"url" | "text">("url");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [ingredientsText, setIngredientsText] = useState("");
  const [stepsText, setStepsText] = useState("");
  const [busy, setBusy] = useState<null | string>(null);
  const [error, setError] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<ParsedRecipe | null>(null);
  const [result, setResult] = useState<RewriteResult | null>(null);
  const [aiUsed, setAiUsed] = useState<number | null>(null);

  const userId = session?.user.id;
  const aiCap = ent.isPro ? AI_MONTHLY.pro : AI_MONTHLY.free;

  // Show free users how many AI rewrites remain this month.
  useEffect(() => {
    if (!open || !aiEnabled || !userId || ent.isPro) return;
    let live = true;
    getAiUsageThisMonth(userId).then((n) => live && setAiUsed(n));
    return () => {
      live = false;
    };
  }, [open, userId, ent.isPro]);

  function resetAll() {
    setUrl("");
    setTitle("");
    setIngredientsText("");
    setStepsText("");
    setRecipe(null);
    setResult(null);
    setError(null);
    setBusy(null);
  }

  function close() {
    resetAll();
    onClose();
  }

  async function convertUrl() {
    if (!url.trim()) return;
    setBusy("Reading the recipe…");
    setError(null);
    const res = await fetchRecipeFromUrl(url.trim());
    setBusy(null);
    if (!res.ok || !res.recipe) {
      setError(res.error ?? "Couldn't read that recipe.");
      return;
    }
    const rewritten = rewriteRecipe(res.recipe, active.allergens);
    setRecipe(res.recipe);
    setResult(rewritten);
  }

  function convertText() {
    const parsed = parsePastedRecipe(title, ingredientsText, stepsText);
    if (parsed.ingredients.length === 0) {
      setError("Add at least a few ingredients to convert.");
      return;
    }
    setError(null);
    setRecipe(parsed);
    setResult(rewriteRecipe(parsed, active.allergens));
  }

  async function doAiRewrite() {
    if (!recipe) return;
    if (!aiEnabled) {
      setError(
        "AI rewrite turns on once the recipe service is configured (see SETUP.md). The swaps above work offline.",
      );
      return;
    }
    setBusy("Rewriting with AI…");
    setError(null);
    const res = await aiRewriteRecipe(recipe, active.allergens, session?.access_token);
    setBusy(null);
    if (!res.ok || !res.result) {
      // Out of free rewrites → nudge to Pro. Not signed in → tell them.
      if (res.code === "quota" && !res.isPro) {
        onNeedUpgrade(res.error);
        return;
      }
      setError(res.error ?? "AI rewrite failed.");
      return;
    }
    if (!ent.isPro && aiUsed !== null) setAiUsed(aiUsed + 1);
    setResult(res.result);
  }

  function save() {
    if (!recipe || !result) return;
    if (!ent.canSaveRecipe) {
      onNeedUpgrade("You've reached the free limit of saved recipes.");
      return;
    }
    const saved: SavedRecipe = {
      ...recipe,
      id: newId(),
      createdAt: Date.now(),
      result,
      convertedFor: active.allergens.map((a) => a.label),
    };
    dispatch({ type: "addRecipe", recipe: saved });
    onSaved("Saved to My Recipes");
    close();
  }

  const showResult = recipe && result;

  return (
    <Sheet open={open} onClose={close}>
      <SheetHeader
        title={showResult ? recipe!.title || "Your recipe" : "Convert a recipe"}
        onClose={close}
      />

      {active.allergens.length === 0 && !showResult && (
        <div className="card" style={{ marginBottom: 14, background: "var(--caution-tint)" }}>
          <p className="tiny" style={{ color: "var(--caution)", fontWeight: 600 }}>
            Add your allergens first (Profile) so we know what to swap out.
          </p>
        </div>
      )}

      {!showResult ? (
        <>
          <div className="seg" style={{ marginBottom: 16 }}>
            <button className={mode === "url" ? "on" : ""} onClick={() => setMode("url")}>
              Paste URL
            </button>
            <button className={mode === "text" ? "on" : ""} onClick={() => setMode("text")}>
              Paste text
            </button>
          </div>

          {mode === "url" ? (
            <>
              <div className="field">
                <label>Recipe link</label>
                <input
                  className="input"
                  inputMode="url"
                  placeholder="https://…"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              {!urlImportEnabled && (
                <p className="tiny muted" style={{ marginBottom: 12, lineHeight: 1.5 }}>
                  Tip: URL import turns on once the recipe service is configured
                  (see SETUP.md). You can paste the recipe text now — it works
                  fully offline.
                </p>
              )}
              <button
                className="btn"
                onClick={convertUrl}
                disabled={!url.trim() || busy !== null}
              >
                {busy ?? "Convert recipe"}
              </button>
            </>
          ) : (
            <>
              <div className="field">
                <label>Recipe name</label>
                <input
                  className="input"
                  placeholder="e.g. Banana bread"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="field">
                <label>Ingredients (one per line)</label>
                <textarea
                  className="textarea"
                  placeholder={"2 cups flour\n1 cup milk\n2 eggs\n½ cup butter"}
                  value={ingredientsText}
                  onChange={(e) => setIngredientsText(e.target.value)}
                />
              </div>
              <div className="field">
                <label>Steps (optional, one per line)</label>
                <textarea
                  className="textarea"
                  placeholder={"Mix the dry ingredients\nWhisk in the milk and eggs\nBake at 350°F for 45 min"}
                  value={stepsText}
                  onChange={(e) => setStepsText(e.target.value)}
                />
              </div>
              <button className="btn" onClick={convertText} disabled={!ingredientsText.trim()}>
                Convert recipe
              </button>
            </>
          )}

          {error && (
            <p className="tiny" style={{ color: "var(--avoid)", marginTop: 12, textAlign: "center" }}>
              {error}
            </p>
          )}
        </>
      ) : (
        <>
          {recipe!.sourceName && (
            <p className="tiny muted" style={{ marginBottom: 10 }}>
              Adapted from {recipe!.sourceName}
              {recipe!.servings ? ` · ${recipe!.servings}` : ""}
              {recipe!.totalTime ? ` · ${recipe!.totalTime}` : ""}
            </p>
          )}

          <RecipeResult result={result!} />

          {error && (
            <p className="tiny" style={{ color: "var(--avoid)", marginTop: 12, textAlign: "center" }}>
              {error}
            </p>
          )}

          {result!.method !== "ai" && aiEnabled && (
            <>
              <button
                className="btn gold"
                style={{ marginTop: 16 }}
                onClick={doAiRewrite}
                disabled={busy !== null}
              >
                {busy ?? "✨ Smart AI rewrite"}
              </button>
              <p className="tiny muted" style={{ textAlign: "center", marginTop: 8 }}>
                {ent.isPro
                  ? "Unlimited with Pro"
                  : aiUsed !== null
                    ? `${Math.max(0, aiCap - aiUsed)} of ${aiCap} free AI rewrites left this month · Pro is unlimited`
                    : `${aiCap} free AI rewrites/month · Pro is unlimited`}
              </p>
            </>
          )}

          <div className="row" style={{ marginTop: 10, gap: 10 }}>
            <button className="btn secondary" onClick={resetAll}>
              Convert another
            </button>
            <button className="btn" onClick={save}>
              Save recipe
            </button>
          </div>
        </>
      )}
    </Sheet>
  );
}
