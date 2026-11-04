import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Atom, BookOpen, Calculator, Globe, Laptop, Languages, Moon, FlaskConical, Leaf, Flag, Lightbulb } from "lucide-react";
import { Shell } from "@/components/Shell";
import { CLASSES, slug } from "@/lib/api";

const ICONS: Record<string, typeof BookOpen> = {
  English: Languages, Urdu: BookOpen, Mathematics: Calculator, Islamiat: Moon, "General Knowledge": Lightbulb,
  "General Science": FlaskConical, "Social Studies": Globe, Computer: Laptop, "Computer Science": Laptop,
  Physics: Atom, Chemistry: FlaskConical, Biology: Leaf, "Pakistan Studies": Flag,
};

export const Route = createFileRoute("/classes/$classId/")({
  loader: ({ params }) => {
    const cls = CLASSES.find((c) => c.id === params.classId);
    if (!cls) throw notFound();
    return cls;
  },
  head: ({ loaderData }) => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: loaderData ? `${loaderData.name} Subjects — USTAD` : "Class — USTAD" },
      { name: "description", content: "Choose a subject to download lesson plans." },
      { property: "og:title", content: loaderData ? `${loaderData.name} — USTAD` : "USTAD" },
      { property: "og:description", content: "Choose a subject to download lesson plans." },
    ],
  }),
  component: ClassPage,
});

function ClassPage() {
  const cls = Route.useLoaderData();
  return (
    <Shell>
      <section className="relative overflow-hidden bg-hero text-ink-foreground">
        <div className="absolute inset-0 pattern-dots" />
        <div className="absolute -right-6 -top-16 font-display text-[16rem] font-bold leading-none text-ink-foreground/5">{cls.id}</div>
        <div className="relative mx-auto max-w-6xl px-5 py-14">
          <Link to="/classes" className="inline-flex items-center gap-1 text-sm text-ink-foreground/70 hover:text-gold"><ArrowLeft className="h-4 w-4" /> All classes</Link>
          <p className="mt-6 text-sm uppercase tracking-widest text-gold">{cls.stage}</p>
          <h1 className="animate-rise mt-2 text-5xl font-semibold md:text-6xl">{cls.name}</h1>
          <p className="mt-2 text-xl text-ink-foreground/70" dir="rtl">{cls.urdu}</p>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="mb-6 text-3xl font-semibold">Subjects</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cls.subjects.map((s, i) => {
            const Icon = ICONS[s] ?? BookOpen;
            return (
              <Link key={s} to="/classes/$classId/$subject" params={{ classId: cls.id, subject: slug(s) }}
                className="animate-rise card-lift group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft"
                style={{ animationDelay: `${i * 0.06}s` }}>
                <span className="grid h-14 w-14 place-items-center rounded-xl bg-secondary text-primary transition group-hover:bg-gradient-primary group-hover:text-primary-foreground group-hover:rotate-6">
                  <Icon className="h-6 w-6" />
                </span>
                <span>
                  <span className="block font-display text-lg font-semibold">{s}</span>
                  <span className="text-sm text-muted-foreground">12 lesson plans</span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}
