import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Coins, Download, Pencil, Share2, Check, Lock, Eye } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Shell } from "@/components/Shell";
import { lessonsQuery } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/use-account";
import { useServerFn } from "@tanstack/react-start";
import { readPurchasedLesson } from "@/lib/lessons.functions";
import { Button } from "@/components/ui/button";
import { LESSON_COST } from "@/lib/plans";

export const Route = createFileRoute("/classes/$classId/$subject_/$week")({
  loader: async ({ context, params }) => {
    const d = await context.queryClient.ensureQueryData(lessonsQuery(params.classId, params.subject));
    const lesson = d?.lessons.find((item) => item.week === Number(params.week));
    if (!d || !lesson) throw notFound();
    return { title: lesson.title, cls: d.cls.name };
  },
  head: ({ loaderData }) => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: loaderData ? `${loaderData.title} · ${loaderData.cls} — USTAD` : "Lesson Preview — USTAD" },
      { name: "description", content: "Preview, edit and download this lesson plan as a PDF." },
      { property: "og:title", content: loaderData ? `${loaderData.title} — USTAD` : "USTAD Lesson" },
      { property: "og:description", content: "Preview, edit and download this lesson plan as a PDF." },
    ],
  }),
  component: LessonPreview,
});

async function buildPdf(el: HTMLElement) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas-pro"), import("jspdf")]);
  const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff" });
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const w = 210, h = 297;
  const imgH = (canvas.height * w) / canvas.width;
  const img = canvas.toDataURL("image/jpeg", 0.92);
  let y = 0;
  pdf.addImage(img, "JPEG", 0, y, w, imgH);
  while (imgH + y > h) { y -= h; pdf.addPage(); pdf.addImage(img, "JPEG", 0, y, w, imgH); }
  return pdf.output("blob");
}

function LessonPreview() {
  const { classId, subject, week } = Route.useParams();
  const { data: catalog } = useSuspenseQuery(lessonsQuery(classId, subject));
  const metadata = catalog?.lessons.find((item) => item.week === Number(week));
  const readLesson = useServerFn(readPurchasedLesson);
  const { user, wallet, refetchWallet } = useAccount();
  const nav = useNavigate();
  const sheet = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState<"dl" | "share" | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const profile = useQuery({
    queryKey: ["profile", user?.id], enabled: !!user,
    queryFn: async () => {
      if (!user) return null;
      return (await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()).data;
    },
  });
  const unlocked = useQuery({
    queryKey: ["unlocked", user?.id, metadata?.id], enabled: !!user && !!metadata,
    queryFn: async () => {
      if (!user || !metadata) return false;
      const { data: rows, error } = await supabase.from("unlocks").select("lesson_id").eq("user_id", user.id).eq("lesson_id", metadata.id);
      if (error) throw error;
      return (rows?.length ?? 0) > 0;
    },
  });
  const content = useQuery({
    queryKey: ["purchased-lesson", user?.id, classId, subject, week],
    enabled: !!user && unlocked.data === true,
    queryFn: () => readLesson({ data: { classId, subject, week: Number(week) } }),
  });
  const data = user && unlocked.data === true ? content.data : undefined;
  useEffect(() => { setEditing(false); setConfirm(false); }, [user?.id, classId, subject, week]);
  if (!metadata || !catalog) return null;
  const fileName = `USTAD-${catalog.cls.name}-${catalog.subject}-Week${metadata.week}.pdf`.replace(/\s+/g, "-");

  function askUnlock() {
    if (!user) { nav({ to: "/auth" }); return; }
    setConfirm(true);
  }

  async function doUnlock() {
    if (!metadata) return;
    setUnlocking(true);
    const { error } = await supabase.rpc("unlock_lesson", { _lesson_id: metadata.id });
    setUnlocking(false);
    setConfirm(false);
    if (error) {
      const poor = error.message.includes("Not enough");
      toast.error(poor ? `You need ${LESSON_COST} tokens. Buy a plan first.` : error.message);
      if (poor) nav({ to: "/pricing" });
      return;
    }
    toast.success(`${LESSON_COST} tokens used — lesson purchased`);
    await Promise.all([unlocked.refetch(), refetchWallet()]);
  }

  async function prepare() {
    if (!user) { nav({ to: "/auth" }); return null; }
    if (!unlocked.data || !data) { setConfirm(true); return null; }
    setEditing(false);
    await new Promise((r) => setTimeout(r, 50));
    if (!sheet.current) return null;
    const blob = await buildPdf(sheet.current);
    return blob;
  }

  function save(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  async function onDownload() {
    setBusy("dl");
    try { const b = await prepare(); if (b) save(b); } finally { setBusy(null); }
  }

  async function onShare() {
    setBusy("share");
    try {
      if (!user || !unlocked.data || !data) { askUnlock(); return; }
      const b = await prepare();
      if (!b) return;
      const file = new File([b], fileName, { type: "application/pdf" });
      if (navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file], title: data.title }); }
        catch (e) { if ((e as DOMException).name !== "AbortError") toast.message("Tap Share again to send the PDF"); }
      } else { save(b); toast.message("Sharing isn't supported here, so the PDF was downloaded."); }
    } finally { setBusy(null); }
  }

  const ed = { contentEditable: editing, suppressContentEditableWarning: true } as const;
  const btn = "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-95 disabled:opacity-60";
  return (
    <Shell>
      <div className="mx-auto max-w-5xl px-5 py-10">
        <Link to="/classes/$classId/$subject" params={{ classId, subject }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> {catalog.subject} · {catalog.cls.name}
        </Link>
        <div className="sticky top-[68px] z-30 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/90 p-3 shadow-soft backdrop-blur">
          <div className="flex items-center gap-2 text-sm">
            <Coins className="h-4 w-4 text-primary" />
            {unlocked.data ? <span className="inline-flex items-center gap-1 text-primary"><Check className="h-4 w-4" />Unlocked</span>
              : <span>Preview costs <b>{LESSON_COST} tokens</b>{user ? ` · you have ${wallet?.tokens ?? 0}` : ""}</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            {!unlocked.data && (
              <Button onClick={askUnlock} disabled={unlocking || unlocked.isLoading} className={`${btn} bg-accent text-accent-foreground`}><Eye className="h-4 w-4" />Preview · {LESSON_COST}</Button>
            )}
            <Button disabled={!data} onClick={() => { setEditing((e) => !e); }} className={`${btn} border border-input ${editing ? "bg-secondary" : "hover:bg-secondary"}`}>
              <Pencil className="h-4 w-4" />{editing ? "Done editing" : "Edit"}
            </Button>
            <Button onClick={onShare} disabled={!!busy || !data} className={`${btn} border border-input hover:bg-secondary`}><Share2 className="h-4 w-4" />{busy === "share" ? "Preparing…" : "Share"}</Button>
            <Button onClick={onDownload} disabled={!!busy || !data} className={`${btn} bg-gradient-primary text-primary-foreground`}><Download className="h-4 w-4" />{busy === "dl" ? "Preparing…" : "Download PDF"}</Button>
          </div>
        </div>
        {editing && <p className="mt-3 text-center text-sm text-primary">Click any text on the page to change it.</p>}

        <AlertDialog open={confirm} onOpenChange={setConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Purchase and preview this lesson?</AlertDialogTitle>
              <AlertDialogDescription>
                {LESSON_COST} tokens will be deducted from your balance ({wallet?.tokens ?? 0} tokens). After purchase you can preview, edit, download and share it anytime without paying again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={unlocking}>Cancel</AlertDialogCancel>
              <AlertDialogAction disabled={unlocking} onClick={(e) => { e.preventDefault(); doUnlock(); }}>
                {unlocking ? "Purchasing…" : `Confirm · ${LESSON_COST} tokens`}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {!data && <div className="flex min-h-80 flex-col items-center justify-center gap-4 py-12 text-center">
          <Lock className="h-10 w-10 text-primary" />
          <h1 className="text-2xl font-semibold">{metadata.title}</h1>
          <p className="text-sm text-muted-foreground">{content.isError ? "Unable to load your purchased lesson. Please try again." : unlocked.data ? "Loading your purchased lesson…" : `Purchase for ${LESSON_COST} tokens to preview this lesson.`}</p>
          {content.isError && <Button onClick={() => content.refetch()}>Try again</Button>}
        </div>}
        {data && <div className="mt-6 overflow-x-auto pb-6">
          <div ref={sheet} className={`animate-rise mx-auto w-[794px] bg-card p-12 text-foreground shadow-lift ${editing ? "ring-2 ring-primary/40" : ""}`} style={{ minHeight: 1123 }}>
            <div className="flex items-start justify-between border-b-4 border-primary pb-4">
              <div>
                <div className="font-display text-3xl font-bold text-primary">USTAD</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Lesson Plan · SED Punjab</div>
              </div>
              <div className="text-right text-sm">
                <div {...ed}><b>Teacher:</b> {profile.data?.full_name || "________________"}</div>
                <div {...ed}><b>School:</b> {profile.data?.school || "________________"}</div>
                <div {...ed}><b>Date:</b> ____________</div>
              </div>
            </div>
            <h1 {...ed} className="mt-6 text-3xl font-semibold">{data.title}</h1>
            <div className="mt-3 grid grid-cols-4 gap-2 text-sm">
              {[["Class", data.className], ["Subject", data.subject], ["Week", String(data.week)], ["Duration", data.duration]].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-secondary px-3 py-2"><div className="text-[10px] uppercase text-muted-foreground">{k}</div><div {...ed} className="font-semibold">{v}</div></div>
              ))}
            </div>
            <Section title="Learning Objectives"><ul className="list-disc space-y-1 pl-5">{data.objectives.map((o) => <li key={o} {...ed}>{o}</li>)}</ul></Section>
            <Section title="Materials"><p {...ed}>{data.materials.join(" · ")}</p></Section>
            <Section title="Teaching Activities">
              <table className="w-full border-collapse text-sm">
                <tbody>{data.activities.map((a, i) => (
                  <tr key={i} className="border-b border-border"><td className="w-20 py-2 font-semibold text-primary" {...ed}>{a.time}</td><td className="py-2" {...ed}>{a.step}</td></tr>
                ))}</tbody>
              </table>
            </Section>
            <Section title="Assessment"><ul className="list-disc space-y-1 pl-5">{data.assessment.map((o) => <li key={o} {...ed}>{o}</li>)}</ul></Section>
            <Section title="Homework"><p {...ed}>{data.homework}</p></Section>
            <Section title="Teacher's Notes"><p {...ed} className="min-h-16 text-muted-foreground">{editing ? "Write your notes here…" : "—"}</p></Section>
            <div className="mt-10 border-t border-border pt-3 text-center text-[10px] text-muted-foreground">Generated with USTAD · Unique Smart Teacher Assistant Dashboard</div>
          </div>
        </div>}
      </div>
    </Shell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h2 className="mb-2 font-display text-lg font-semibold text-primary">{title}</h2>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}
