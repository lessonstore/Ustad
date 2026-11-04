import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Coins, Lock, X } from "lucide-react";
import { Shell } from "@/components/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/use-account";
import { EASYPAISA, LESSON_COST, PLANS, type PlanId } from "@/lib/plans";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Token Plans — USTAD" },
      { name: "description", content: "Buy monthly token plans with Easypaisa to download lesson plans." },
      { property: "og:title", content: "Token Plans — USTAD" },
      { property: "og:description", content: "Monthly token plans for SED Punjab teachers, paid with Easypaisa." },
    ],
  }),
  component: Pricing,
});

function Pricing() {
  const { user, wallet } = useAccount();
  const nav = useNavigate();
  const [buying, setBuying] = useState<PlanId | null>(null);
  const hasPlan = !!wallet?.plan;

  return (
    <Shell>
      <section className="bg-hero text-ink-foreground">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <p className="text-sm uppercase tracking-widest text-gold">Token plans</p>
          <h1 className="animate-rise mt-2 text-5xl font-semibold">Pick your monthly plan</h1>
          <p className="mt-3 max-w-xl text-ink-foreground/75">Every lesson costs {LESSON_COST} tokens. Plans last for the current month — tokens reset on the 1st.</p>
          <p className="mt-4 inline-block rounded-full bg-gradient-gold px-4 py-1.5 text-sm font-bold text-accent-foreground">Introductory sale · Flat 50% off all plans</p>
        </div>
      </section>
      <div className="mx-auto grid max-w-6xl gap-5 px-5 py-14 md:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((p, i) => {
          const locked = p.id === "addon" && !hasPlan;
          return (
            <div key={p.id} className={`animate-rise card-lift relative flex flex-col rounded-3xl border bg-card p-6 shadow-soft ${p.popular ? "border-primary" : "border-border"} ${locked ? "opacity-60" : ""}`} style={{ animationDelay: `${i * 0.07}s` }}>
              {p.popular && <span className="absolute -top-3 left-6 rounded-full bg-gradient-gold px-3 py-1 text-xs font-bold text-accent-foreground">Most popular</span>}
              <h2 className="text-2xl font-semibold">{p.name}</h2>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-lg text-muted-foreground line-through">Rs {p.price * 2}</span>
                <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-bold text-destructive">50% OFF</span>
              </div>
              <div className="mt-1 font-display text-4xl font-semibold">Rs {p.price}</div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-gold">Introductory sale price</div>
              <div className="mt-2 inline-flex items-center gap-1.5 text-primary"><Coins className="h-4 w-4" /><b>{p.tokens.toLocaleString()}</b> tokens</div>
              <p className="mt-3 flex-1 text-sm text-muted-foreground">{p.tagline}</p>
              <button
                disabled={locked}
                onClick={() => (user ? setBuying(p.id) : nav({ to: "/auth" }))}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary px-4 py-3 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:bg-none disabled:bg-muted disabled:text-muted-foreground">
                {locked ? <><Lock className="h-4 w-4" /> Needs an active plan</> : "Buy with Easypaisa"}
              </button>
            </div>
          );
        })}
      </div>
      {buying && <BuyDialog plan={buying} onClose={() => setBuying(null)} />}
    </Shell>
  );
}

function BuyDialog({ plan, onClose }: { plan: PlanId; onClose: () => void }) {
  const p = PLANS.find((x) => x.id === plan)!;
  const [txn, setTxn] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const qc = useQueryClient();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("payment_requests").insert({ plan, txn_id: txn.trim(), sender_phone: phone.trim() });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["payments"] });
    setDone(true);
  }

  const input = "w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary";
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="animate-rise w-full max-w-md rounded-3xl bg-card p-7 shadow-lift" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h3 className="text-2xl font-semibold">{p.name} · Rs {p.price}</h3>
          <button onClick={onClose} aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        {done ? (
          <div className="mt-6 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-secondary text-primary"><Check className="h-7 w-7" /></div>
            <p className="mt-4">Request sent! Your {p.tokens} tokens will be added once the payment is verified.</p>
            <Link to="/profile" className="mt-5 inline-block text-primary underline">Go to my profile</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-3">
            <ol className="space-y-2 rounded-2xl bg-secondary p-4 text-sm">
              <li>1. Open Easypaisa and send <b>Rs {p.price}</b> to:</li>
              <li className="pl-4"><b>{EASYPAISA.title}</b> · <span className="font-mono">{EASYPAISA.account}</span></li>
              <li>2. Enter the Transaction ID (TID) from your receipt below.</li>
            </ol>
            <input required className={input} placeholder="Transaction ID (TID)" value={txn} onChange={(e) => setTxn(e.target.value)} />
            <input required className={input} placeholder="Your Easypaisa number" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <button disabled={busy} className="w-full rounded-xl bg-gradient-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-60">{busy ? "Sending…" : "Submit payment"}</button>
          </form>
        )}
      </div>
    </div>
  );
}
