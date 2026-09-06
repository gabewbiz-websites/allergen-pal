import { useState } from "react";
import { allergenById } from "../lib/allergens";
import type { RewriteResult } from "../lib/types";

/** Renders a rewritten recipe: swap summary, ingredients, and steps. */
export function RecipeResult({ result }: { result: RewriteResult }) {
  const [showOriginal, setShowOriginal] = useState(false);

  return (
    <div>
      {/* Summary banner */}
      {result.safe ? (
        <div className="verdict safe" style={{ padding: "16px 18px" }}>
          <div className="head" style={{ fontSize: 18 }}>
            {result.swapCount === 0
              ? "✅ Already safe for you"
              : `✅ Made safe · ${result.swapCount} swap${result.swapCount === 1 ? "" : "s"}`}
          </div>
          <div className="desc">
            {result.method === "ai" ? "Smart AI rewrite" : "Allergen-safe version ready"}
          </div>
        </div>
      ) : (
        <div className="verdict caution" style={{ padding: "16px 18px" }}>
          <div className="head" style={{ fontSize: 18 }}>
            ⚠️ {result.swapCount} swapped · check the rest
          </div>
          <div className="desc">
            No safe swap for:{" "}
            {result.unresolved.map((id) => allergenById(id)?.label ?? id).join(", ")}.
            Adjust manually.
          </div>
        </div>
      )}

      {result.summary && (
        <div className="card" style={{ marginTop: 12 }}>
          <p className="tiny" style={{ lineHeight: 1.6, color: "var(--ink-soft)" }}>
            {result.summary}
          </p>
        </div>
      )}

      {/* What may change — impact of the swaps on the finished dish */}
      {(() => {
        const impacts = result.ingredients.filter((i) => i.changed && i.impact);
        if (impacts.length === 0) return null;
        return (
          <>
            <div className="section-label">What may change</div>
            <div className="card" style={{ background: "var(--caution-tint)" }}>
              {impacts.map((i, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "8px 0",
                    borderBottom:
                      idx < impacts.length - 1
                        ? "1px solid rgba(217,138,0,0.18)"
                        : "none",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 13, color: "var(--caution)" }}>
                    {i.substitute}
                  </div>
                  <div className="tiny" style={{ color: "var(--ink-soft)", lineHeight: 1.5, marginTop: 2 }}>
                    {i.impact}
                  </div>
                </div>
              ))}
            </div>
          </>
        );
      })()}

      <div className="spread" style={{ margin: "18px 2px 8px" }}>
        <div className="section-label" style={{ margin: 0 }}>
          Ingredients
        </div>
        {result.swapCount > 0 && (
          <button
            className="link tiny"
            onClick={() => setShowOriginal((v) => !v)}
          >
            {showOriginal ? "Hide originals" : "Show originals"}
          </button>
        )}
      </div>

      <div className="card">
        {result.ingredients.map((ing, i) => (
          <div
            key={i}
            style={{
              padding: "10px 0",
              borderBottom:
                i < result.ingredients.length - 1 ? "1px solid var(--line)" : "none",
            }}
          >
            <div className="row" style={{ alignItems: "flex-start", gap: 10 }}>
              <span style={{ marginTop: 2 }}>
                {ing.changed ? "🔄" : ing.unresolved ? "⚠️" : "•"}
              </span>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontWeight: ing.changed ? 700 : 500,
                    color: ing.changed
                      ? "var(--teal-dark)"
                      : ing.unresolved
                        ? "var(--caution)"
                        : "var(--ink)",
                  }}
                >
                  {ing.rewritten}
                </div>
                {ing.changed && (showOriginal || ing.ratio || ing.note) && (
                  <div className="tiny muted" style={{ marginTop: 3, lineHeight: 1.5 }}>
                    {showOriginal && <>was: {ing.original}<br /></>}
                    {ing.ratio && ing.ratio !== "1:1" && <>Use {ing.ratio}. </>}
                    {ing.note}
                  </div>
                )}
                {ing.unresolved && (
                  <div className="tiny" style={{ color: "var(--caution)", marginTop: 3 }}>
                    Contains {allergenById(ing.allergen ?? "")?.label ?? "an allergen"} —
                    no safe swap found.
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {result.instructions.length > 0 && (
        <>
          <div className="section-label">Instructions</div>
          <div className="card">
            {result.instructions.map((step, i) => (
              <div
                key={i}
                className="row"
                style={{
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "10px 0",
                  borderBottom:
                    i < result.instructions.length - 1
                      ? "1px solid var(--line)"
                      : "none",
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "var(--teal-tint)",
                    color: "var(--teal-dark)",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 13,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ lineHeight: 1.55, fontSize: 15 }}>{step.rewritten}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
