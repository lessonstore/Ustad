import { useEffect, useRef, useState } from "react";
import UiIcon from "../../components/UiIcon.jsx";
import { LessonPlanEditor } from "./index.js";
import { lessonEn, lessonUr } from "./sampleLessons.js";
import { useUser } from "../../context/UserContext.jsx";
import InstallPrompt from "../../components/InstallPrompt.jsx";
import { curriculumData } from "../../data/curriculumData.js";
import { getCurrentMonthKey } from "../../utils/monthUtils.js";
import { LESSON_COST } from "../tokens/plans.js";
import "./LessonPlanScreen.css";

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
const pageWidthPx = (210 / 25.4) * 96;
const pageHeightPx = (297 / 25.4) * 96;

function readStoredValue(key) {
  try {
    return window.localStorage.getItem(key) ?? "";
  } catch (error) {
    console.error(`Could not read ${key} from localStorage:`, error);
    return "";
  }
}

function LockIcon() {
  return <UiIcon name="lock" size={22} />;
}

function EyeIcon() {
  return <UiIcon name="eye" size={16} />;
}

export default function LessonPlanScreen() {
  const { currentUser, userProfile, loading, signIn, authError, profileError, unlockLesson } = useUser();
  const [purchaseConfirm, setPurchaseConfirm] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState("");
  const [logo, setLogo] = useState("sed");
  const [schoolName, setSchoolName] = useState(() =>
    readStoredValue(storageKeys.schoolName),
  );
  const [teacherName, setTeacherName] = useState(() =>
    readStoredValue(storageKeys.teacherName),
  );
  const [extraMargin, setExtraMargin] = useState("none");
  const [schoolLogoUrl, setSchoolLogoUrl] = useState("");
  const [zoomMode, setZoomMode] = useState("fit-width");
  const [previewScale, setPreviewScale] = useState(1);
  const [previewContentHeight, setPreviewContentHeight] = useState(pageHeightPx);
  const previewViewportRef = useRef(null);
  const previewScaleRef = useRef(null);

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
  const requestedLesson = selectedBook?.lessons.find(
    (lesson) => lesson.lessonNumber === lessonNumber,
  );
  const lessonId =
    requestedLesson?.id ??
    `${selectedBook?.bookId ?? `sample-${lang}`}-${lessonNumber}`;
  const lessonIsAccessible =
    lessonNumber === 1 ||
    Object.values(userProfile?.unlockedLessons ?? {}).some((lessons) =>
      lessons.includes(lessonId),
    );
  const lessonFromServer = {
    ...(lang === "ur" ? lessonUr : lessonEn),
    lessonNo: lessonNumber,
    ...(selectedBook && {
      classLabel:
        lang === "ur"
          ? urduGradeLabels[selectedBook.grade]
          : selectedBook.grade,
    }),
  };
  useEffect(() => {
    const documentPreview =
      previewScaleRef.current?.querySelector(".lpc-doc");
    if (!documentPreview) return undefined;

    function updateContentHeight() {
      setPreviewContentHeight(documentPreview.scrollHeight);
    }

    updateContentHeight();
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(updateContentHeight);
    observer?.observe(documentPreview);
    return () => observer?.disconnect();
  }, []);

  useEffect(() => {
    if (zoomMode === "free") return undefined;

    function updatePreviewScale() {
      const availableWidth =
        previewViewportRef.current?.clientWidth ?? window.innerWidth;
      const fitWidthScale = Math.max(
        0.25,
        Math.min(availableWidth / pageWidthPx, 1.5),
      );

      if (zoomMode === "fit-page") {
        const previewTop =
          previewViewportRef.current?.getBoundingClientRect().top ?? 0;
        const availableHeight = Math.max(
          200,
          window.innerHeight - Math.max(0, previewTop) - 24,
        );
        setPreviewScale(
          Math.max(
            0.25,
            Math.min(fitWidthScale, availableHeight / pageHeightPx),
          ),
        );
      } else if (zoomMode === "fit-width") {
        setPreviewScale(fitWidthScale);
      } else {
        setPreviewScale(Number(zoomMode));
      }
    }

    updatePreviewScale();
    window.addEventListener("resize", updatePreviewScale);
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(updatePreviewScale);
    if (previewViewportRef.current) {
      observer?.observe(previewViewportRef.current);
    }

    return () => {
      window.removeEventListener("resize", updatePreviewScale);
      observer?.disconnect();
    };
  }, [zoomMode]);

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

  async function confirmPurchase() {
    if (!currentUser) {
      try {
        await signIn();
      } catch {
        return;
      }
      return;
    }
    if (!requestedLesson) {
      setPurchaseError("This lesson is not available in the current catalog.");
      return;
    }
    setPurchasing(true);
    setPurchaseError("");
    try {
      const result = await unlockLesson(requestedLesson);
      if (result.success) {
        setPurchaseConfirm(false);
      } else if (result.reason === "insufficient_tokens") {
        window.location.assign("/pricing");
      } else {
        setPurchaseError("Could not purchase this lesson. Please try again.");
      }
    } catch (error) {
      console.error("Could not purchase lesson:", error);
      setPurchaseError("Could not purchase this lesson. Please try again.");
    } finally {
      setPurchasing(false);
    }
  }

  if (lessonNumber !== 1 && (loading || !lessonIsAccessible)) {
    return (
      <main className="ustad-section">
        <a className="ustad-back-link" href={selectedBook ? `/classes/${selectedBook.grade.replace(/\D/g, "")}/${selectedBook.bookId}` : "/classes"}>← Back to lessons</a>
        <section className="ustad-purchase-card">
          <div className="ustad-purchase-icon"><LockIcon /></div>
          <p className="ustad-eyebrow">Lesson preview</p>
          <h1>{requestedLesson?.topic ?? requestedLesson?.title ?? `Lesson ${lessonNumber}`}</h1>
          <p>{loading ? "Checking your account…" : "Purchase this lesson preview once. After purchase, you can reopen and print it anytime."}</p>
          {currentUser && <p className="ustad-purchase-balance"><UiIcon name="coins" size={18} /> {Number(userProfile?.tokens?.[getCurrentMonthKey()] ?? 0).toLocaleString()} tokens available</p>}
          {(authError || profileError || purchaseError) && <p className="ustad-purchase-error" role="alert">{purchaseError || authError || profileError}</p>}
          {!purchaseConfirm ? (
            <button className="ustad-button" disabled={loading} onClick={() => currentUser ? setPurchaseConfirm(true) : void signIn().catch(() => {})} type="button">
              <EyeIcon /> Preview · {LESSON_COST} tokens
            </button>
          ) : (
            <div className="ustad-confirm-box">
              <b>Purchase and preview this lesson?</b>
              <p>{LESSON_COST} tokens will be deducted. This lesson will remain available to your account.</p>
              <button className="ustad-button" disabled={purchasing} onClick={() => void confirmPurchase()} type="button">{purchasing ? "Purchasing…" : `Confirm · ${LESSON_COST} tokens`}</button>
              <button className="ustad-cancel-button" disabled={purchasing} onClick={() => setPurchaseConfirm(false)} type="button">Cancel</button>
            </div>
          )}
          {currentUser && Number(userProfile?.tokens?.[getCurrentMonthKey()] ?? 0) < LESSON_COST && <a className="ustad-pricing-link" href="/pricing">Get tokens</a>}
        </section>
      </main>
    );
  }

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

      <div className="mx-auto mb-3 flex max-w-5xl justify-end print:hidden">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          Preview zoom
          <select
            className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            onChange={(event) => setZoomMode(event.target.value)}
            value={zoomMode}
          >
            <option value="fit-page">Fit page</option>
            <option value="fit-width">Fit width</option>
            <option value="free">Free (browser zoom)</option>
            <option value="0.75">75%</option>
            <option value="1">100%</option>
            <option value="1.25">125%</option>
          </select>
        </label>
      </div>

      <div
        className="lesson-plan-preview-viewport"
        ref={previewViewportRef}
      >
        <div
          className="lesson-plan-preview-canvas"
          style={{
            width: `max(100%, ${pageWidthPx * previewScale}px)`,
            minHeight: `${previewContentHeight * previewScale}px`,
          }}
        >
          <div
            className="lesson-plan-preview-frame"
            style={{
              width: `${pageWidthPx * previewScale}px`,
              height: `${previewContentHeight * previewScale}px`,
            }}
          >
            <div
              className="lesson-plan-preview-scale"
              ref={previewScaleRef}
              style={{
                transform: `scale(${previewScale})`,
                width: `${pageWidthPx}px`,
                height: `${previewContentHeight}px`,
              }}
            >
              <LessonPlanEditor
                lang={lang}
                lesson={lessonFromServer}
                branding={branding}
                storageKey={`plan-${lessonId}`}
                onChange={(updatedLesson) => {
                  window.dispatchEvent(
                    new CustomEvent("ustad:lesson-plan-change", {
                      detail: { lessonId, lesson: updatedLesson },
                    }),
                  );
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
