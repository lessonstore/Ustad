import { useEffect, useState } from "react";
import { LessonPlanC } from "./index.js";
import { lessonEn, lessonUr } from "./sampleLessons.js";
import InstallPrompt from "../../components/InstallPrompt.jsx";
import { curriculumData } from "../../data/curriculumData.js";

const storageKeys = {
  schoolName: "ustad-lesson-plan-school-name",
  teacherName: "ustad-lesson-plan-teacher-name",
};

const urduGradeLabels = {
  "Grade 4": "جماعت چہارم",
  "Grade 5": "جماعت پنجم",
  "Grade 6": "جماعت ششم",
  "Grade 7": "جماعت ہفتم",
  "Grade 8": "جماعت ہشتم",
};

function readStoredValue(key) {
  try {
    return window.localStorage.getItem(key) ?? "";
  } catch (error) {
    console.error(`Could not read ${key} from localStorage:`, error);
    return "";
  }
}

export default function LessonPlanScreen() {
  const searchParams = new URLSearchParams(window.location.search);
  const requestedBookId = searchParams.get("bookId");
  const selectedBook = curriculumData
    .flatMap(({ grade, books }) =>
      books.map((book) => ({ ...book, grade })),
    )
    .find(({ bookId }) => bookId === requestedBookId);
  const requestedLessonNumber = Number(searchParams.get("lessonNumber"));
  const lessonNumber =
    Number.isInteger(requestedLessonNumber) && requestedLessonNumber > 0
      ? requestedLessonNumber
      : 1;
  const lang = selectedBook?.language ?? "en";
  const [logo, setLogo] = useState("sed");
  const [schoolName, setSchoolName] = useState(() =>
    readStoredValue(storageKeys.schoolName),
  );
  const [teacherName, setTeacherName] = useState(() =>
    readStoredValue(storageKeys.teacherName),
  );
  const [extraMargin, setExtraMargin] = useState("none");
  const [schoolLogoUrl, setSchoolLogoUrl] = useState("");

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKeys.schoolName, schoolName);
      window.localStorage.setItem(storageKeys.teacherName, teacherName);
    } catch (error) {
      console.error("Could not save lesson plan details to localStorage:", error);
    }
  }, [schoolName, teacherName]);

  useEffect(
    () => () => {
      if (schoolLogoUrl.startsWith("blob:")) {
        URL.revokeObjectURL(schoolLogoUrl);
      }
    },
    [schoolLogoUrl],
  );

  function handleSchoolLogoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setSchoolLogoUrl(URL.createObjectURL(file));
    setLogo("school");
  }

  const branding = {
    logo,
    schoolLogoUrl,
    schoolName,
    teacherName,
    appName: "https://USTADapp.pages.dev",
    extraMargin,
  };

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 sm:p-8 print:bg-white print:p-0">
      <header className="mx-auto mb-6 flex max-w-5xl items-center justify-between gap-4 print:hidden">
        <div>
          <a
            className="text-sm font-medium text-indigo-700 hover:text-indigo-900"
            href="/"
          >
            ← Back to catalog
          </a>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Lesson plan
          </h1>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <InstallPrompt />
          <button
            className="min-h-11 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 print:hidden"
            onClick={() => window.print()}
            type="button"
          >
            Print
          </button>
        </div>
      </header>

      <section
        aria-label="Lesson plan settings"
        className="mx-auto mb-6 grid max-w-5xl gap-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 sm:p-6 print:hidden"
      >
        <label className="grid gap-2 text-sm font-semibold text-slate-700 print:hidden">
          Logo
          <select
            className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-base font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 print:hidden"
            onChange={(event) => setLogo(event.target.value)}
            value={logo}
          >
            <option value="sed">SED logo</option>
            <option value="school">School logo (upload)</option>
            <option value="none">No logo</option>
          </select>
        </label>

        {logo === "school" && (
          <label className="grid gap-2 text-sm font-semibold text-slate-700 print:hidden">
            School logo image
            <input
              accept="image/*"
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white p-2 text-sm font-normal file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:font-medium print:hidden"
              onChange={handleSchoolLogoChange}
              type="file"
            />
          </label>
        )}

        <label className="grid gap-2 text-sm font-semibold text-slate-700 print:hidden">
          School name
          <input
            autoComplete="organization"
            className="min-h-11 rounded-xl border border-slate-300 px-3 text-base font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 print:hidden"
            onChange={(event) => setSchoolName(event.target.value)}
            placeholder="Enter school name"
            value={schoolName}
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-slate-700 print:hidden">
          Teacher name
          <input
            autoComplete="name"
            className="min-h-11 rounded-xl border border-slate-300 px-3 text-base font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 print:hidden"
            onChange={(event) => setTeacherName(event.target.value)}
            placeholder="Enter teacher name"
            value={teacherName}
          />
        </label>

        <details className="sm:col-span-2 print:hidden">
          <summary className="min-h-11 cursor-pointer content-center text-sm font-semibold text-slate-700 print:hidden">
            Advanced
          </summary>
          <label className="mt-3 grid max-w-sm gap-2 text-sm font-semibold text-slate-700 print:hidden">
            Extra binding margin
            <select
              className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-base font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 print:hidden"
              onChange={(event) => setExtraMargin(event.target.value)}
              value={extraMargin}
            >
              <option value="none">None</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </label>
        </details>
      </section>

      <div className="overflow-x-auto print:overflow-visible">
        <LessonPlanC
          lang={lang}
          lesson={{
            ...(lang === "ur" ? lessonUr : lessonEn),
            lessonNo: lessonNumber,
            ...(selectedBook && {
              classLabel:
                lang === "ur"
                  ? urduGradeLabels[selectedBook.grade]
                  : selectedBook.grade,
            }),
          }}
          branding={branding}
        />
      </div>
    </main>
  );
}
