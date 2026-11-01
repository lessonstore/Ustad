// Default minutes for [introduction, development, conclusion, assessment].
const PRESETS = { 30: [5, 15, 3, 7], 40: [5, 20, 5, 10] };

/** Default split for a period length; other lengths scale the 40-minute split
 *  and are rounded so the parts always add up to the total. */
export function defaultTiming(minutes) {
  if (PRESETS[minutes]) return [...PRESETS[minutes]];
  const raw = PRESETS[40].map((x) => (x * minutes) / 40);
  const out = raw.map(Math.floor);
  let rest = minutes - out.reduce((a, b) => a + b, 0);
  raw.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0])
    .slice(0, rest).forEach(([, i]) => { out[i] += 1; });
  return out;
}

/** lesson.timing (optional, set by the teacher) overrides the defaults per phase. */
export function phaseMinutes(lesson) {
  const base = defaultTiming(lesson.minutes);
  return base.map((m, i) => (lesson.timing?.[i] ?? m));
}
