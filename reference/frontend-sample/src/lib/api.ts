import { queryOptions } from "@tanstack/react-query";

// Mock server layer. Replace the bodies of these fetchers with real API calls
// (e.g. fetch(`${API_URL}/classes`)) when the backend is ready.

export type ClassLevel = { id: string; name: string; urdu: string; stage: string; subjects: string[] };
export type LessonPlan = {
  id: string; title: string; week: number; duration: string; format: "PDF" | "DOCX"; size: string; downloads: number;
};

const SUBJECTS_PRIMARY = ["English", "Urdu", "Mathematics", "Islamiat", "General Knowledge"];
const SUBJECTS_MIDDLE = ["English", "Urdu", "Mathematics", "General Science", "Islamiat", "Social Studies", "Computer"];
const SUBJECTS_HIGH = ["English", "Urdu", "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "Islamiat", "Pakistan Studies"];

const urdu = ["اول", "دوم", "سوم", "چہارم", "پنجم", "ششم", "ہفتم", "ہشتم", "نہم", "دہم"];

export const CLASSES: ClassLevel[] = Array.from({ length: 10 }, (_, i) => {
  const n = i + 1;
  return {
    id: String(n),
    name: `Class ${n}`,
    urdu: `جماعت ${urdu[i]}`,
    stage: n <= 5 ? "Primary" : n <= 8 ? "Elementary" : "Secondary",
    subjects: n <= 3 ? SUBJECTS_PRIMARY : n <= 8 ? SUBJECTS_MIDDLE : SUBJECTS_HIGH,
  };
});

export const slug = (s: string) => s.toLowerCase().replace(/\s+/g, "-");

const TOPICS = ["Introduction & Warm-up", "Core Concepts", "Guided Practice", "Activity-Based Learning", "Reading & Comprehension", "Problem Solving", "Group Work", "Revision", "Assessment", "Real-life Application", "Project Work", "Review & Feedback"];

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchClasses() { await delay(300); return CLASSES; }

export async function fetchLessons(classId: string, subjectSlug: string) {
  await delay(500);
  const cls = CLASSES.find((c) => c.id === classId);
  const subject = cls?.subjects.find((s) => slug(s) === subjectSlug);
  if (!cls || !subject) return null;
  const seed = Number(classId) * 7 + subject.length;
  const lessons: LessonPlan[] = TOPICS.map((t, i) => ({
    id: `${classId}-${subjectSlug}-${i + 1}`,
    title: `${subject}: ${t}`,
    week: i + 1,
    duration: `${35 + ((seed + i) % 3) * 5} min`,
    format: (seed + i) % 4 === 0 ? "DOCX" : "PDF",
    size: `${(0.4 + ((seed * (i + 3)) % 17) / 10).toFixed(1)} MB`,
    downloads: 120 + ((seed * 97 * (i + 1)) % 4800),
  }));
  return { cls, subject, lessons };
}

export const classesQuery = () => queryOptions({ queryKey: ["classes"], queryFn: fetchClasses });
export const lessonsQuery = (c: string, s: string) =>
  queryOptions({ queryKey: ["lessons", c, s], queryFn: () => fetchLessons(c, s) });

export type LessonContent = {
  id: string; className: string; subject: string; title: string; week: number; duration: string;
  objectives: string[]; materials: string[];
  activities: { time: string; step: string }[];
  assessment: string[]; homework: string;
};

