import { useState } from "react";
import { useAuth } from "../lib/auth";
import { Sheet, SheetHeader } from "./ui";

export function AccountSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { cloudEnabled, signIn, signUp, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setErr(null);
    setMsg(null);
    const fn = mode === "signup" ? signUp : signIn;
    const { error } = await fn(email.trim(), password);
    setBusy(false);
    if (error) {
      setErr(error);
      return;
    }
    if (mode === "signup") {
      setMsg("Check your email to confirm, then sign in. Your data will sync.");
    } else {
      onClose();
    }
  }

  return (
    <Sheet open={open} onClose={onClose}>
      <SheetHeader
        title={mode === "signup" ? "Create account" : "Sign in"}
        onClose={onClose}
      />

      {!cloudEnabled ? (
        <div className="card" style={{ background: "var(--caution-tint)" }}>
          <p className="tiny" style={{ color: "var(--caution)", fontWeight: 600, lineHeight: 1.6 }}>
            Cloud sync isn't configured in this build yet. Add your Supabase URL
            and anon key (see SETUP.md) to enable accounts, multi-device sync,
            and backup. The app works fully offline in the meantime.
          </p>
        </div>
      ) : (
        <>
          <p className="tiny muted" style={{ marginBottom: 16, lineHeight: 1.6 }}>
            Sync your allergens, foods, and reactions across devices and keep them
            backed up. Your current data will move to your account.
          </p>

          <button
            className="btn secondary"
            style={{ marginBottom: 14 }}
            onClick={signInWithGoogle}
          >
            Continue with Google
          </button>

          <div className="field">
            <label>Email</label>
            <input
              className="input"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              className="input"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {err && (
            <p className="tiny" style={{ color: "var(--avoid)", marginBottom: 10 }}>
              {err}
            </p>
          )}
          {msg && (
            <p className="tiny" style={{ color: "var(--safe)", marginBottom: 10 }}>
              {msg}
            </p>
          )}

          <button
            className="btn"
            onClick={submit}
            disabled={busy || !email || !password}
          >
            {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
          </button>

          <button
            className="btn ghost"
            onClick={() => {
              setMode(mode === "signup" ? "signin" : "signup");
              setErr(null);
              setMsg(null);
            }}
          >
            {mode === "signup"
              ? "Already have an account? Sign in"
              : "New here? Create an account"}
          </button>
        </>
      )}
    </Sheet>
  );
}
