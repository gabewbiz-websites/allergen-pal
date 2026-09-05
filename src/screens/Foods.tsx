import { useMemo, useState } from "react";
import { useStore, FREE_SAVED_FOOD_LIMIT } from "../lib/store";
import { fmtDate } from "../components/ui";
import { Sheet, SheetHeader } from "../components/ui";
import { allergenById } from "../lib/allergens";
import { SearchIcon, TrashIcon, StarIcon, CrownIcon } from "../components/icons";
import type { FoodEntry, Verdict } from "../lib/types";

const emoji = (v: Verdict) => (v === "safe" ? "✅" : v === "caution" ? "⚠️" : "⛔");

export function Foods({
  onCheck,
  onUpgrade,
}: {
  onCheck: () => void;
  onUpgrade: () => void;
}) {
  const { state, dispatch } = useStore();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | Verdict>("all");
  const [detail, setDetail] = useState<FoodEntry | null>(null);

  const filtered = useMemo(() => {
    return state.foods.filter((f) => {
      if (filter !== "all" && f.verdict !== filter) return false;
      if (query && !f.name.toLowerCase().includes(query.toLowerCase()))
        return false;
      return true;
    });
  }, [state.foods, query, filter]);

  const nearLimit =
    !state.profile.isPro && state.foods.length >= FREE_SAVED_FOOD_LIMIT - 2;

  return (
    <div className="screen">
      <div className="screen-head">
        <div>
          <div className="screen-title">Food history</div>
          <div className="screen-sub">
            {state.foods.length} food{state.foods.length === 1 ? "" : "s"} checked
          </div>
        </div>
      </div>

      <div
        className="input"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 14px",
          marginBottom: 12,
        }}
      >
        <SearchIcon size={18} />
        <input
          placeholder="Search foods…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            border: "none",
            outline: "none",
            padding: "13px 0",
            flex: 1,
            background: "transparent",
          }}
        />
      </div>

      <div className="seg" style={{ marginBottom: 14 }}>
        {(["all", "safe", "caution", "avoid"] as const).map((f) => (
          <button
            key={f}
            className={filter === f ? "on" : ""}
            onClick={() => setFilter(f)}
            style={{ textTransform: "capitalize" }}
          >
            {f}
          </button>
        ))}
      </div>

      {nearLimit && (
        <button
          className="card"
          onClick={onUpgrade}
          style={{
            width: "100%",
            textAlign: "left",
            marginBottom: 12,
            background: "var(--caution-tint)",
          }}
        >
          <div className="row">
            <CrownIcon size={20} />
            <div className="tiny" style={{ color: "var(--caution)", fontWeight: 600 }}>
              You've saved {state.foods.length} of {FREE_SAVED_FOOD_LIMIT} free foods.
              Upgrade to Pro for unlimited history.
            </div>
          </div>
        </button>
      )}

      {filtered.length === 0 ? (
        <div className="empty">
          <div className="big">🍽️</div>
          <p style={{ fontWeight: 600, color: "var(--ink-soft)" }}>
            {state.foods.length === 0 ? "No foods checked yet" : "No matches"}
          </p>
          {state.foods.length === 0 && (
            <button className="btn sm" style={{ margin: "14px auto 0" }} onClick={onCheck}>
              Check your first food
            </button>
          )}
        </div>
      ) : (
        <div className="card">
          {filtered.map((f) => (
            <button
              key={f.id}
              className="item"
              onClick={() => setDetail(f)}
              style={{ width: "100%", textAlign: "left", background: "none" }}
            >
              <div
                className="lead"
                style={{
                  background:
                    f.verdict === "safe"
                      ? "var(--safe-tint)"
                      : f.verdict === "caution"
                        ? "var(--caution-tint)"
                        : "var(--avoid-tint)",
                }}
              >
                {emoji(f.verdict)}
              </div>
              <div className="grow">
                <div className="name">
                  {f.favorite && "⭐ "}
                  {f.name}
                </div>
                <div className="tiny muted">{fmtDate(f.createdAt)}</div>
              </div>
              <span className={`pill ${f.verdict}`}>{f.verdict}</span>
            </button>
          ))}
        </div>
      )}

      <Sheet open={!!detail} onClose={() => setDetail(null)}>
        {detail && (
          <>
            <SheetHeader title={detail.name} onClose={() => setDetail(null)} />
            <div className={`verdict ${detail.verdict}`}>
              <div className="icon">{emoji(detail.verdict)}</div>
              <div className="head" style={{ textTransform: "capitalize" }}>
                {detail.verdict === "safe"
                  ? "Looks safe"
                  : detail.verdict === "caution"
                    ? "Use caution"
                    : "Do not eat"}
              </div>
            </div>

            {detail.flagged.length > 0 && (
              <div className="card" style={{ marginTop: 12 }}>
                <div className="section-label" style={{ margin: "0 0 8px" }}>
                  Flagged allergens
                </div>
                {detail.flagged.map((id) => {
                  const ua = state.allergens.find((a) => a.id === id);
                  const def = allergenById(id);
                  return (
                    <div className="row" key={id} style={{ padding: "6px 0" }}>
                      <span style={{ fontSize: 20 }}>
                        {ua?.emoji ?? def?.emoji ?? "⚠️"}
                      </span>
                      <span style={{ fontWeight: 600 }}>
                        {ua?.label ?? def?.label ?? id}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="card" style={{ marginTop: 12 }}>
              <div className="section-label" style={{ margin: "0 0 8px" }}>
                Ingredients
              </div>
              <p className="tiny" style={{ lineHeight: 1.6, color: "var(--ink-soft)" }}>
                {detail.ingredients || "—"}
              </p>
            </div>

            <div className="row" style={{ marginTop: 14, gap: 10 }}>
              <button
                className="btn secondary"
                onClick={() => dispatch({ type: "toggleFavorite", id: detail.id })}
              >
                <StarIcon size={18} filled={detail.favorite} />
                {detail.favorite ? "Favorited" : "Favorite"}
              </button>
              <button
                className="btn danger"
                onClick={() => {
                  dispatch({ type: "removeFood", id: detail.id });
                  setDetail(null);
                }}
              >
                <TrashIcon size={18} /> Delete
              </button>
            </div>
          </>
        )}
      </Sheet>
    </div>
  );
}
