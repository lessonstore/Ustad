import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Shell } from "@/components/Shell";
import { classesQuery, slug } from "@/lib/api";

export const Route = createFileRoute("/classes/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "All Classes — USTAD" },
      { name: "description", content: "Browse lesson plans for Class 1 to 10 by subject." },
      { property: "og:title", content: "All Classes — USTAD" },
      { property: "og:description", content: "Browse lesson plans for Class 1 to 10 by subject." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(classesQuery()),
  component: ClassesPage,
});

function ClassesPage() {
  const { data } = useSuspenseQuery(classesQuery());
  const stages = ["Primary", "Elementary", "Secondary"];
  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-5 py-14">
        <h1 className="animate-rise text-5xl font-semibold">All classes</h1>
        <p className="animate-rise mt-3 text-muted-foreground">Pick a class, then a subject, to see its lesson plans.</p>
        {stages.map((stage) => (
          <section key={stage} className="mt-12">
            <h2 className="mb-5 flex items-center gap-3 text-2xl font-semibold">
              <span className="h-2 w-2 rounded-full bg-gold" />{stage}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {data.filter((c) => c.stage === stage).map((c, i) => (
                <div key={c.id} className="animate-rise card-lift rounded-2xl border border-border bg-card p-6 shadow-soft" style={{ animationDelay: `${i * 0.07}s` }}>
                  <Link to="/classes/$classId" params={{ classId: c.id }} className="group flex items-center justify-between rounded-lg">
                    <span className="font-display text-2xl font-semibold transition group-hover:text-primary">{c.name}</span>
                    <span className="text-sm text-muted-foreground transition group-hover:text-primary" dir="rtl">{c.urdu}</span>
                  </Link>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {c.subjects.map((s) => (
                      <Link key={s} to="/classes/$classId/$subject" params={{ classId: c.id, subject: slug(s) }}
                        className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground transition hover:bg-primary hover:text-primary-foreground">
                        {s}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Shell>
  );
}
