import { fetchLessons, type LessonContent } from "./api";

export async function getPurchasedLesson(
  input: { classId: string; subject: string; week: number },
  hasPurchase: (lessonId: string) => Promise<boolean>,
): Promise<LessonContent> {
  const data = await fetchLessons(input.classId, input.subject);
  const lesson = data?.lessons.find((item) => item.week === input.week);
  if (!data || !lesson) throw new Error("Lesson not found");
  if (!(await hasPurchase(lesson.id))) throw new Error("Purchase this lesson for 10 tokens before previewing.");
  return {
    id: lesson.id, className: data.cls.name, subject: data.subject, title: lesson.title, week: lesson.week, duration: lesson.duration,
    objectives: [`Students will understand the key ideas of this ${data.subject} topic.`, "Students will explain the concept in their own words.", "Students will apply learning to a short classroom task."],
    materials: ["Textbook (PCTB)", "Whiteboard & markers", "Chart paper", "Worksheet"],
    activities: [
      { time: "5 min", step: "Greeting and warm-up question linked to previous lesson." },
      { time: "10 min", step: "Teacher explains the concept with examples on the board." },
      { time: "10 min", step: "Guided practice: students solve examples in pairs." },
      { time: "8 min", step: "Group activity: groups share answers with the class." },
      { time: "2 min", step: "Summary and recap of today's lesson." },
    ],
    assessment: ["Ask 3 oral questions at random.", "Check the worksheet for 5 students.", "Exit ticket: one line about what they learned."],
    homework: "Complete the exercise at the end of the chapter in the notebook.",
  };
}