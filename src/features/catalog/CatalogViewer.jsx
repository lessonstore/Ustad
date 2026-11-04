import { useEffect, useMemo, useState } from "react";
import { collection, db, getDocs, query, where } from "../../services/firebase.js";
import { useUser } from "../../context/UserContext.jsx";
import SiteShell from "../../components/SiteShell.jsx";
import RechargeModal from "../tokens/RechargeModal.jsx";
import { PLANS } from "../tokens/plans.js";
import { curriculumData } from "../../data/curriculumData.js";
import { getCurrentMonthKey } from "../../utils/monthUtils.js";
import UiIcon from "../../components/UiIcon.jsx";
import { navigateTo } from "../../utils/navigation.js";
import "./catalog-theme.css";

const gradeNumber = (grade) => Number(grade.replace(/\D/g, ""));
const roman = ["اول", "دوم", "سوم", "چہارم", "پنجم", "ششم", "ہفتم", "ہشتم", "نہم", "دہم"];
const currentMonth = () => getCurrentMonthKey();
const visibleGrades = Array.from({ length: 10 }, (_, index) => {
  const number = index + 1;
  const grade = curriculumData.find((item) => gradeNumber(item.grade) === number);
  return { number, grade, name: `Class ${number}`, urdu: `جماعت ${roman[index]}` };
});

function cardLessonCount() {
  return curriculumData.reduce((total, grade) => total + grade.books.reduce((sum, book) => sum + book.lessons.length, 0), 0);
}

function monthForLesson(book, lessonNumber) {
  const month = Object.entries(book.academicSchedule).find(([, range]) => lessonNumber >= range.startLesson && lessonNumber <= range.endLesson)?.[0];
  if (!month) return null;
  const now = new Date();
  const academicYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const monthIndex = new Date(`${month} 1, 2000`).getMonth();
  const year = monthIndex >= 3 ? academicYear : academicYear + 1;
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

function findGrade(number) {
  return curriculumData.find((item) => gradeNumber(item.grade) === Number(number));
}

function HomePage() {
  const lessonCount = cardLessonCount();
  const subjects = ["English", "اردو", "Mathematics", "Science", "Islamiat", "Social Studies", "Computer", "Physics", "Chemistry", "Biology", "Pakistan Studies"];
  return (
    <>
      <section className="relative overflow-hidden bg-hero text-ink-foreground">
        <div className="absolute inset-0 pattern-dots" />
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full border border-gold/30 animate-spin-slow" />
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full border border-dashed border-gold/40 animate-spin-slow" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-[1.3fr_1fr] md:py-28">
          <div>
            <span className="animate-rise inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gold">
              <UiIcon name="sparkles" size={14} /> For Government Teachers · SED Punjab
            </span>
            <h1 className="animate-rise mt-6 text-5xl font-semibold leading-[1.05] md:text-7xl" style={{ animationDelay: "0.1s" }}>
              Plan less. <br /><span className="text-gradient-gold italic">Teach more.</span>
            </h1>
            <p className="animate-rise mt-6 max-w-lg text-lg text-ink-foreground/75" style={{ animationDelay: "0.2s" }}>
              USTAD brings ready-to-use lesson plans for available classes and subjects — prepare and print for your classroom.
            </p>
            <div className="animate-rise mt-8 flex flex-wrap gap-3" style={{ animationDelay: "0.3s" }}>
              <a href="/classes" className="group inline-flex items-center gap-2 rounded-xl bg-gradient-gold px-6 py-3.5 font-semibold text-accent-foreground shadow-lift transition hover:scale-[1.03]">
                Browse lessons <UiIcon name="arrow-right" size={16} />
              </a>
            </div>
            <div className="animate-rise mt-12 grid max-w-md grid-cols-3 gap-4" style={{ animationDelay: "0.4s" }}>
              {[
                { icon: "layers", value: String(curriculumData.length), label: "Grade levels" },
                { icon: "book", value: String(curriculumData.reduce((sum, item) => sum + item.books.length, 0)), label: "Subject books" },
                { icon: "users", value: `${lessonCount.toLocaleString()}+`, label: "Lesson plans" },
              ].map((stat) => (
                <div key={stat.label}>
                  <UiIcon name={stat.icon} size={20} />
                  <div className="font-display text-2xl font-semibold">{stat.value}</div>
                  <div className="text-xs text-ink-foreground/60">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative hidden md:block">
            {[0, 1, 2].map((index) => (
              <div key={index} className="animate-floaty absolute rounded-2xl border border-ink-foreground/10 bg-ink-foreground/5 p-5 backdrop-blur-md" style={{ top: `${index * 30 + 2}%`, left: `${index * 14}%`, width: "70%", animationDelay: `${index * 1.2}s` }}>
                <div className="flex items-center justify-between text-xs text-ink-foreground/60">
                  <span>Lesson {index + 3}</span><span className="rounded bg-gold/20 px-2 py-0.5 text-gold">PLAN</span>
                </div>
                <div className="mt-2 font-display text-lg">{["Mathematics: Factors and Multiples", "English: Reading Skills", "Science: Plants"][index]}</div>
                <div className="mt-4 flex items-center gap-2 text-xs text-ink-foreground/70"><UiIcon name="download" size={14} /> Class {index + 4}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative overflow-hidden border-t border-ink-foreground/10 py-3">
          <div className="animate-marquee flex w-max gap-10 whitespace-nowrap text-sm text-ink-foreground/50">
            {[0, 1].flatMap((copy) => subjects.map((subject) => <span key={`${copy}-${subject}`}>✦ {subject}</span>))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Choose your class</p>
            <h2 className="mt-2 text-4xl font-semibold">Start with a class</h2>
          </div>
          <a href="/classes" className="hidden text-sm font-semibold text-primary hover:underline md:block">View all →</a>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {visibleGrades.map(({ number, grade, name, urdu }) => grade ? (
            <a key={number} href={`/classes/${number}`} className="animate-rise card-lift group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft" style={{ animationDelay: `${number * 0.05}s` }}>
              <div className="absolute -right-4 -top-6 font-display text-8xl font-bold text-secondary transition group-hover:text-gold/30">{number}</div>
              <div className="relative">
                <div className="text-xs font-medium text-muted-foreground">{number <= 5 ? "Primary" : number <= 8 ? "Elementary" : "Secondary"}</div>
                <div className="mt-8 font-display text-xl font-semibold">{name}</div>
                <div className="text-sm text-muted-foreground" dir="rtl">{urdu}</div>
              </div>
            </a>
          ) : (
            <div key={number} aria-disabled="true" className="animate-rise relative overflow-hidden rounded-2xl border border-border bg-card p-5 opacity-60 shadow-soft" style={{ animationDelay: `${number * 0.05}s` }}>
              <div className="absolute -right-4 -top-6 font-display text-8xl font-bold text-secondary">{number}</div>
              <div className="relative">
                <div className="text-xs font-medium text-muted-foreground">{number <= 5 ? "Primary" : "Secondary"}</div>
                <div className="mt-8 font-display text-xl font-semibold">{name}</div>
                <div className="text-sm text-muted-foreground" dir="rtl">{urdu}</div>
                <span className="mt-2 inline-block rounded-full bg-gold/20 px-2 py-1 text-xs font-semibold">Coming soon</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function ClassesPage() {
  const stages = [
    { name: "Primary", numbers: [1, 2, 3, 4, 5] },
    { name: "Elementary", numbers: [6, 7, 8] },
    { name: "Secondary", numbers: [9, 10] },
  ];
  return (
    <section className="mx-auto max-w-6xl px-5 py-14">
      <h1 className="animate-rise text-5xl font-semibold">All classes</h1>
      <p className="animate-rise mt-3 text-muted-foreground">Pick a class, then a subject, to see its lesson plans.</p>
      {stages.map((stage) => (
        <section key={stage.name} className="mt-12">
          <h2 className="mb-5 flex items-center gap-3 text-2xl font-semibold"><span className="h-2 w-2 rounded-full bg-gold" />{stage.name}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {stage.numbers.map((number) => {
              const found = visibleGrades[number - 1];
              return <article key={number} className={`animate-rise card-lift rounded-2xl border border-border bg-card p-6 shadow-soft${found.grade ? "" : " opacity-60"}`} style={{ animationDelay: `${(number % 5) * 0.07}s` }}>
                <a href={found.grade ? `/classes/${number}` : undefined} aria-disabled={!found.grade} className="group flex items-center justify-between rounded-lg">
                  <span className="font-display text-2xl font-semibold transition group-hover:text-primary">{found.name}</span>
                  <span className="text-sm text-muted-foreground transition group-hover:text-primary" dir="rtl">{found.urdu}</span>
                </a>
                {found.grade ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {found.grade.books.map((book) => (
                      <a key={book.bookId} href={`/classes/${number}/${book.bookId}`} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground transition hover:bg-primary hover:text-primary-foreground">{book.subject}</a>
                    ))}
                  </div>
                ) : <span className="mt-4 inline-block rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold">Coming soon</span>}
              </article>;
            })}
          </div>
        </section>
      ))}
    </section>
  );
}

function SubjectsPage({ number }) {
  const grade = findGrade(number);
  if (!grade) return <NotAvailable />;
  const uniqueSubjects = grade.books.reduce((subjects, book) => {
    const key = `${book.subjectName}-${book.medium}`;
    if (!subjects.some((item) => item.key === key)) subjects.push({ key, book, label: book.subject });
    return subjects;
  }, []);
  const iconForSubject = (book) => {
    if (book.subjectName.includes("Mathematics")) return "calculator";
    if (book.subjectName.includes("Science")) return "flask";
    if (book.subjectName.includes("English")) return "book";
    if (book.subjectName.includes("Urdu")) return "book";
    if (book.subjectName.includes("Computer")) return "laptop";
    if (book.subjectName.includes("Islamiat")) return "moon";
    if (book.subjectName.includes("Social")) return "globe";
    if (book.subjectName.includes("Pakistan")) return "flag";
    return "book";
  };
  return (
    <>
      <section className="relative overflow-hidden bg-hero text-ink-foreground">
        <div className="absolute inset-0 pattern-dots" />
        <div className="absolute -right-6 -top-16 font-display text-[16rem] font-bold leading-none text-ink-foreground/5">{number}</div>
        <div className="relative mx-auto max-w-6xl px-5 py-14">
          <a href="/classes" className="inline-flex items-center gap-1 text-sm text-ink-foreground/70 hover:text-gold"><UiIcon name="arrow-left" size={16} /> All classes</a>
          <p className="mt-6 text-sm uppercase tracking-widest text-gold">{number <= 5 ? "Primary" : "Elementary"}</p>
          <h1 className="animate-rise mt-2 text-5xl font-semibold md:text-6xl">{grade.grade}</h1>
          <p className="mt-2 text-xl text-ink-foreground/70" dir="rtl">{roman[Number(number) - 1] ? `جماعت ${roman[Number(number) - 1]}` : ""}</p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="mb-6 text-3xl font-semibold">Subjects</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {uniqueSubjects.map(({ key, book, label }, index) => (
            <a key={key} href={`/classes/${number}/${book.bookId}`} className="animate-rise card-lift group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft" style={{ animationDelay: `${index * 0.06}s` }}>
              <span className="grid h-14 w-14 place-items-center rounded-xl bg-secondary text-primary transition group-hover:rotate-6 group-hover:bg-gradient-primary group-hover:text-primary-foreground"><UiIcon name={iconForSubject(book)} size={24} /></span>
              <span>
                <span className="block font-display text-lg font-semibold">{label}</span>
                <span className="text-sm text-muted-foreground">{book.lessons.length} lesson plans</span>
              </span>
            </a>
          ))}
        </div>
      </section>
    </>
  );
}

function LessonsPage({ number, bookId }) {
  const grade = findGrade(number);
  const book = grade?.books.find((item) => item.bookId === bookId);
  const [search, setSearch] = useState("");
  const lessons = useMemo(() => (book?.lessons ?? []).filter((lesson) => {
    const title = lesson.topic ?? lesson.title ?? `Lesson ${lesson.lessonNumber}`;
    return `${title} ${lesson.chapterName ?? ""}`.toLowerCase().includes(search.toLowerCase());
  }), [book, search]);
  if (!book || !grade) return <NotAvailable />;
  return (
    <section className="mx-auto max-w-6xl px-5 py-12">
      <a href={`/classes/${number}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"><UiIcon name="arrow-left" size={16} /> {grade.grade}</a>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">{grade.grade} · {book.medium}</p>
          <h1 className="animate-rise text-5xl font-semibold">{book.subject}</h1>
        </div>
        <label className="flex w-full items-center gap-2 rounded-xl border border-input bg-card px-4 py-3 shadow-soft md:w-80">
          <UiIcon name="search" size={16} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search lessons…" className="w-full bg-transparent text-sm outline-none" />
        </label>
      </div>
      <div className="mt-10 space-y-3">
        {lessons.map((lesson) => {
          const title = lesson.topic ?? lesson.title ?? `Lesson ${lesson.lessonNumber}`;
          const month = monthForLesson(book, lesson.lessonNumber);
          const monthName = Object.entries(book.academicSchedule).find(([, range]) => lesson.lessonNumber >= range.startLesson && lesson.lessonNumber <= range.endLesson)?.[0];
          const params = new URLSearchParams({ bookId: book.bookId, lessonNumber: String(lesson.lessonNumber), ...(month ? { month } : {}) });
          return (
            <article key={lesson.id} className="animate-rise group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft transition hover:border-primary/40 md:p-5" style={{ animationDelay: `${Math.min(lesson.lessonNumber - 1, 10) * 0.04}s` }}>
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-secondary font-display text-primary">
                <span className="text-center leading-none"><span className="block text-[10px] uppercase">Lesson</span><span className="text-xl font-semibold">{lesson.lessonNumber}</span></span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{title}</span>
                <span className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{lesson.chapterName ?? `Lesson ${lesson.lessonNumber}`}</span>
                  {monthName && <span>{monthName}</span>}
                </span>
              </span>
              <a href={`/lesson-plan?${params}`} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:shadow-lift active:scale-95">
                <UiIcon name="eye" size={16} /><span className="hidden sm:inline">Preview</span>
              </a>
            </article>
          );
        })}
        {!lessons.length && <p className="py-10 text-center text-muted-foreground">No lessons match your search.</p>}
      </div>
    </section>
  );
}

function PlansPage() {
  const { currentUser, hasBasePlan } = useUser();
  const [showRecharge, setShowRecharge] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("basic");
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const activePlan = hasBasePlan(currentMonth());
  return (
    <>
      <section className="bg-hero text-ink-foreground">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <p className="text-sm uppercase tracking-widest text-gold">Token plans</p>
          <h1 className="animate-rise mt-2 text-5xl font-semibold">Pick your monthly plan</h1>
          <p className="mt-3 max-w-xl text-ink-foreground/75">Every lesson costs 10 tokens. Plans last for the current month — tokens reset on the 1st.</p>
          <p className="mt-4 inline-block rounded-full bg-gradient-gold px-4 py-1.5 text-sm font-bold text-accent-foreground">Introductory sale · Flat 50% off all plans</p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-14">
        {paymentSubmitted && <p className="mb-5 rounded-xl border border-primary/20 bg-secondary p-4 text-sm text-primary" role="status">Request sent! Tokens will be added after your payment is verified.</p>}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan, index) => {
            const locked = plan.id === "addon" && !activePlan;
            return (
              <article key={plan.id} className={`animate-rise card-lift relative flex flex-col rounded-3xl border bg-card p-6 shadow-soft ${plan.popular ? "border-primary" : "border-border"} ${locked ? "opacity-60" : ""}`} style={{ animationDelay: `${index * 0.07}s` }}>
                {plan.popular && <span className="absolute -top-3 left-6 rounded-full bg-gradient-gold px-3 py-1 text-xs font-bold text-accent-foreground">Most popular</span>}
                <h2 className="text-2xl font-semibold">{plan.name}</h2>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-lg text-muted-foreground line-through">Rs {(plan.price * 2).toLocaleString()}</span>
                  <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-bold text-destructive">50% OFF</span>
                </div>
                <div className="mt-1 font-display text-4xl font-semibold">Rs {plan.price.toLocaleString()}</div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-gold">Introductory sale price</div>
                <div className="mt-2 inline-flex items-center gap-1.5 text-primary"><UiIcon name="coins" size={16} /><b>{plan.tokens.toLocaleString()}</b> tokens</div>
                <p className="mt-3 flex-1 text-sm text-muted-foreground">{plan.tagline}</p>
                <button className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary px-4 py-3 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:bg-none disabled:bg-muted disabled:text-muted-foreground" disabled={locked} onClick={() => {
                  if (!currentUser) { navigateTo("/auth"); return; }
                  setSelectedPlanId(plan.id);
                  setShowRecharge(true);
                }} type="button">{locked ? "Needs an active plan" : currentUser ? "Buy with Easypaisa" : "Buy with Easypaisa"}</button>
              </article>
            );
          })}
        </div>
      </section>
      <RechargeModal isOpen={showRecharge} initialPlanId={selectedPlanId} onClose={() => setShowRecharge(false)} onSubmitted={() => setPaymentSubmitted(true)} />
    </>
  );
}

function ProfilePage() {
  const { currentUser, userProfile, signOut, hasBasePlan, isAdmin } = useUser();
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [paymentError, setPaymentError] = useState("");
  const month = currentMonth();
  const activePlan = PLANS.find((plan) => plan.id === userProfile?.subscriptions?.[month]?.planId)?.name;
  useEffect(() => {
    if (!currentUser) { setLoadingPayments(false); return; }
    let active = true;
    setLoadingPayments(true);
    void getDocs(query(collection(db, "payment_requests"), where("userId", "==", currentUser.uid)))
      .then((snapshot) => {
        if (active) setPayments(snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .sort((first, second) => (second.createdAt?.toMillis?.() ?? 0) - (first.createdAt?.toMillis?.() ?? 0)));
      })
      .catch((error) => {
        console.error("Could not load payment history:", error);
        if (active) setPaymentError("Payment history could not be loaded. Please try again later.");
      })
      .finally(() => { if (active) setLoadingPayments(false); });
    return () => { active = false; };
  }, [currentUser]);
  if (!currentUser) return (
    <div className="mx-auto grid max-w-md px-5 py-16">
      <section className="animate-rise rounded-3xl border border-border bg-card p-8 shadow-lift">
        <h1 className="text-3xl font-semibold">Welcome to USTAD</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to view your tokens, plan and payment history.</p>
        <a href="/auth" className="mt-6 inline-flex rounded-xl bg-gradient-primary px-5 py-3 font-semibold text-primary-foreground">Sign in</a>
      </section>
    </div>
  );
  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="animate-rise text-4xl font-semibold">Assalam-o-Alaikum{currentUser.displayName ? `, ${currentUser.displayName.split(" ")[0]}` : ""}</h1>
        <div className="flex gap-2">
          {isAdmin && <a href="/admin" className="inline-flex items-center gap-2 rounded-xl border border-input px-4 py-2 text-sm font-semibold hover:bg-secondary"><UiIcon name="shield" size={16} /> Admin</a>}
          <button onClick={() => void signOut().catch(() => {})} className="inline-flex items-center gap-2 rounded-xl border border-input px-4 py-2 text-sm font-semibold hover:bg-secondary" type="button"><UiIcon name="logout" size={16} /> Sign out</button>
        </div>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <article className="animate-rise relative overflow-hidden rounded-3xl bg-hero p-7 text-ink-foreground shadow-lift">
          <div className="absolute inset-0 pattern-dots" />
          <div className="relative">
            <p className="text-sm uppercase tracking-widest text-gold">{new Date().toLocaleString("en", { month: "long", year: "numeric" })}</p>
            <div className="mt-4 flex items-center gap-3"><UiIcon name="coins" size={32} /><span className="font-display text-6xl font-semibold">{Number(userProfile?.tokens?.[month] ?? 0).toLocaleString()}</span><span className="text-ink-foreground/70">tokens</span></div>
            <p className="mt-3 text-ink-foreground/80">Plan: <b>{hasBasePlan(month) ? activePlan ?? "Active" : "No active plan"}</b></p>
            <p className="mt-1 text-xs text-ink-foreground/60">Tokens reset on the 1st of every month.</p>
            <a href="/pricing" className="mt-6 inline-block rounded-xl bg-gradient-gold px-5 py-3 font-semibold text-accent-foreground">{hasBasePlan(month) ? "Buy Add-on / upgrade" : "Buy a plan"}</a>
          </div>
        </article>
        <article className="animate-rise space-y-3 rounded-3xl border border-border bg-card p-7 shadow-soft">
          <h2 className="text-xl font-semibold">Teacher profile</h2>
          <p className="text-sm text-muted-foreground">{currentUser.email}</p>
          <div className="rounded-xl border border-input bg-background px-4 py-3 text-sm">{currentUser.displayName || "Teacher"}</div>
          <p className="text-sm text-muted-foreground">Your sign-in and account data are securely managed with Firebase.</p>
        </article>
      </div>
      <h2 className="mt-12 text-2xl font-semibold">Payment history</h2>
      <div className="mt-4 space-y-2">
        {paymentError ? <p className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive" role="alert">{paymentError}</p> : loadingPayments ? <p className="text-muted-foreground">Loading payment history…</p> : payments.map((payment) => {
          const plan = PLANS.find((item) => item.id === payment.planId);
          const statusClass = payment.status === "approved" ? "bg-secondary text-primary" : payment.status === "rejected" ? "bg-destructive/15 text-destructive" : "bg-gold/20 text-foreground";
          return <article key={payment.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
            <div><b>{plan?.name ?? payment.planId}</b> · Rs {plan?.price ?? "—"} · {Number(payment.tokenAmount ?? 0).toLocaleString()} tokens<small className="block text-xs text-muted-foreground">TID {payment.tid} · {payment.createdAt?.toDate?.().toLocaleString() ?? "Pending date"}</small></div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClass}`}>{payment.status}</span>
          </article>;
        })}
        {!paymentError && !loadingPayments && payments.length === 0 && <p className="text-muted-foreground">No payments yet.</p>}
      </div>
    </div>
  );
}

function NotAvailable() {
  return <section className="ustad-section"><a className="ustad-back-link" href="/classes"><UiIcon name="arrow-left" size={15} /> All classes</a><h1>Content coming soon</h1><p>This class or subject is not available in the current lesson catalog yet.</p></section>;
}

export default function CatalogViewer() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const parts = path.split("/").filter(Boolean);
  let page;
  if (path === "/") page = <HomePage />;
  else if (path === "/classes") page = <ClassesPage />;
  else if (parts[0] === "classes" && parts.length === 2) page = <SubjectsPage number={parts[1]} />;
  else if (parts[0] === "classes" && parts.length === 3) page = <LessonsPage number={parts[1]} bookId={decodeURIComponent(parts[2])} />;
  else if (path === "/pricing") page = <PlansPage />;
  else if (path === "/profile") page = <ProfilePage />;
  else page = <NotAvailable />;
  return <SiteShell><main className="ustad-main">{page}</main></SiteShell>;
}
