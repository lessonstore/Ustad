import { useState } from "react";
import { curriculumData, isLessonAvailable } from "../../data/curriculumData.js";
import RechargeModal from "../tokens/RechargeModal.jsx";
import InstallPrompt from "../../components/InstallPrompt.jsx";

const academicMonths = [
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
  "January",
  "February",
  "March",
];

export default function CatalogViewer() {
  const [selectedGradeName, setSelectedGradeName] = useState("Grade 6");
  const [selectedBookId, setSelectedBookId] = useState(
    "grade6-math-english-medium",
  );
  const [selectedMonth, setSelectedMonth] = useState("April");
  const [tokenBalance, setTokenBalance] = useState(0);
  const [unlockedLessonIds, setUnlockedLessonIds] = useState(() => new Set());
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);

  const selectedGrade =
    curriculumData.find(({ grade }) => grade === selectedGradeName) ??
    curriculumData[0];
  const selectedBook =
    selectedGrade.books.find(({ bookId }) => bookId === selectedBookId) ??
    selectedGrade.books[0];
  const lessonPlanUrl = (lessonNumber = 1) =>
    `/lesson-plan?bookId=${encodeURIComponent(selectedBook.bookId)}&lessonNumber=${lessonNumber}`;
  const selectedMonthSchedule = selectedBook.academicSchedule[selectedMonth];
  const monthlyLessons = selectedMonthSchedule
    ? selectedBook.lessons.filter(
        ({ lessonNumber }) =>
          lessonNumber >= selectedMonthSchedule.startLesson &&
          lessonNumber <= selectedMonthSchedule.endLesson,
      )
    : [];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-medium text-indigo-600">
              Learning catalog
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Ustad Lesson Planner
            </h1>
          </div>
          <div className="flex w-full items-center gap-3 sm:w-auto">
            <InstallPrompt />
            <a
              className="min-h-11 flex-1 content-center rounded-xl border border-indigo-200 bg-white px-4 py-2 text-center text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 sm:flex-none"
              href={lessonPlanUrl()}
            >
              Lesson plan
            </a>
            <span className="min-h-11 flex-1 content-center rounded-xl bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 sm:flex-none">
              {tokenBalance} tokens
            </span>
            <button
              className="min-h-11 flex-1 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:flex-none"
              onClick={() => setIsRechargeOpen(true)}
              type="button"
            >
              Recharge tokens
            </button>
          </div>
        </header>

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
                <option key={grade} value={grade}>
                  {grade}
                </option>
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
                <option key={bookId} value={bookId}>
                  {subject}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Academic month
            <select
              className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              onChange={(event) => setSelectedMonth(event.target.value)}
              value={selectedMonth}
            >
              {academicMonths.map((month) => (
                <option key={month} value={month}>
                  {month}
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
              {monthlyLessons.length} lessons in {selectedMonth}
            </p>
          </div>

          {monthlyLessons.length > 0 ? (
            <ol className="space-y-3">
              {monthlyLessons.map((lesson) => {
              const availability = isLessonAvailable(
                lesson.lessonNumber,
                selectedMonth,
                selectedBook.academicSchedule,
              );
              const isUnlocked = unlockedLessonIds.has(lesson.id);

              return (
                <li
                  className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5"
                  key={lesson.id}
                >
                  <div className="min-w-0">
                    <p className="font-medium leading-6 text-slate-900">
                      Lesson {lesson.lessonNumber}: {lesson.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {lesson.chapterName}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:shrink-0">
                    {lesson.isFreeSample ? (
                      <>
                        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
                          Free Sample
                        </span>
                        <a
                          className="min-h-11 w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
                          href={lessonPlanUrl(lesson.lessonNumber)}
                        >
                          Open Lesson
                        </a>
                      </>
                    ) : isUnlocked ? (
                      <>
                        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
                          Unlocked
                        </span>
                        <a
                          className="min-h-11 w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
                          href={lessonPlanUrl(lesson.lessonNumber)}
                        >
                          Open Lesson
                        </a>
                      </>
                    ) : availability.canUnlock ? (
                      <>
                        <span className="rounded-full bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800">
                          1 Token
                        </span>
                        <button
                          className="min-h-11 w-full rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
                          onClick={() => {
                            if (tokenBalance < lesson.tokenCost) {
                              setIsRechargeOpen(true);
                              return;
                            }

                            setTokenBalance((balance) => balance - lesson.tokenCost);
                            setUnlockedLessonIds((unlocked) =>
                              new Set(unlocked).add(lesson.id),
                            );
                          }}
                          type="button"
                        >
                          {tokenBalance >= lesson.tokenCost ? "Unlock" : "Get Tokens"}
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-500">
                          <svg
                            aria-hidden="true"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M7 10V7a5 5 0 0 1 10 0v3m-11 0h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1.8"
                            />
                          </svg>
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
                    )}
                  </div>
                </li>
              );
              })}
            </ol>
          ) : (
            <p className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-600 shadow-sm">
              No lessons are scheduled for {selectedMonth}.
            </p>
          )}
        </section>
      </div>
      {isRechargeOpen && (
        <RechargeModal
          onClose={() => setIsRechargeOpen(false)}
          onSimulateRecharge={(tokens) =>
            setTokenBalance((balance) => balance + tokens)
          }
        />
      )}
    </main>
  );
}
