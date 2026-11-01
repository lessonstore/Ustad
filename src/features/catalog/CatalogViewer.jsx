import { useMemo, useState } from "react";
import { curriculumData, isLessonAvailable } from "../../data/curriculumData.js";
import { useUser } from "../../context/UserContext.jsx";
import { getCurrentMonthKey, getPreviousMonthKey, isMonthInActiveWindow } from "../../utils/monthUtils.js";
import InstallPrompt from "../../components/InstallPrompt.jsx";
import AdminPaymentQueue from "../tokens/AdminPaymentQueue.jsx";
import RechargeModal from "../tokens/RechargeModal.jsx";

function monthLabel(monthKey) {
  return new Date(`${monthKey}-01T12:00:00`).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function balancePill(monthKey, tokens) {
  const amount = Number(tokens?.[monthKey] ?? 0);
  if (amount <= 0) return null;
  return (
    <span
      className="min-h-11 content-center rounded-xl bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200"
      key={monthKey}
    >
      {monthLabel(monthKey).split(" ")[0]}: {amount}
    </span>
  );
}

export default function CatalogViewer() {
  const {
    currentUser,
    userProfile,
    loading,
    profileError,
    authError,
    isAdmin,
    signIn,
    signOut,
    unlockLesson,
    openRechargeModal,
    rechargeTargetMonth,
    closeRechargeModal,
  } = useUser();
  const [selectedGradeName, setSelectedGradeName] = useState("Grade 6");
  const [selectedBookId, setSelectedBookId] = useState("grade6-math-english-medium");
  const [selectedMonthKey, setSelectedMonthKey] = useState(getCurrentMonthKey);
  const [unlockError, setUnlockError] = useState("");
  const [busyLessonId, setBusyLessonId] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");

  const selectedGrade =
    curriculumData.find(({ grade }) => grade === selectedGradeName) ??
    curriculumData[0];
  const selectedBook =
    selectedGrade.books.find(({ bookId }) => bookId === selectedBookId) ??
    selectedGrade.books[0];
  const lessonPlanUrl = (lessonNumber = 1) =>
    `/lesson-plan?bookId=${encodeURIComponent(selectedBook.bookId)}&lessonNumber=${lessonNumber}`;

  const monthOptions = useMemo(() => {
    const now = new Date();
    const academicYearStart = now.getMonth() >= 3
      ? now.getFullYear()
      : now.getFullYear() - 1;
    const options = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(academicYearStart, 3 + index, 1);
      return {
        name: new Intl.DateTimeFormat("en", { month: "long" }).format(date),
        key: getCurrentMonthKey(date),
      };
    });
    const previousDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousKey = getCurrentMonthKey(previousDate);
    if (!options.some(({ key }) => key === previousKey)) {
      options.push({
        name: new Intl.DateTimeFormat("en", { month: "long" }).format(previousDate),
        key: previousKey,
      });
    }
    return options.sort((first, second) => first.key.localeCompare(second.key));
  }, []);
  const selectedMonth = monthOptions.find(({ key }) => key === selectedMonthKey);
  const selectedMonthName = selectedMonth?.name ?? monthOptions[0].name;
  const selectedMonthSchedule =
    selectedBook.academicSchedule[selectedMonthName];
  const monthlyLessons = selectedMonthSchedule
    ? selectedBook.lessons
        .filter(
          ({ lessonNumber }) =>
            lessonNumber >= selectedMonthSchedule.startLesson &&
            lessonNumber <= selectedMonthSchedule.endLesson,
        )
        .map((lesson) => ({ ...lesson, month: selectedMonthKey }))
    : [];
  const tokens = userProfile?.tokens ?? {};
  const unlockedLessons = userProfile?.unlockedLessons ?? {};

  async function handleUnlock(lesson) {
    setUnlockError("");
    if (!currentUser) {
      try {
        await signIn();
      } catch {
        return;
      }
      return;
    }

    setBusyLessonId(lesson.id);
    try {
      const result = await unlockLesson(lesson);
      if (result.success) {
        window.location.assign(lessonPlanUrl(lesson.lessonNumber));
      } else if (result.reason === "archived_window_closed") {
        setUnlockError("This lesson is outside the current two-month access window.");
      } else if (result.reason === "authentication_required") {
        setUnlockError("Sign in to unlock this lesson.");
      } else if (result.reason !== "insufficient_tokens") {
        setUnlockError("Could not unlock this lesson.");
      }
    } catch (error) {
      console.error("Could not unlock lesson:", error);
      setUnlockError("Could not unlock this lesson. Please try again.");
    } finally {
      setBusyLessonId("");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-medium text-indigo-600">Learning catalog</p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Ustad Lesson Planner
            </h1>
          </div>
          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
            <InstallPrompt />
            <a
              className="min-h-11 flex-1 content-center rounded-xl border border-indigo-200 bg-white px-4 py-2 text-center text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 sm:flex-none"
              href={lessonPlanUrl()}
            >
              Lesson plan
            </a>
            {currentUser ? (
              <>
                {balancePill(getCurrentMonthKey(), tokens)}
                {balancePill(getPreviousMonthKey(), tokens)}
                <span className="max-w-40 truncate text-sm text-slate-600">
                  {currentUser.displayName || currentUser.email}
                </span>
                <button
                  className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                  onClick={() => void signOut().catch(() => {})}
                  type="button"
                >
                  Sign out
                </button>
                <button
                  className="min-h-11 flex-1 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 sm:flex-none"
                  onClick={() => openRechargeModal(selectedMonthKey)}
                  type="button"
                >
                  Recharge tokens
                </button>
              </>
            ) : (
              <button
                className="min-h-11 flex-1 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white sm:flex-none"
                disabled={loading}
                onClick={() => void signIn().catch(() => {})}
                type="button"
              >
                {loading ? "Loading…" : "Sign in with Google"}
              </button>
            )}
          </div>
        </header>

        {(profileError || authError) && (
          <p className="mb-4 text-sm text-rose-700" role="alert">
            {profileError || authError}
          </p>
        )}
        {paymentMessage && (
          <p
            className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
            role="status"
          >
            {paymentMessage}
          </p>
        )}
        {isAdmin && <AdminPaymentQueue />}

        <section
          aria-label="Catalog filters"
          className="mb-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3 sm:p-5"
        >
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Grade
            <select
              className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              onChange={(event) => {
                const nextGrade = curriculumData.find(
                  ({ grade }) => grade === event.target.value,
                );
                setSelectedGradeName(event.target.value);
                setSelectedBookId(nextGrade.books[0].bookId);
              }}
              value={selectedGrade.grade}
            >
              {curriculumData.map(({ grade }) => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Subject
            <select
              className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              onChange={(event) => setSelectedBookId(event.target.value)}
              value={selectedBook.bookId}
            >
              {selectedGrade.books.map(({ bookId, subject }) => (
                <option key={bookId} value={bookId}>{subject}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Academic month
            <select
              className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              onChange={(event) => setSelectedMonthKey(event.target.value)}
              value={selectedMonthKey}
            >
              {monthOptions.map(({ key, name }) => (
                <option disabled={key > getCurrentMonthKey()} key={key} value={key}>
                  {name} {key.slice(0, 4)}{key === getCurrentMonthKey() ? " · Current" : ""}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section aria-labelledby="book-title">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="mb-1 text-sm text-slate-500">
                {selectedGrade.grade} · {selectedBook.subject}
              </p>
              <h2
                className="text-xl font-semibold tracking-tight sm:text-2xl"
                id="book-title"
              >
                {selectedBook.subject}
              </h2>
            </div>
            <p className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600">
              {monthlyLessons.length} lessons in {selectedMonthName} {selectedMonthKey.slice(0, 4)}
            </p>
          </div>

          {unlockError && (
            <p className="mb-4 text-sm text-rose-700" role="alert">{unlockError}</p>
          )}

          {monthlyLessons.length > 0 ? (
            <ol className="space-y-3">
              {monthlyLessons.map((lesson) => {
                const availability = isLessonAvailable(
                  lesson.lessonNumber,
                  selectedMonthName,
                  selectedBook.academicSchedule,
                );
                const isExpired = !isMonthInActiveWindow(lesson.month);
                const isUnlocked =
                  unlockedLessons?.[lesson.month]?.includes(lesson.id) ?? false;
                const canOpen = lesson.lessonNumber === 1 || isUnlocked;

                return (
                  <li
                    className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5"
                    key={lesson.id}
                  >
                    <div className="min-w-0">
                      <p className="font-medium leading-6 text-slate-900">
                        Lesson {lesson.lessonNumber}: {lesson.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">{lesson.chapterName}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:shrink-0">
                      {isExpired ? (
                        <>
                          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-500">
                            Archived (Expired)
                          </span>
                          <button
                            className="min-h-11 w-full cursor-not-allowed rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-400 sm:w-auto"
                            disabled
                            type="button"
                          >
                            Archived
                          </button>
                        </>
                      ) : canOpen ? (
                        <>
                          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
                            {lesson.lessonNumber === 1 ? "Free Sample" : "Unlocked"}
                          </span>
                          <a
                            className="min-h-11 w-full rounded-xl bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-indigo-700 sm:w-auto"
                            href={lessonPlanUrl(lesson.lessonNumber)}
                          >
                            Open Lesson
                          </a>
                        </>
                      ) : !availability.canUnlock ? (
                        <>
                          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-500">
                            Locked until {availability.scheduledMonth}
                          </span>
                          <button
                            className="min-h-11 w-full cursor-not-allowed rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-400 sm:w-auto"
                            disabled
                            type="button"
                          >
                            Unlock
                          </button>
                        </>
                      ) : (
                        <button
                          className="min-h-11 w-full rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-60 sm:w-auto"
                          disabled={busyLessonId === lesson.id || loading}
                          onClick={() => void handleUnlock(lesson)}
                          type="button"
                        >
                          {currentUser
                            ? `Unlock (1 Token - ${selectedMonthName})`
                            : "Sign in to unlock"}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-600 shadow-sm">
              No lessons are scheduled for {selectedMonthName}.
            </p>
          )}
        </section>
      </div>
      <RechargeModal
        isOpen={Boolean(rechargeTargetMonth)}
        initialTargetMonth={rechargeTargetMonth}
        onClose={closeRechargeModal}
        onSubmitted={() => setPaymentMessage("Payment request submitted. Tokens will be credited after admin verification.")}
      />
    </main>
  );
}
