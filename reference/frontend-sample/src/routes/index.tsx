import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Download, Sparkles, Users, Layers } from "lucide-react";
import { Shell } from "@/components/Shell";
import { CLASSES } from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "USTAD — Lesson Plans for SED Punjab Teachers" },
      { name: "description", content: "Download ready-made lesson plans for Class 1 to 10, every subject, built for Government teachers of SED Punjab." },
      { property: "og:title", content: "USTAD — Unique Smart Teacher Assistant Dashboard" },
      { property: "og:description", content: "Ready-made lesson plans for SED Punjab teachers, Class 1 to 10." },
    ],
  }),
  component: Index,
});

const stats = [
  { icon: Layers, value: "10", label: "Classes" },
  { icon: BookOpen, value: "1,000+", label: "Lesson plans" },
  { icon: Users, value: "SED", label: "Punjab aligned" },
];

function Index() {
  return (
    <Shell>
      <section className="relative overflow-hidden bg-hero text-ink-foreground">
        <div className="absolute inset-0 pattern-dots" />
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full border border-gold/30 animate-spin-slow" />
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full border border-dashed border-gold/40 animate-spin-slow" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-[1.3fr_1fr] md:py-28">
          <div>
            <span className="animate-rise inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gold">
              <Sparkles className="h-3.5 w-3.5" /> For Government Teachers · SED Punjab
            </span>
            <h1 className="animate-rise mt-6 text-5xl font-semibold leading-[1.05] md:text-7xl" style={{ animationDelay: "0.1s" }}>
              Plan less. <br /><span className="text-gradient-gold italic">Teach more.</span>
            </h1>
            <p className="animate-rise mt-6 max-w-lg text-lg text-ink-foreground/75" style={{ animationDelay: "0.2s" }}>
              USTAD brings ready-to-use lesson plans for every class and subject — download, print and walk into class prepared.
            </p>
            <div className="animate-rise mt-8 flex flex-wrap gap-3" style={{ animationDelay: "0.3s" }}>
              <Link to="/classes" className="group inline-flex items-center gap-2 rounded-xl bg-gradient-gold px-6 py-3.5 font-semibold text-accent-foreground shadow-lift transition hover:scale-[1.03]">
                Browse lessons <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
            </div>
            <div className="animate-rise mt-12 grid max-w-md grid-cols-3 gap-4" style={{ animationDelay: "0.4s" }}>
              {stats.map((s) => (
                <div key={s.label}>
                  <s.icon className="mb-2 h-5 w-5 text-gold" />
                  <div className="font-display text-2xl font-semibold">{s.value}</div>
                  <div className="text-xs text-ink-foreground/60">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative hidden md:block">
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-floaty absolute rounded-2xl border border-ink-foreground/10 bg-ink-foreground/5 p-5 backdrop-blur-md"
                style={{ top: `${i * 30 + 2}%`, left: `${i * 14}%`, width: "70%", animationDelay: `${i * 1.2}s` }}>
                <div className="flex items-center justify-between text-xs text-ink-foreground/60">
                  <span>Week {i + 3}</span><span className="rounded bg-gold/20 px-2 py-0.5 text-gold">PDF</span>
                </div>
                <div className="mt-2 font-display text-lg">{["Mathematics: Fractions", "English: Reading Skills", "Science: Plants"][i]}</div>
                <div className="mt-4 flex items-center gap-2 text-xs text-ink-foreground/70"><Download className="h-3.5 w-3.5" /> Class {i + 4}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative overflow-hidden border-t border-ink-foreground/10 py-3">
          <div className="animate-marquee flex w-max gap-10 whitespace-nowrap text-sm text-ink-foreground/50">
            {[...Array(2)].flatMap((_, k) =>
              ["English", "اردو", "Mathematics", "Science", "Islamiat", "Social Studies", "Computer", "Physics", "Chemistry", "Biology", "Pakistan Studies"].map((s) => <span key={k + s}>✦ {s}</span>))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Choose your class</p>
            <h2 className="mt-2 text-4xl font-semibold">Start with a class</h2>
          </div>
          <Link to="/classes" className="hidden text-sm font-semibold text-primary hover:underline md:block">View all →</Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {CLASSES.map((c, i) => (
            <Link key={c.id} to="/classes/$classId" params={{ classId: c.id }}
              className="animate-rise card-lift group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft"
              style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="absolute -right-4 -top-6 font-display text-8xl font-bold text-secondary transition group-hover:text-gold/30">{c.id}</div>
              <div className="relative">
                <div className="text-xs font-medium text-muted-foreground">{c.stage}</div>
                <div className="mt-8 font-display text-xl font-semibold">{c.name}</div>
                <div className="text-sm text-muted-foreground" dir="rtl">{c.urdu}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </Shell>
  );
}
