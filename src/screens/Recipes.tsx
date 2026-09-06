import { useState } from "react";
import { useStore } from "../lib/store";
import { relTime, Sheet, SheetHeader } from "../components/ui";
import { RecipeResult } from "../components/RecipeResult";
import { ProfileSwitcher } from "../components/ProfileSwitcher";
import { recipeToText } from "../lib/recipe";
import { CrownIcon, ShareIcon, TrashIcon } from "../components/icons";
import type { SavedRecipe } from "../lib/types";
import type { Tab } from "../App";

export function Recipes({
  onConvert,
  onUpgrade,
  go,
}: {
  onConvert: () => void;
  onUpgrade: () => void;
  go: (tab: Tab) => void;
}) {
  const { state, active, ent } = useStore();
  const recipes = active.recipes;
  const [detail, setDetail] = useState<SavedRecipe | null>(null);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="screen">
      <div className="screen-head">
        <div>
          <div className="screen-sub">{greeting}</div>
          <div className="screen-title">{active.profile.name || "Welcome"} 👋</div>
        </div>
        {ent.isPro ? (
          <span className="pro-badge">
            <CrownIcon size={13} /> PRO
          </span>
        ) : (
          <button className="pro-badge" onClick={onUpgrade}>
            <CrownIcon size={13} /> Go Pro
          </button>
        )}
      </div>

      {state.profiles.length > 1 && <ProfileSwitcher onUpgrade={onUpgrade} />}

      <button
        className="card"
        onClick={onConvert}
        style={{
          width: "100%",
          textAlign: "left",
          background: "linear-gradient(140deg, #0f9d8f, #0b7d72)",
          color: "#fff",
          padding: 22,
        }}
      >
        <div style={{ fontSize: 30 }}>🍳</div>
        <div style={{ fontWeight: 800, fontSize: 20, marginTop: 8 }}>
          Convert a recipe
        </div>
        <div style={{ opacity: 0.9, fontSize: 14, marginTop: 4, lineHeight: 1.5 }}>
          Paste a recipe link or text and get an allergen-safe version with smart
          ingredient swaps.
        </div>
        <div
          style={{
            marginTop: 14,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255,255,255,0.18)",
            padding: "10px 16px",
            borderRadius: 12,
            fontWeight: 700,
          }}
        >
          Start converting →
        </div>
      </button>

      {active.allergens.length > 0 ? (
        <p className="tiny muted" style={{ margin: "12px 4px 0", lineHeight: 1.5 }}>
          Converting for{" "}
          <strong style={{ color: "var(--ink)" }}>
            {active.allergens.map((a) => a.label).join(", ")}
          </strong>
          .{" "}
          <button className="link tiny" onClick={() => go("profile")}>
            Change
          </button>
        </p>
      ) : (
        <button
          className="card"
          onClick={() => go("profile")}
          style={{ width: "100%", textAlign: "left", marginTop: 12 }}
        >
          <div style={{ fontWeight: 700 }}>Set up your allergens first →</div>
          <div className="tiny muted">So we know what to swap out of recipes</div>
        </button>
      )}

      <div className="section-label">My recipes</div>
      {recipes.length === 0 ? (
        <div className="empty">
          <div className="big">🥘</div>
          <p style={{ fontWeight: 600, color: "var(--ink-soft)" }}>No recipes yet</p>
          <p className="tiny" style={{ marginTop: 6 }}>
            Convert your first recipe and save it here for later.
          </p>
        </div>
      ) : (
        <div className="card">
          {recipes.map((r) => (
            <button
              key={r.id}
              className="item"
              onClick={() => setDetail(r)}
              style={{ width: "100%", textAlign: "left", background: "none" }}
            >
              <div className="lead">{r.result.safe ? "✅" : "⚠️"}</div>
              <div className="grow">
                <div className="name">{r.title}</div>
                <div className="tiny muted">
                  {r.result.swapCount} swap{r.result.swapCount === 1 ? "" : "s"} ·{" "}
                  {relTime(r.createdAt)}
                  {r.result.method === "ai" ? " · ✨ AI" : ""}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <button
        className="card"
        onClick={() => go("insights")}
        style={{ width: "100%", textAlign: "left", marginTop: 14 }}
      >
        <div className="spread">
          <div className="row">
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: "var(--teal-tint)",
                color: "var(--teal-dark)",
                display: "grid",
                placeItems: "center",
                fontSize: 20,
              }}
            >
              📈
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>Trends & insights</div>
              <div className="tiny muted">Spot your reaction patterns</div>
            </div>
          </div>
          {!ent.isPro && (
            <span className="pro-badge">
              <CrownIcon size={12} /> PRO
            </span>
          )}
        </div>
      </button>

      <RecipeDetail detail={detail} onClose={() => setDetail(null)} onUpgrade={onUpgrade} />
    </div>
  );
}

function RecipeDetail({
  detail,
  onClose,
  onUpgrade,
}: {
  detail: SavedRecipe | null;
  onClose: () => void;
  onUpgrade: () => void;
}) {
  const { dispatch, ent } = useStore();

  function share(r: SavedRecipe) {
    const text = recipeToText(r);
    if (navigator.share) {
      navigator.share({ title: `${r.title} (allergen-safe)`, text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text).catch(() => {});
    }
  }

  return (
    <Sheet open={!!detail} onClose={onClose}>
      {detail && (
        <>
          <SheetHeader title={detail.title} onClose={onClose} />
          {detail.sourceUrl && (
            <a
              href={detail.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="tiny link"
              style={{ display: "block", marginBottom: 10 }}
            >
              View original source ↗
            </a>
          )}
          <RecipeResult result={detail.result} />
          <div className="row" style={{ marginTop: 16, gap: 10 }}>
            <button className="btn secondary" onClick={() => share(detail)}>
              <ShareIcon size={18} /> Share
            </button>
            <button
              className="btn danger"
              onClick={() => {
                dispatch({ type: "removeRecipe", id: detail.id });
                onClose();
              }}
            >
              <TrashIcon size={18} /> Delete
            </button>
          </div>
          {!ent.isPro && detail.result.method !== "ai" && (
            <button className="btn gold" style={{ marginTop: 10 }} onClick={onUpgrade}>
              <CrownIcon size={16} /> Get sharper swaps with AI (Pro)
            </button>
          )}
        </>
      )}
    </Sheet>
  );
}
