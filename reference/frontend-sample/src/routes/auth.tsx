import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Shell } from "@/components/Shell";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Sign in — USTAD" },
      { name: "description", content: "Sign in or create your USTAD teacher account." },
      { property: "og:title", content: "Sign in — USTAD" },
      { property: "og:description", content: "Sign in or create your USTAD teacher account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "up") {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin, data: { full_name: name } } });
        if (error) throw error;
        setSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav({ to: "/profile" });
      }
    } catch (err) { toast.error((err as Error).message); } finally { setBusy(false); }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) { toast.error(String(r.error.message ?? r.error)); return; }
    if (r.redirected) return;
    nav({ to: "/profile" });
  }

  const input = "w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary";
  return (
    <Shell>
      <div className="mx-auto grid max-w-md px-5 py-16">
        <div className="animate-rise rounded-3xl border border-border bg-card p-8 shadow-lift">
          <h1 className="text-3xl font-semibold">{mode === "in" ? "Welcome back" : "Create your account"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">For teachers of SED Punjab</p>
          {sent ? (
            <p className="mt-6 rounded-xl bg-secondary p-4 text-sm">Check your email and click the confirmation link, then sign in.</p>
          ) : (
            <>
              <button onClick={google} className="mt-6 w-full rounded-xl border border-input px-4 py-3 text-sm font-semibold hover:bg-secondary">Continue with Google</button>
              <div className="my-5 text-center text-xs uppercase tracking-widest text-muted-foreground">or</div>
              <form onSubmit={submit} className="space-y-3">
                {mode === "up" && <input required className={input} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />}
                <input required type="email" className={input} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <input required type="password" minLength={6} className={input} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button disabled={busy} className="w-full rounded-xl bg-gradient-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-60">
                  {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Sign up"}
                </button>
              </form>
            </>
          )}
          <button onClick={() => { setMode(mode === "in" ? "up" : "in"); setSent(false); }} className="mt-5 w-full text-sm text-primary hover:underline">
            {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </Shell>
  );
}
