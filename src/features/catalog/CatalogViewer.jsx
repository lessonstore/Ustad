import { useEffect, useMemo, useState } from "react";
import { collection, db, getDocs, query, where } from "../../services/firebase.js";
import { useUser } from "../../context/UserContext.jsx";
import SiteShell from "../../components/SiteShell.jsx";
import RechargeModal from "../tokens/RechargeModal.jsx";
import { PLANS } from "../tokens/plans.js";
import { curriculumData } from "../../data/curriculumData.js";
import { getCurrentMonthKey } from "../../utils/monthUtils.js";
import UiIcon from "../../components/UiIcon.jsx";
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
  const classesHref = "/classes";
  return (
    <>
      <section className="ustad-hero">
        <div className="ustad-hero-inner">
          <div>
            <span className="ustad-eyebrow"><UiIcon name="graduation" size={14} /> For Government Teachers · SED Punjab</span>
            <h1>Plan less.<br /><em>Teach more.</em></h1>
            <p>Find lesson plans for your class and subject. Preview, prepare, and print your plan for the classroom.</p>
            <a className="ustad-primary-link ustad-hero-action" href={classesHref}>Browse classes <UiIcon name="arrow-right" size={17} /></a>
            <div className="ustad-stats">
              <div className="ustad-stat"><strong>{curriculumData.length}</strong><span>Grade levels available</span></div>
              <div className="ustad-stat"><strong>{curriculumData.reduce((sum, item) => sum + item.books.length, 0)}</strong><span>Subject books</span></div>
              <div className="ustad-stat"><strong>{cardLessonCount().toLocaleString()}+</strong><span>Lesson listings</span></div>
            </div>
          </div>
          <div className="ustad-hero-cards" aria-hidden="true">
            {["Mathematics · Lesson plan", "English · Lesson plan", "Science · Lesson plan"].map((title, index) => (
              <div className="ustad-float-card" key={title}>
                <div className="ustad-float-meta"><span>Class {index + 4}</span><b>LESSON PLAN</b></div>
                <h3>{title}</h3>
                <span className="ustad-float-meta"><span>Ready to preview</span><UiIcon name="book" size={15} /></span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="ustad-section">
        <div className="ustad-section-heading">
          <p>Choose your class</p>
          <h2>Start with a class</h2>
        </div>
        <div className="ustad-class-grid">
          {visibleGrades.map(({ number, grade, name, urdu }) => grade ? (
            <a className="ustad-class-card" href={`/classes/${number}`} key={number}>
              <span className="ustad-class-number">{number}</span>
              <small>{number <= 5 ? "Primary" : number <= 8 ? "Elementary" : "Secondary"}</small>
              <h3>{name}</h3><p dir="rtl">{urdu}</p>
            </a>
          ) : (
            <div aria-disabled="true" className="ustad-class-card" key={number}>
              <span className="ustad-class-number">{number}</span>
              <small>{number <= 5 ? "Primary" : "Secondary"}</small>
              <h3>{name}</h3><p dir="rtl">{urdu}</p><span className="ustad-coming">Coming soon</span>
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
    <section className="ustad-section">
      <div className="ustad-section-heading"><p>Browse the catalog</p><h1>All classes</h1><span>Choose a class, then a subject, to see available lesson plans.</span></div>
      {stages.map((stage) => (
        <div className="ustad-group" key={stage.name}>
          <h2>{stage.name}</h2>
          <div className="ustad-class-grid">
            {stage.numbers.map((number) => {
              const found = visibleGrades[number - 1];
              return found.grade ? (
                <a className="ustad-class-card" href={`/classes/${number}`} key={number}>
                  <span className="ustad-class-number">{number}</span><small>{stage.name}</small>
                  <h3>{found.name}</h3><p dir="rtl">{found.urdu}</p>
                </a>
              ) : (
                <div aria-disabled="true" className="ustad-class-card" key={number}>
                  <span className="ustad-class-number">{number}</span><small>{stage.name}</small>
                  <h3>{found.name}</h3><p dir="rtl">{found.urdu}</p><span className="ustad-coming">Coming soon</span>
                </div>
              );
            })}
          </div>
        </div>
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
  return (
    <section className="ustad-section">
      <a className="ustad-back-link" href="/classes"><UiIcon name="arrow-left" size={15} /> All classes</a>
      <div className="ustad-section-heading"><p>{grade.grade}</p><h1>Choose a subject</h1><span>Select the subject and language medium.</span></div>
      <div className="ustad-subject-grid">
        {uniqueSubjects.map(({ key, book, label }) => (
          <a className="ustad-subject-card" href={`/classes/${number}/${book.bookId}`} key={key}>
            <small>{book.medium}</small><h3>{label}</h3>
            <p>{book.lessons.length} lesson listings <UiIcon name="arrow-right" size={14} /></p>
          </a>
        ))}
      </div>
    </section>
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
    <section className="ustad-section">
      <a className="ustad-back-link" href={`/classes/${number}`}><UiIcon name="arrow-left" size={15} /> {grade.grade}</a>
      <div className="ustad-section-heading"><p>{grade.grade}</p><h1>{book.subject}</h1><span>{book.medium} · {book.lessons.length} lessons</span></div>
      <label className="ustad-search"><UiIcon name="search" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search lessons…" /></label>
      <div className="ustad-lesson-list">
        {lessons.map((lesson) => {
          const title = lesson.topic ?? lesson.title ?? `Lesson ${lesson.lessonNumber}`;
          const month = monthForLesson(book, lesson.lessonNumber);
          const monthName = Object.entries(book.academicSchedule).find(([, range]) => lesson.lessonNumber >= range.startLesson && lesson.lessonNumber <= range.endLesson)?.[0];
          const params = new URLSearchParams({ bookId: book.bookId, lessonNumber: String(lesson.lessonNumber), ...(month ? { month } : {}) });
          return (
            <article className="ustad-lesson-card" key={lesson.id}>
              <span className="ustad-week"><small>Lesson</small><b>{lesson.lessonNumber}</b></span>
              <span className="ustad-lesson-info"><b>{title}</b><small>{lesson.chapterName}{monthName ? ` · ${monthName}` : ""}</small></span>
              <a className="ustad-preview-link" href={`/lesson-plan?${params}`}>Preview</a>
            </article>
          );
        })}
        {!lessons.length && <p className="ustad-empty">No lessons match your search.</p>}
      </div>
    </section>
  );
}

function PlansPage() {
  const { currentUser, hasBasePlan, signIn } = useUser();
  const [showRecharge, setShowRecharge] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("basic");
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const activePlan = hasBasePlan(currentMonth());
  return (
    <>
      <section className="ustad-page-hero"><div className="ustad-page-hero-inner"><p className="ustad-eyebrow">Token plans</p><h1>Choose your monthly plan</h1><p>Lesson previews cost 10 tokens. Monthly tokens reset on the first day of each month.</p><span className="ustad-sale-note">Introductory sale · 50% off displayed plan prices</span></div></section>
      <section className="ustad-section">
        {paymentSubmitted && <p className="ustad-success-alert" role="status">Payment request submitted. Tokens will be added after your payment is verified.</p>}
        <div className="ustad-plans-grid">
          {PLANS.map((plan) => {
            const locked = plan.id === "addon" && !activePlan;
            return (
              <article className={`ustad-plan-card${plan.popular ? " is-popular" : ""}`} key={plan.id}>
                {plan.popular && <span className="ustad-plan-popular">Most popular</span>}
                <h2>{plan.name}</h2>
                <div className="ustad-plan-sale"><del>Rs {(plan.price * 2).toLocaleString()}</del><b>50% OFF</b></div>
                <div className="ustad-plan-price">Rs {plan.price.toLocaleString()}</div>
                <div className="ustad-plan-tokens"><UiIcon name="coins" size={15} /> {plan.tokens.toLocaleString()} tokens</div>
                <p>{plan.tagline}</p>
                <button className="ustad-button" disabled={locked} onClick={() => {
                  if (!currentUser) { void signIn().catch(() => {}); return; }
                  setSelectedPlanId(plan.id);
                  setShowRecharge(true);
                }} type="button">{locked ? "Needs an active plan" : currentUser ? "Buy with EasyPaisa" : "Sign in to buy"}</button>
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
  if (!currentUser) return <section className="ustad-section"><h1>Sign in to view your account</h1><p>Your plan and payment history will appear here.</p></section>;
  return (
    <section className="ustad-section">
      <div className="ustad-profile-heading"><h1>Assalam-o-Alaikum{currentUser.displayName ? `, ${currentUser.displayName.split(" ")[0]}` : ""}</h1><div className="ustad-profile-actions">{isAdmin && <a className="ustad-outline-button" href="/admin">Admin</a>}<button className="ustad-outline-button" onClick={() => void signOut().catch(() => {})} type="button">Sign out</button></div></div>
      <div className="ustad-profile-grid">
        <article className="ustad-profile-card ustad-profile-wallet"><p>{new Date().toLocaleString("en", { month: "long", year: "numeric" })}</p><div className="ustad-profile-balance">{Number(userProfile?.tokens?.[month] ?? 0).toLocaleString()}</div><p>tokens · {hasBasePlan(month) ? "Active plan" : "No active plan"}</p><a className="ustad-button" href="/pricing">Buy a plan</a></article>
        <article className="ustad-profile-card"><h2>Teacher account</h2><p>{currentUser.displayName || "Teacher"}</p><p>{currentUser.email}</p><p>Sign-in and saved account data are managed securely with Firebase.</p></article>
      </div>
      <h2 className="ustad-history-title">Payment history</h2>
      {paymentError ? <p className="ustad-purchase-error" role="alert">{paymentError}</p> : loadingPayments ? <p>Loading payment history…</p> : payments.length ? <div className="ustad-payment-list">{payments.map((payment) => (
        <article className="ustad-payment-row" key={payment.id}><div><b>{PLANS.find((plan) => plan.id === payment.planId)?.name ?? payment.planId}</b> · Rs {PLANS.find((plan) => plan.id === payment.planId)?.price ?? "—"} · {payment.tokenAmount} tokens<small>Transaction {payment.tid} · {payment.createdAt?.toDate?.().toLocaleString() ?? "Pending date"}</small></div><span className={`ustad-status ustad-status-${payment.status}`}>{payment.status}</span></article>
      ))}</div> : <p className="ustad-empty">No payments yet.</p>}
    </section>
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
