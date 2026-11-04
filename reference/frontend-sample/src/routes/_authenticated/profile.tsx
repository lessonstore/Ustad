import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Coins, LogOut, ShieldCheck } from "lucide-react";
import { Shell } from "@/components/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/use-account";
import { planName } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "My Profile — USTAD" },
      { name: "description", content: "Your USTAD teacher profile, tokens and payments." },
      { property: "og:title", content: "My Profile — USTAD" },
      { property: "og:description", content: "Your USTAD teacher profile, tokens and payments." },
    ],
  }),
  component: Profile,
});

const STATUS: Record<string, string> = { pending: "bg-gold/20 text-foreground", approved: "bg-secondary text-primary", rejected: "bg-destructive/15 text-destructive" };

function Profile() {
  const { user, wallet, isAdmin } = useAccount();
  const qc = useQueryClient();
  const nav = useNavigate();
  const profile = useQuery({
    queryKey: ["profile", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle()).data,
  });
  const payments = useQuery({
    queryKey: ["payments", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("payment_requests").select("*").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });
  const [form, setForm] = useState({ full_name: "", school: "", district: "", phone: "" });
  useEffect(() => { if (profile.data) setForm({ full_name: profile.data.full_name, school: profile.data.school, district: profile.data.district, phone: profile.data.phone }); }, [profile.data]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("profiles").upsert({ id: user!.id, ...form });
    if (error) { toast.error(error.message); return; }
    toast.success("Profile saved");
    qc.invalidateQueries({ queryKey: ["profile"] });
  }
  async function signOut() {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    nav({ to: "/auth", replace: true });
  }

  const input = "w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary";
  const month = new Date().toLocaleString("en", { month: "long", year: "numeric" });
  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="animate-rise text-4xl font-semibold">Assalam-o-Alaikum{form.full_name ? `, ${form.full_name.split(" ")[0]}` : ""}</h1>
          <div className="flex gap-2">
            {isAdmin && <Link to="/admin" className="inline-flex items-center gap-2 rounded-xl border border-input px-4 py-2 text-sm font-semibold hover:bg-secondary"><ShieldCheck className="h-4 w-4" /> Admin</Link>}
            <button onClick={signOut} className="inline-flex items-center gap-2 rounded-xl border border-input px-4 py-2 text-sm font-semibold hover:bg-secondary"><LogOut className="h-4 w-4" /> Sign out</button>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.3fr]">
          <div className="animate-rise relative overflow-hidden rounded-3xl bg-hero p-7 text-ink-foreground shadow-lift">
            <div className="absolute inset-0 pattern-dots" />
            <div className="relative">
              <p className="text-sm uppercase tracking-widest text-gold">{month}</p>
              <div className="mt-4 flex items-center gap-3"><Coins className="h-8 w-8 text-gold" /><span className="font-display text-6xl font-semibold">{wallet?.tokens ?? 0}</span><span className="text-ink-foreground/70">tokens</span></div>
              <p className="mt-3 text-ink-foreground/80">Plan: <b>{planName(wallet?.plan)}</b></p>
              <p className="mt-1 text-xs text-ink-foreground/60">Tokens reset on the 1st of every month.</p>
              <Link to="/pricing" className="mt-6 inline-block rounded-xl bg-gradient-gold px-5 py-3 font-semibold text-accent-foreground">{wallet?.plan ? "Buy Add-on / upgrade" : "Buy a plan"}</Link>
            </div>
          </div>

          <form onSubmit={save} className="animate-rise space-y-3 rounded-3xl border border-border bg-card p-7 shadow-soft">
            <h2 className="text-xl font-semibold">Teacher profile</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <input className={input} placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            <input className={input} placeholder="School name" value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} />
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={input} placeholder="District" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
              <input className={input} placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <button className="rounded-xl bg-gradient-primary px-5 py-3 font-semibold text-primary-foreground">Save profile</button>
          </form>
        </div>

        <h2 className="mt-12 text-2xl font-semibold">Payment history</h2>
        <div className="mt-4 space-y-2">
          {(payments.data ?? []).map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
              <div><b>{planName(p.plan)}</b> · Rs {p.amount} · {p.tokens} tokens<div className="text-xs text-muted-foreground">TID {p.txn_id} · {new Date(p.created_at).toLocaleString()}</div></div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS[p.status]}`}>{p.status}</span>
            </div>
          ))}
          {payments.data?.length === 0 && <p className="text-muted-foreground">No payments yet.</p>}
        </div>
      </div>
    </Shell>
  );
}
