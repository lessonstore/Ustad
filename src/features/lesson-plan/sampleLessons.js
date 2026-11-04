// The lesson data shape. Items are a string or { lead, text } (lead is bold).
// Store the lesson text in the language you render it in.
export const lessonEn = {
  lessonNo: 1, classLabel: 'Class VI', subject: 'Maths',
  domain: 'Numbers and Operations', subDomain: 'Factors and Multiples', topic: 'Factors and Multiples',
  minutes: 40, // periods are derived (over 60 min = 2 periods)
  // timing: [5, 20, 5, 10], // optional teacher override: intro, development, conclusion, assessment
  materials: 'Matchsticks, whiteboard, textbook',
  slos: ['Recognize factors up to 3-digit numbers and multiples up to 2-digit numbers'],
  teacherInfo: [
    { lead: 'Factor:', text: 'divides with remainder zero.' },
    { lead: 'Multiple:', text: 'product of a number and another.' },
    'Every number above 1 has factors 1 and itself.',
  ],
  introduction: ['List all whole numbers that divide 12 exactly.', 'Skip-count by 5s to link with multiples.'],
  development: [
    { lead: 'Matchstick multiples.', text: 'Groups of 3 build 3, 6, 9…' },
    { lead: 'Division method.', text: 'Is 3 a factor of 42?' },
    { lead: 'Generate multiples.', text: 'First five of 13.' },
  ],
  conclusion: ['Factors are divisors; multiples are products.', 'A number is its own factor and multiple.'],
  assessment: ['Is 5 a factor of 42? Why or why not?', 'List the first six multiples of 7.', 'Multiples of 13: 39, 45, 65, 99?'],
  followUp: [
    { lead: 'Homework:', text: 'factors of 36, 45; multiples of 19, 43.' },
    { lead: 'Project:', text: 'newspaper numbers, factors and multiples.' },
  ],
};

export const lessonUr = {
  lessonNo: 1, classLabel: 'جماعت ششم', subject: 'ریاضی',
  domain: 'اعداد اور اعمال', subDomain: 'اجزائے ضربی اور مضاعفات یا اضعاف', topic: 'اجزائے ضربی اور اضعاف',
  minutes: 30,
  materials: 'ماچس کی تیلیاں، وائٹ بورڈ، نصابی کتاب',
  slos: ['3 ہندسوں تک کے اعداد کے اجزائے ضربی اور 2 ہندسوں تک کے اعداد کے مضاعفات کی پہچان'],
  teacherInfo: [
    { lead: 'جزوِ ضربی:', text: 'وہ عدد جو کسی عدد کو مکمل تقسیم کرے (باقی صفر)۔' },
    { lead: 'اضعاف:', text: 'دو اعداد کا حاصلِ ضرب۔' },
    '1 سے بڑے ہر عدد کے کم از کم دو جزوِ ضربی ہوتے ہیں: 1 اور وہ خود۔',
  ],
  introduction: ['ان تمام مکمل اعداد کی فہرست بنائیں جو 12 کو مکمل تقسیم کرتے ہیں۔', 'مضاعفات سے ربط کے لیے 5 کے وقفے سے گنتی کریں: 5، 10، 15، 20...'],
  development: [
    { lead: 'ماچس کی تیلیوں سے مضاعفات:', text: '3 تیلیوں کے گروہ بنا کر 3، 6، 9 ... بنائیں۔' },
    { lead: 'تقسیم کا طریقہ:', text: 'کیا 3، عدد 42 کا جزوِ ضربی ہے؟' },
  ],
  conclusion: ['جزوِ ضربی مقسوم علیہ ہوتے ہیں اور مضاعفات پہاڑے کے حاصلِ ضرب۔', 'ہر عدد اپنا جزوِ ضربی بھی ہے اور اپنا مضاعف بھی۔'],
  assessment: ['کیا 5، عدد 42 کا جزوِ ضربی ہے؟ کیوں یا کیوں نہیں؟', '7 کے پہلے چھ مضاعفات لکھیں۔', '13 کے مضاعفات کون سے ہیں: 39، 45، 65، 99؟'],
  followUp: [
    { lead: 'گھر کا کام:', text: '36 اور 45 کے اجزائے ضربی؛ 19 اور 43 کے مضاعفات لکھیں۔' },
    { lead: 'منصوبہ:', text: 'اخبار سے 2 یا 3 ہندسوں کے اعداد تلاش کر کے ان کے اجزائے ضربی لکھیں۔' },
  ],
};
