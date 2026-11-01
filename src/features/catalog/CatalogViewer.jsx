import { useEffect, useMemo, useState } from "react";
import {
  collection,
  db,
  getDocs,
  orderBy,
  query,
} from "../../services/firebase.js";
import grade8ScienceIndex from "../../data/grade8ScienceIndex.json";
import { curriculumData, isLessonAvailable } from "../../data/curriculumData.js";
import { useUser } from "../../context/UserContext.jsx";
import {
  getCurrentMonthKey,
  getPreviousMonthKey,
  isMonthInActiveWindow,
} from "../../utils/monthUtils.js";
import InstallPrompt from "../../components/InstallPrompt.jsx";
import RechargeModal from "../tokens/RechargeModal.jsx";

const urduGradeNames = {
  "Grade 4": "چہارم",
  "Grade 5": "پنجم",
  "Grade 6": "ششم",
  "Grade 7": "ہفتم",
  "Grade 8": "ہشتم",
};

const urduSubjectNames = {
  math: "ریاضی",
  science: "جنرل سائنس",
  english: "انگریزی",
  urdu: "اردو",
};
const catalogReturnSelectionKey = "ustad-catalog-return-selection";

function subjectKeyForBook(book) {
  if (book.bookId === "grade8-science") return "science";
  return Object.keys(urduSubjectNames).find((key) =>
    book.bookId.includes(`-${key}-`),
  );
}

function saveCatalogReturnSelection(grade, bookId, monthKey) {
  try {
    window.sessionStorage.setItem(
      catalogReturnSelectionKey,
      JSON.stringify({ grade, bookId, monthKey }),
    );
  } catch (error) {
    console.error("Could not save catalog selection for return navigation:", error);
  }
}

function readCatalogReturnSelection() {
  try {
    const savedSelection = window.sessionStorage.getItem(
      catalogReturnSelectionKey,
    );
    if (!savedSelection) return null;

    const selection = JSON.parse(savedSelection);
    const grade = curriculumData.find(
      ({ grade: gradeName }) => gradeName === selection.grade,
    );
    const book = grade?.books.find(
      ({ bookId }) => bookId === selection.bookId,
    );
    if (!grade || !book) return null;

    return { grade: grade.grade, bookId: book.bookId, monthKey: selection.monthKey };
  } catch (error) {
    console.error("Could not restore catalog selection:", error);
    return null;
  }
}

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
    const [returnSelection] = useState(readCatalogReturnSelection);
    const [selectedGradeName, setSelectedGradeName] = useState(
      returnSelection?.grade ?? "Grade 6",
    );
    const [selectedBookId, setSelectedBookId] = useState(
      returnSelection?.bookId ?? "grade6-math-english-medium",
    );
    const [selectedMonthKey, setSelectedMonthKey] = useState(
      returnSelection?.monthKey ?? getCurrentMonthKey(),
    );
  const [unlockError, setUnlockError] = useState("");
  const [busyLessonId, setBusyLessonId] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [scienceLessons, setScienceLessons] = useState(grade8ScienceIndex);

  useEffect(() => {
    if (!returnSelection) return;

    try {
      window.sessionStorage.removeItem(catalogReturnSelectionKey);
    } catch (error) {
      console.error("Could not clear restored catalog selection:", error);
    }
  }, [returnSelection]);

  useEffect(() => {
    let active = true;

    async function loadScienceIndex() {
      if (!navigator.onLine) {
        setScienceLessons(grade8ScienceIndex);
        return;
      }

      try {
        const snapshot = await getDocs(
          query(collection(db, "lesson_indexes"), orderBy("lessonNumber", "asc")),
        );
        const outlines = snapshot.docs
          .map((lessonDocument) => lessonDocument.data())
          .filter((lesson) => lesson.bookId === "grade8-science")
          .map((lesson) => ({
            ...lesson,
            title: lesson.topic,
            isFreeSample: lesson.lessonNumber === 1,
            tokenCost: lesson.lessonNumber === 1 ? 0 : 1,
          }));
        if (outlines.length !== grade8ScienceIndex.length) {
          throw new Error(
            `Expected ${grade8ScienceIndex.length} Grade 8 science lessons; found ${outlines.length}.`,
          );
        }
        if (active) setScienceLessons(outlines);
      } catch (error) {
        console.error("Could not load Grade 8 science lesson outlines:", error);
        if (active) setScienceLessons(grade8ScienceIndex);
      }
    }

    void loadScienceIndex();
    window.addEventListener("online", loadScienceIndex);
    return () => {
      active = false;
      window.removeEventListener("online", loadScienceIndex);
    };
  }, []);

  const selectedGrade =
    curriculumData.find(({ grade }) => grade === selectedGradeName) ??
    curriculumData[0];
  const selectedBook =
    selectedGrade.books.find(({ bookId }) => bookId === selectedBookId) ??
    selectedGrade.books[0];
  const isGrade8Science = selectedBook.bookId === "grade8-science";
  const isUrduDisplay =
    selectedBook.medium === "Urdu Medium" || selectedBook.language === "ur";
  const urduSubjectKey = isGrade8Science
    ? "science"
    : Object.keys(urduSubjectNames).find((subjectKey) =>
        selectedBook.bookId.includes(`-${subjectKey}-`),
      );
  const displaySubject = isUrduDisplay
    ? urduSubjectNames[urduSubjectKey] ?? selectedBook.subject
    : selectedBook.subject;
  const lessonPlanUrl = (lessonNumber = 1) => {
    const params = new URLSearchParams({
      bookId: selectedBook.bookId,
      lessonNumber: String(lessonNumber),
      month: selectedMonthKey,
    });
    return `/lesson-plan?${params}`;
  };

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
  const monthlyLessons = isGrade8Science
    ? scienceLessons.map((lesson) => ({ ...lesson, month: selectedMonthKey }))
    : selectedMonthSchedule
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
            {isAdmin && (
              <a
                className="min-h-11 flex-1 content-center rounded-xl border border-amber-200 bg-white px-4 py-2 text-center text-sm font-semibold text-amber-800 transition hover:bg-amber-50 sm:flex-none"
                href="/admin"
              >
                Admin Queue
              </a>
            )}
            <a
              className="min-h-11 flex-1 content-center rounded-xl border border-indigo-200 bg-white px-4 py-2 text-center text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 sm:flex-none"
              href={lessonPlanUrl()}
              onClick={() =>
                saveCatalogReturnSelection(
                  selectedGradeName,
                  selectedBook.bookId,
                  selectedMonthKey,
                )
              }
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
                const currentSubjectKey = subjectKeyForBook(selectedBook);
                const matchingBook = nextGrade.books.find(
                  (book) =>
                    subjectKeyForBook(book) === currentSubjectKey &&
                    book.language === selectedBook.language &&
                    book.medium === selectedBook.medium,
                );
                setSelectedGradeName(event.target.value);
                setSelectedBookId(
                  matchingBook?.bookId ?? nextGrade.books[0].bookId,
                );
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
            <div
              className={
                isUrduDisplay
                  ? "order-2 text-right sm:flex-1"
                  : ""
              }
            >
              <p className="mb-1 text-sm text-slate-500">
                {isUrduDisplay
                  ? `جماعت: ${urduGradeNames[selectedGrade.grade]}`
                  : `${selectedGrade.grade} · ${selectedBook.subject}`}
              </p>
              <h2
                className="text-xl font-semibold tracking-tight sm:text-2xl"
                id="book-title"
              >
                {displaySubject}
              </h2>
            </div>
            <p
              className={`rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 ${
                isUrduDisplay ? "order-1" : ""
              }`}
            >
              {monthlyLessons.length} lessons in {selectedMonthName} {selectedMonthKey.slice(0, 4)}
            </p>
          </div>

          {unlockError && (
            <p className="mb-4 text-sm text-rose-700" role="alert">{unlockError}</p>
          )}

          {monthlyLessons.length > 0 ? (
            <ol className="space-y-3">
              {monthlyLessons.map((lesson) => {
                const availability = isGrade8Science
                  ? { canUnlock: true, scheduledMonth: null }
                  : isLessonAvailable(
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
                    <div
                      className={`min-w-0 sm:flex-1 ${isUrduDisplay ? "pr-2 sm:pr-4" : ""}`}
                      dir={isUrduDisplay ? "rtl" : "ltr"}
                    >
                      <p className={`font-medium leading-6 text-slate-900 ${isUrduDisplay ? "text-right" : ""}`}>
                        Lesson {lesson.lessonNumber}: {lesson.title}
                      </p>
                      <p className={`mt-1 text-sm text-slate-500 ${isUrduDisplay ? "text-right" : ""}`}>
                        {lesson.chapterName}
                      </p>
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
                            className={`min-h-11 w-full rounded-xl px-4 py-2 text-center text-sm font-semibold text-white transition sm:w-auto ${
                              isGrade8Science && lesson.lessonNumber === 1
                                ? "bg-emerald-700 hover:bg-emerald-800"
                                : "bg-indigo-600 hover:bg-indigo-700"
                            }`}
                            href={lessonPlanUrl(lesson.lessonNumber)}
                            onClick={() =>
                              saveCatalogReturnSelection(
                                selectedGradeName,
                                selectedBook.bookId,
                                selectedMonthKey,
                              )
                            }
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
                          {isGrade8Science
                            ? "Unlock (1 Token)"
                            : currentUser
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
