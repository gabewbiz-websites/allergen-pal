import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type {
  AppState,
  FoodEntry,
  Profile,
  ReactionEntry,
  UserAllergen,
} from "./types";

const STORAGE_KEY = "allergen-pal:v1";

/** Free plan keeps this many saved foods. Checking food is always free. */
export const FREE_SAVED_FOOD_LIMIT = 10;

const emptyEmergency = {
  fullName: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  medications: "",
  bloodType: "",
  doctorPhone: "",
  notes: "",
};

const defaultProfile: Profile = {
  displayName: "",
  onboarded: false,
  isPro: false,
  emergency: emptyEmergency,
};

const initialState: AppState = {
  profile: defaultProfile,
  allergens: [],
  foods: [],
  reactions: [],
};

type Action =
  | { type: "hydrate"; state: AppState }
  | { type: "setAllergens"; allergens: UserAllergen[] }
  | { type: "updateProfile"; patch: Partial<Profile> }
  | { type: "completeOnboarding"; displayName: string; allergens: UserAllergen[] }
  | { type: "addFood"; food: FoodEntry }
  | { type: "removeFood"; id: string }
  | { type: "toggleFavorite"; id: string }
  | { type: "addReaction"; reaction: ReactionEntry }
  | { type: "removeReaction"; id: string }
  | { type: "setPro"; isPro: boolean }
  | { type: "reset" };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "hydrate":
      return action.state;
    case "setAllergens":
      return { ...state, allergens: action.allergens };
    case "updateProfile":
      return { ...state, profile: { ...state.profile, ...action.patch } };
    case "completeOnboarding":
      return {
        ...state,
        profile: {
          ...state.profile,
          displayName: action.displayName,
          onboarded: true,
        },
        allergens: action.allergens,
      };
    case "addFood":
      return { ...state, foods: [action.food, ...state.foods] };
    case "removeFood":
      return { ...state, foods: state.foods.filter((f) => f.id !== action.id) };
    case "toggleFavorite":
      return {
        ...state,
        foods: state.foods.map((f) =>
          f.id === action.id ? { ...f, favorite: !f.favorite } : f,
        ),
      };
    case "addReaction":
      return { ...state, reactions: [action.reaction, ...state.reactions] };
    case "removeReaction":
      return {
        ...state,
        reactions: state.reactions.filter((r) => r.id !== action.id),
      };
    case "setPro":
      return { ...state, profile: { ...state.profile, isPro: action.isPro } };
    case "reset":
      return initialState;
    default:
      return state;
  }
}

interface StoreContext {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  canSaveFood: boolean;
}

const Ctx = createContext<StoreContext | null>(null);

function load(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      profile: { ...defaultProfile, ...parsed.profile },
      allergens: parsed.allergens ?? [],
      foods: parsed.foods ?? [],
      reactions: parsed.reactions ?? [],
    };
  } catch {
    return null;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState, (init) => {
    return load() ?? init;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage may be unavailable (private mode) — app still works in-memory */
    }
  }, [state]);

  const value = useMemo<StoreContext>(
    () => ({
      state,
      dispatch,
      canSaveFood:
        state.profile.isPro || state.foods.length < FREE_SAVED_FOOD_LIMIT,
    }),
    [state],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function newId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
