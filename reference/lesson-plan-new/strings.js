// All fixed labels of the template, per language.
export const STRINGS = {
  en: {
    dir: 'ltr',
    lesson: 'LESSON',
    glance: 'At a glance', time: 'Time', date: 'Date',
    studentsWill: 'Students will', bring: 'Bring',
    teacherNotes: 'Teacher notes', observations: 'OBSERVATIONS',
    introduction: 'Introduction', development: 'Development', conclusion: 'Conclusion',
    assessment: 'Assessment', followUp: 'Follow-up',
    min: 'min', preparedBy: 'Prepared by',
    schoolLogo: 'School logo',
    periods: (m, p) => `${m} min · ${p} period${p > 1 ? 's' : ''}`,
  },
  ur: {
    dir: 'rtl',
    lesson: 'تدریسی منصوبہ',
    glance: 'ایک نظر میں', time: 'وقت', date: 'تاریخ',
    studentsWill: 'طلبہ کے اکتسابی نتائج', bring: 'درکار سامان',
    teacherNotes: 'استاد کے لیے معلومات', observations: 'مشاہدات',
    introduction: 'تعارف', development: 'پیش رفت', conclusion: 'خلاصہ',
    assessment: 'جائزہ', followUp: 'تکمیلی کام',
    min: 'منٹ', preparedBy: 'تیار کردہ:',
    schoolLogo: 'سکول کا لوگو',
    periods: (m, p) => `${m} منٹ · ${p} پیریڈ`,
  },
};
