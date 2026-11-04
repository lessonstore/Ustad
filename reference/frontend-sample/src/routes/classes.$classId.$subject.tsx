import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Clock, Eye, FileText, Search } from "lucide-react";
import { Shell } from "@/components/Shell";
import { lessonsQuery } from "@/lib/api";

export const Route = createFileRoute("/classes/$classId/$subject")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(lessonsQuery(params.classId, params.subject));
    if (!data) throw notFound();
    return { title: `${data.subject} · ${data.cls.name}` };
  },
  head: ({ loaderData }) => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: loaderData ? `${loaderData.title} Lesson Plans — USTAD` : "Lesson Plans — USTAD" },
      { name: "description", content: "Download weekly lesson plans ready for the classroom." },
      { property: "og:title", content: loaderData ? `${loaderData.title} — USTAD` : "USTAD" },
      { property: "og:description", content: "Download weekly lesson plans ready for the classroom." },
    ],
  }),
  pendingComponent: () => (
    <Shell><div className="mx-auto max-w-6xl space-y-3 px-5 py-14">{[...Array(6)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div></Shell>
  ),
  component: SubjectPage,
});

function SubjectPage() {
  const { classId, subject } = Route.useParams();
  const { data } = useSuspenseQuery(lessonsQuery(classId, subject));
  const [q, setQ] = useState("");
  if (!data) return null;
  const list = data.lessons.filter((l) => l.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-5 py-12">
        <Link to="/classes/$classId" params={{ classId }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> {data.cls.name}
        </Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">{data.cls.name}</p>
            <h1 className="animate-rise text-5xl font-semibold">{data.subject}</h1>
          </div>
          <label className="flex w-full items-center gap-2 rounded-xl border border-input bg-card px-4 py-3 shadow-soft md:w-80">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search lessons…" className="w-full bg-transparent text-sm outline-none" />
          </label>
        </div>

        <div className="mt-10 space-y-3">
          {list.map((l, i) => {
            return (
              <div key={l.id} className="animate-rise group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft transition hover:border-primary/40 md:p-5"
                style={{ animationDelay: `${i * 0.04}s` }}>
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-secondary font-display text-primary">
                  <div className="text-center leading-none"><div className="text-[10px] uppercase">Week</div><div className="text-xl font-semibold">{l.week}</div></div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{l.title}</div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{l.duration}</span>
                    <span className="inline-flex items-center gap-1"><FileText className="h-3 w-3" />{l.format} · {l.size}</span>
                    <span>{l.downloads.toLocaleString()} downloads</span>
                  </div>
                </div>
                <Link
                  to="/classes/$classId/$subject/$week" params={{ classId, subject, week: String(l.week) }}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:shadow-lift active:scale-95">
                  <Eye className="h-4 w-4" />
                  <span className="hidden sm:inline">Preview</span>
                </Link>
              </div>
            );
          })}
          {list.length === 0 && <p className="py-10 text-center text-muted-foreground">No lessons match your search.</p>}
        </div>
      </div>
    </Shell>
  );
}
