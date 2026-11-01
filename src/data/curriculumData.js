const academicSchedule = {
  April: { startLesson: 1, endLesson: 12 },
  May: { startLesson: 13, endLesson: 24 },
  August: { startLesson: 25, endLesson: 38 },
  September: { startLesson: 39, endLesson: 50 },
  October: { startLesson: 51, endLesson: 62 },
  November: { startLesson: 63, endLesson: 74 },
  December: { startLesson: 75, endLesson: 86 },
  January: { startLesson: 87, endLesson: 98 },
  February: { startLesson: 99, endLesson: 110 },
  March: { startLesson: 111, endLesson: 122 },
};

const months = [
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

const subjects = [
  {
    name: "Mathematics",
    id: "math",
    language: "en",
    medium: "English Medium",
    subject: "Mathematics - English Medium",
  },
  {
    name: "Mathematics",
    id: "math",
    language: "ur",
    medium: "Urdu Medium",
    subject: "Mathematics - Urdu Medium",
  },
  {
    name: "General Science",
    id: "science",
    language: "en",
    medium: "English Medium",
    subject: "General Science - English Medium",
  },
  {
    name: "General Science",
    id: "science",
    language: "ur",
    medium: "Urdu Medium",
    subject: "General Science - Urdu Medium",
  },
  {
    name: "English",
    id: "english",
    language: "en",
    medium: "English Medium",
    subject: "English",
  },
  {
    name: "Urdu",
    id: "urdu",
    language: "ur",
    medium: "Urdu Medium",
    subject: "Urdu",
  },
];

function createLessons(bookId) {
  return Array.from({ length: 122 }, (_, index) => {
    const lessonNumber = index + 1;

    return {
      id: `${bookId}-l${lessonNumber}`,
      lessonNumber,
      chapterName: `Chapter ${Math.ceil(lessonNumber / 10)}`,
      title: `Lesson ${lessonNumber}`,
      isFreeSample: lessonNumber === 1,
      tokenCost: lessonNumber === 1 ? 0 : 1,
    };
  });
}

export const curriculumData = ["Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8"].map(
  (grade) => {
    const gradeId = grade.toLowerCase().replace(" ", "");

    return {
      grade,
      books: subjects.map(({ id, language, medium, subject }) => {
        const mediumId = medium.toLowerCase().replace(" ", "-");
        const bookId = `${gradeId}-${id}-${mediumId}`;

        return {
          bookId,
          subject,
          subjectName: subject,
          language,
          medium,
          academicSchedule: { ...academicSchedule },
          lessons: createLessons(bookId),
        };
      }),
    };
  },
);

export function isLessonAvailable(lessonNumber, currentMonth, schedule) {
  const monthIndex = months.indexOf(currentMonth);
  const scheduledEntries = Object.entries(schedule);

  const availableThrough = scheduledEntries.reduce((latestEnd, [month, range]) => {
    if (months.indexOf(month) <= monthIndex) {
      return Math.max(latestEnd, range.endLesson);
    }

    return latestEnd;
  }, 0);

  const canUnlock = lessonNumber <= availableThrough;
  const scheduledMonth = canUnlock
    ? null
    : scheduledEntries.find(([, range]) => lessonNumber <= range.endLesson)?.[0] ?? null;

  return { canUnlock, scheduledMonth };
}
