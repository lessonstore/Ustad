# Lesson plan · Template C (English + Urdu)

One component renders both languages: `<LessonPlanC lang="en" | "ur" />`.

## Add to your project (React + Vite, Tailwind is fine)

1. Copy this folder to `src/features/lesson-plan/`
2. `npm i @fontsource/ibm-plex-sans @fontsource/noto-nastaliq-urdu`
3. Use it:

```jsx
import { LessonPlanC, lessonEn, lessonUr } from '@/features/lesson-plan'; // or a relative path

<LessonPlanC
  lang="ur"                    // 'en' | 'ur'  (Urdu = right-to-left + Nastaliq)
  lesson={lessonUr}            // same shape as sampleLessons.js, text in that language
  branding={{
    logo: 'sed',               // 'sed' (default) | 'school' | 'none'
    schoolLogoUrl,             // teacher's uploaded logo, used when logo === 'school'
    schoolName, teacherName,
    extraMargin: 'none',       // advanced: 'left' | 'right' = +5 mm for binding
  }}
/>
```

## Footer

Bottom-left shows your website, hardcoded in `brand.js` (`APP_URL`); it is not a prop.
Bottom-right shows `branding.teacherName`, `branding.schoolName` (each left out when empty) and the page number.

## Printing

Render the plan on its own screen or modal and call `window.print()`. Hide the rest of
your app with Tailwind's `print:hidden` on the header, sidebar and buttons. The page is
exactly A4 with 12 mm top/bottom and 15 mm side margins (`@page { size: A4; margin: 0 }`
is included).

## Pages

The component paginates itself, live, as the lesson text changes:
- Boxes on the right (Introduction ... Follow-up) never break: a box that does not fit moves, whole, to the next page.
- Every page repeats the banner (above the divider line) and the footer with `1 / 2`, `2 / 2`...
- Only the Observations box repeats on the left; At a glance and Teacher notes appear on page 1 only.
- On each page the boxes share the free space evenly.
Do not pass `page` / `pages` props any more; they are computed.

## Editing (popup)

Use `<LessonPlanEditor />` instead of `<LessonPlanC />` to let teachers edit:

```jsx
<LessonPlanEditor lang="en" lesson={lessonFromServer} branding={...} storageKey={`plan-${lessonId}`} onChange={saveToServer} />
```

- A pencil on every box (screen only, never printed) opens a popup with the box's full content.
- Lines can be edited, added (+ Add line, or Enter), moved up/down, deleted; a line may have an optional bold label.
- Timed boxes also have a Minutes field. Teacher notes, At a glance and the heading have their own popups.
- OK saves and the pages re-arrange; an Undo message shows for 7 seconds. "Reset to original" refills the popup from the server lesson.
- The edited copy is stored under `storageKey` (localStorage) and passed to `onChange`; the original server lesson is never modified.
- A warning shows when a single box is taller than one page.

## Layout options

```jsx
<LessonPlanC / LessonPlanEditor
  edgeHeadings={true}    // capsule + minutes pill sit on the box border (default true, both languages)
  urFontSize={17}        // Urdu text size in px (default 17)
  urLineHeight={1.55}    // Urdu line spacing (default 1.55)
  capsules={true}        // false = plain headings
/>
```
Urdu minute pills are all as wide as the longest one; capsules in each group (main boxes / side boxes) are as wide as the widest label of the group (measured, not guessed).

## Timing

Introduction / Development / Conclusion / Assessment show minutes. Defaults: 30 min =
5-15-3-7, 40 min = 5-20-5-10, other lengths scale and always add up. A teacher's own
minutes go in `lesson.timing = [a, b, c, d]`.

## Notes

- Colours are pure black and white plus light grey, so it prints well on mono printers.
  Backgrounds are forced to print (`print-color-adjust: exact`).
- Not included yet: "fit to one page" shrinking.
- A single box taller than a whole page is not split (it gets its own page and is cut off at the bottom).
- Jameel Noori Nastaleeq: used when installed on the device. To guarantee it, add an
  `@font-face` with the font file (check its licence) and keep Noto as fallback.
- Check that you may use the SED logo in your app before release.
