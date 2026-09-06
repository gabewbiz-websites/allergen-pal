import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type {
  Account,
  AppState,
  EmergencyInfo,
  FoodEntry,
  Profile,
  ProfileData,
  ReactionEntry,
  Subscription,
  UserAllergen,
} from "./types";
import { computeEntitlements, type Entitlements } from "./entitlements";
import { emptySubscription, reconcile } from "./billing";

const STORAGE_KEY = "allergen-pal:v2";
const LEGACY_KEY = "allergen-pal:v1";

export function newId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const emptyEmergency: EmergencyInfo = {
  fullName: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  medications: "",
  bloodType: "",
  doctorPhone: "",
  notes: "",
};

export function emptyProfileData(): ProfileData {
  return { allergens: [], foods: [], reactions: [], emergency: { ...emptyEmergency } };
}

const SELF_ID = "self";

function freshState(): AppState {
  return {
    account: { userId: null, email: null, lastSyncedAt: null },
    subscription: { ...emptySubscription },
    onboarded: false,
    profiles: [{ id: SELF_ID, name: "", emoji: "🧑", relation: "self" }],
    activeProfileId: SELF_ID,
    data: { [SELF_ID]: emptyProfileData() },
  };
}

type Action =
  | { type: "hydrate"; state: AppState }
  | { type: "setAccount"; account: Account }
  | { type: "setSubscription"; subscription: Subscription }
  | { type: "completeOnboarding"; name: string; allergens: UserAllergen[] }
  | { type: "setAllergens"; allergens: UserAllergen[] }
  | { type: "setEmergency"; emergency: EmergencyInfo }
  | { type: "addFood"; food: FoodEntry }
  | { type: "removeFood"; id: string }
  | { type: "toggleFavorite"; id: string }
  | { type: "addReaction"; reaction: ReactionEntry }
  | { type: "removeReaction"; id: string }
  | { type: "addProfile"; profile: Profile }
  | { type: "removeProfile"; id: string }
  | { type: "renameProfile"; id: string; name: string; emoji: string }
  | { type: "setActiveProfile"; id: string }
  | { type: "reset" };

/** Apply a mutation to the active profile's data. */
function patchActive(
  state: AppState,
  fn: (d: ProfileData) => ProfileData,
): AppState {
  const id = state.activeProfileId;
  return { ...state, data: { ...state.data, [id]: fn(state.data[id]) } };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "hydrate":
      return action.state;
    case "setAccount":
      return { ...state, account: action.account };
    case "setSubscription":
      return { ...state, subscription: action.subscription };
    case "completeOnboarding":
      return {
        ...state,
        onboarded: true,
        profiles: state.profiles.map((p) =>
          p.id === state.activeProfileId ? { ...p, name: action.name } : p,
        ),
        data: {
          ...state.data,
          [state.activeProfileId]: {
            ...state.data[state.activeProfileId],
            allergens: action.allergens,
          },
        },
      };
    case "setAllergens":
      return patchActive(state, (d) => ({ ...d, allergens: action.allergens }));
    case "setEmergency":
      return patchActive(state, (d) => ({ ...d, emergency: action.emergency }));
    case "addFood":
      return patchActive(state, (d) => ({ ...d, foods: [action.food, ...d.foods] }));
    case "removeFood":
      return patchActive(state, (d) => ({
        ...d,
        foods: d.foods.filter((f) => f.id !== action.id),
      }));
    case "toggleFavorite":
      return patchActive(state, (d) => ({
        ...d,
        foods: d.foods.map((f) =>
          f.id === action.id ? { ...f, favorite: !f.favorite } : f,
        ),
      }));
    case "addReaction":
      return patchActive(state, (d) => ({
        ...d,
        reactions: [action.reaction, ...d.reactions],
      }));
    case "removeReaction":
      return patchActive(state, (d) => ({
        ...d,
        reactions: d.reactions.filter((r) => r.id !== action.id),
      }));
    case "addProfile":
      return {
        ...state,
        profiles: [...state.profiles, action.profile],
        data: { ...state.data, [action.profile.id]: emptyProfileData() },
        activeProfileId: action.profile.id,
      };
    case "removeProfile": {
      if (action.id === SELF_ID) return state; // never remove the owner
      const profiles = state.profiles.filter((p) => p.id !== action.id);
      const data = { ...state.data };
      delete data[action.id];
      return {
        ...state,
        profiles,
        data,
        activeProfileId:
          state.activeProfileId === action.id ? SELF_ID : state.activeProfileId,
      };
    }
    case "renameProfile":
      return {
        ...state,
        profiles: state.profiles.map((p) =>
          p.id === action.id ? { ...p, name: action.name, emoji: action.emoji } : p,
        ),
      };
    case "setActiveProfile":
      return state.data[action.id]
        ? { ...state, activeProfileId: action.id }
        : state;
    case "reset": {
      const s = freshState();
      // keep the signed-in account; a reset clears data, not the login
      return { ...s, account: state.account, onboarded: false };
    }
    default:
      return state;
  }
}

function migrateLegacy(): AppState | null {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const v1 = JSON.parse(raw) as any;
    const s = freshState();
    s.onboarded = !!v1.profile?.onboarded;
    s.profiles[0].name = v1.profile?.displayName ?? "";
    s.data[SELF_ID] = {
      allergens: v1.allergens ?? [],
      foods: v1.foods ?? [],
      reactions: v1.reactions ?? [],
      emergency: { ...emptyEmergency, ...(v1.profile?.emergency ?? {}) },
    };
    if (v1.profile?.isPro) {
      s.subscription = {
        status: "active",
        plan: "yearly",
        provider: "simulated",
        currentPeriodEnd: Date.now() + 365 * 24 * 60 * 60 * 1000,
        trialEnd: null,
        cancelAtPeriodEnd: false,
      };
    }
    return s;
  } catch {
    return null;
  }
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      const base = freshState();
      const merged: AppState = {
        ...base,
        ...parsed,
        account: { ...base.account, ...parsed.account },
        subscription: { ...base.subscription, ...parsed.subscription },
      };
      merged.subscription = reconcile(merged.subscription);
      return merged;
    }
    const migrated = migrateLegacy();
    if (migrated) return migrated;
  } catch {
    /* fall through */
  }
  return freshState();
}

interface StoreContext {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  ent: Entitlements;
  /** Active profile + its data, for convenient reads in screens. */
  active: ProfileData & { profile: Profile };
}

const Ctx = createContext<StoreContext | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage may be unavailable (private mode) — app still works in-memory */
    }
  }, [state]);

  // Re-check trial/period expiry when the tab regains focus.
  useEffect(() => {
    function check() {
      const next = reconcile(state.subscription);
      if (next !== state.subscription)
        dispatch({ type: "setSubscription", subscription: next });
    }
    window.addEventListener("focus", check);
    return () => window.removeEventListener("focus", check);
  }, [state.subscription]);

  const value = useMemo<StoreContext>(() => {
    const profile =
      state.profiles.find((p) => p.id === state.activeProfileId) ??
      state.profiles[0];
    const data = state.data[state.activeProfileId] ?? emptyProfileData();
    return {
      state,
      dispatch,
      ent: computeEntitlements(state),
      active: { ...data, profile },
    };
  }, [state]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
