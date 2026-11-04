import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Shell } from "@/components/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/use-account";
import { planName } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Payment Approvals — USTAD Admin" },
      { name: "description", content: "Approve or reject Easypaisa payment requests." },
      { property: "og:title", content: "USTAD Admin" },
      { property: "og:description", content: "Approve or reject Easypaisa payment requests." },
    ],
  }),
  component: Admin,
});

function Admin() {
  const { isAdmin } = useAccount();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
  const list = useQuery({
    queryKey: ["admin-payments", tab], enabled: isAdmin,
    queryFn: async () => {
      const { data } = await supabase.from("payment_requests").select("*").eq("status", tab).order("created_at", { ascending: false });
      const ids = [...new Set((data ?? []).map((r) => r.user_id))];
      const { data: profs } = ids.length ? await supabase.from("profiles").select("id, full_name, school, district").in("id", ids) : { data: [] };
      return (data ?? []).map((r) => ({ ...r, profile: profs?.find((p) => p.id === r.user_id) }));
    },
  });

  async function review(id: string, approve: boolean) {
    const { error } = await supabase.rpc("review_payment", { _id: id, _approve: approve });
    if (error) { toast.error(error.message); return; }
    toast.success(approve ? "Approved — tokens added" : "Rejected");
    qc.invalidateQueries({ queryKey: ["admin-payments"] });
  }

  if (!isAdmin) return <Shell><p className="py-20 text-center text-muted-foreground">Only admins can see this page.</p></Shell>;
  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-5 py-12">
        <h1 className="text-4xl font-semibold">Payment requests</h1>
        <div className="mt-6 flex gap-2">
          {(["pending", "approved", "rejected"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize ${tab === t ? "bg-gradient-primary text-primary-foreground" : "border border-input hover:bg-secondary"}`}>{t}</button>
          ))}
        </div>
        <div className="mt-6 space-y-3">
          {(list.data ?? []).map((r) => (
            <div key={r.id} className="animate-rise flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div>
                <div className="font-semibold">{r.profile?.full_name || "Unnamed teacher"} <span className="text-sm font-normal text-muted-foreground">· {r.profile?.school} {r.profile?.district}</span></div>
                <div className="mt-1 text-sm">{planName(r.plan)} · <b>Rs {r.amount}</b> · {r.tokens} tokens</div>
                <div className="mt-1 text-xs text-muted-foreground">TID <span className="font-mono">{r.txn_id}</span> · from {r.sender_phone} · {new Date(r.created_at).toLocaleString()}</div>
              </div>
              {tab === "pending" && (
                <div className="flex gap-2">
                  <button onClick={() => review(r.id, true)} className="inline-flex items-center gap-1 rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Check className="h-4 w-4" />Approve</button>
                  <button onClick={() => review(r.id, false)} className="inline-flex items-center gap-1 rounded-xl border border-destructive px-4 py-2 text-sm font-semibold text-destructive"><X className="h-4 w-4" />Reject</button>
                </div>
              )}
            </div>
          ))}
          {list.data?.length === 0 && <p className="py-10 text-center text-muted-foreground">Nothing here.</p>}
        </div>
      </div>
    </Shell>
  );
}
