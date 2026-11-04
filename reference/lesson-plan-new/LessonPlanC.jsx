import { useLayoutEffect, useRef, useState } from 'react';
import { STRINGS } from './strings.js';
import { phaseMinutes } from './timing.js';
import { APP_URL } from './brand.js';
import sedLogo from './assets/sed-logo.png';
import './lesson-plan-c.css';

const DEFAULT_BRANDING = {
  logo: 'sed',         // 'sed' (bundled, default) | 'school' | 'none'
  schoolLogoUrl: '',   // teacher's uploaded logo (object URL / data URL)
  schoolName: '',
  teacherName: '',
  extraMargin: 'none', // advanced: 'left' | 'right' adds 5 mm for binding
};

const Item = ({ i }) => (typeof i === 'string' ? i : <><b>{i.lead}</b> {i.text}</>);
const SECTION_KEYS = ['introduction', 'development', 'conclusion', 'assessment', 'followUp'];

/** Small pencil button; screen only (hidden when printing). */
function Pencil({ onClick, label, abs }) {
  return (
    <button type="button" className={'lpc-edit' + (abs ? ' lpc-edit--abs' : '')} onClick={onClick} aria-label={label} title={label}>
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></svg>
    </button>
  );
}
const longest = (arr) => arr.reduce((a, c) => (c.length > a.length ? c : a), '');

function Logo({ b, S, size }) {
  if (b.logo === 'none') return null;
  const box = { width: size, height: size };
  if (b.logo === 'school') {
    return b.schoolLogoUrl
      ? <img className="lpc-logo" style={box} src={b.schoolLogoUrl} alt="" />
      : <div className="lpc-logo-ph" style={box}>{S.schoolLogo}</div>;
  }
  return <img className="lpc-logo" style={box} src={sedLogo} alt="School Education Department, Government of the Punjab" />;
}

/** Urdu banner: domain and sub-domain stay on separate lines when each fits on
 *  its own line, otherwise they flow together (max 2 lines, then "…"). */
function useSeparateLines(deps) {
  const boxRef = useRef(null), aRef = useRef(null), bRef = useRef(null);
  const [sep, setSep] = useState(true);
  useLayoutEffect(() => {
    const measure = () => {
      const box = boxRef.current, a = aRef.current, b = bRef.current;
      if (!box || !a || !b || !box.clientWidth) return;
      const w = box.clientWidth + 1;
      setSep(a.offsetWidth <= w && b.offsetWidth <= w);
    };
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (ro && boxRef.current) ro.observe(boxRef.current);
    document.fonts?.ready.then(measure);
    return () => ro?.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { boxRef, aRef, bRef, sep };
}

function Footer({ b, S, page, pages }) {
  return (
    <div className="lpc-footer">
      <span className="lpc-footer-brand" dir="ltr">{APP_URL}</span>
      <div className="lpc-footer-right">
        {b.teacherName && <><span className="lpc-nowrap">{S.preparedBy} <b>{b.teacherName}</b></span><b>|</b></>}
        {b.schoolName && <><span className="lpc-footer-school">{b.schoolName}</span><b>|</b></>}
        <b className="lpc-nowrap">{page} / {pages}</b>
      </div>
    </div>
  );
}

/** Banner (the part above the divider line). Repeated on every page. */
function Banner({ l, b, S, ur, onEdit }) {
  const { boxRef, aRef, bRef, sep } = useSeparateLines([l.domain, l.subDomain, b.logo, ur]);
  const badge = <div className="lpc-badge">{S.lesson} {l.lessonNo}</div>;
  const pencil = onEdit ? <Pencil abs onClick={() => onEdit('banner')} label={S.dialog.banner} /> : null;
  if (ur) {
    return (
      <div className="lpc-banner">
        <div className="lpc-info">
          <Logo b={b} S={S} size={64} />
          <div className="lpc-info-text" ref={boxRef}>
            <span className="lpc-probe" ref={aRef}>{l.domain}</span>
            <span className="lpc-probe" ref={bRef}>{l.subDomain}</span>
            <b>{l.classLabel} · {l.subject}</b>
            {sep
              ? <><span className="lpc-line">{l.domain}</span><span className="lpc-line">{l.subDomain}</span></>
              : <span className="lpc-merged">{l.domain} · {l.subDomain}</span>}
          </div>
        </div>
        <div className="lpc-title-wrap"><div className="lpc-title">{l.topic}</div></div>
        {badge}
        {pencil}
      </div>
    );
  }
  return (
    <div className="lpc-banner">
      <div className="lpc-banner-left">
        <Logo b={b} S={S} size={64} />
        <div>
          <div className="lpc-meta"><b>{l.classLabel} · {l.subject}</b>{l.domain} · {l.subDomain}</div>
          <div className="lpc-topic">{l.topic}</div>
        </div>
      </div>
      {badge}
      {pencil}
    </div>
  );
}

/**
 * Lesson plan, template C ("Planner Checklist"), English or Urdu, as many A4 pages as needed.
 *  - Boxes on the right never split: a box that does not fit moves, whole, to the next page.
 *  - Every page repeats the banner and the footer; only the Observations box is repeated on the left.
 *  - Boxes on each page share the free space evenly. Re-paginates live when the lesson changes.
 * <LessonPlanC lang="ur" lesson={lessonUr} branding={{ teacherName, schoolName }} />
 */
export default function LessonPlanC({ lesson: l, lang = 'en', branding = {}, capsules = true, editable = false, onEdit, onLayout, edgeHeadings, urFontSize = 17, urLineHeight = 1.55 }) {
  const S = STRINGS[lang] ?? STRINGS.en;
  const ur = lang === 'ur';
  const edge = edgeHeadings ?? true; // headings on the border (on by default, both languages)
  const b = { ...DEFAULT_BRANDING, ...branding };
  const mins = phaseMinutes(l);

  const boxes = [
    [S.introduction, l.introduction, true],
    [S.development, l.development, true],
    [S.conclusion, l.conclusion, true],
    [S.assessment, l.assessment, true],
    [S.followUp, l.followUp, false],
  ];

  const mainLabels = boxes.map((x) => x[0]);
  const sideLabels = [S.glance, S.teacherNotes, S.observations];
  // widest capsule label of each group, measured below (starts with a guess by length)
  const [refs, setRefs] = useState({ main: longest(mainLabels), side: longest(sideLabels) });

  const style = {
    '--lp-pl': b.extraMargin === 'left' ? '20mm' : '15mm',
    '--lp-pr': b.extraMargin === 'right' ? '20mm' : '15mm',
    '--lpc-ur-fs': `${urFontSize}px`,
    '--lpc-ur-lh': urLineHeight,
    // Urdu minute pills: all as wide as the longest one
    '--lpc-pill-ref': JSON.stringify(`${longest(mins.slice(0, 4).map(String))} ${S.min}`),
    // Urdu capsules: every capsule in a group is as wide as the longest label of the group
    '--lpc-ref-main': JSON.stringify(refs.main),
    '--lpc-ref-side': JSON.stringify(refs.side),
  };
  const cls = `lpc${ur ? ' lpc--ur' : ''}${capsules ? '' : ' lpc--plain'}${edge ? ' lpc--edge' : ''}`;

  const renderBox = ([title, items, timed], n, edit = false) => (
    <div className="lpc-box" key={n}>
      <h3>
        <span className="lpc-cap">{title}</span>
        {(timed || edit) && (
          <span className="lpc-h3-end">
            {timed && <span className="lpc-pill">{mins[n]} {S.min}</span>}
            {edit && <Pencil onClick={() => onEdit?.(SECTION_KEYS[n])} label={`${S.dialog.editBox}: ${title}`} />}
          </span>
        )}
      </h3>
      {items.map((it, k) => <div className="lpc-check" key={k}><i /><span><Item i={it} /></span></div>)}
    </div>
  );

  // ---- live pagination: measure every box at its natural height, then pack them page by page
  const [pages, setPages] = useState([boxes.map((_, n) => n)]);
  const mRoot = useRef(null), mBanner = useRef(null), mGrid = useRef(null), mRight = useRef(null), mFooter = useRef(null);
  useLayoutEffect(() => {
    const run = () => {
      const root = mRoot.current, banner = mBanner.current, grid = mGrid.current, right = mRight.current, footer = mFooter.current;
      if (!root || !banner || !grid || !right || !footer) return;
      const rcs = getComputedStyle(root), gcs = getComputedStyle(grid);
      const avail = root.clientHeight - parseFloat(rcs.paddingTop) - parseFloat(rcs.paddingBottom)
        - banner.offsetHeight - footer.offsetHeight - parseFloat(gcs.paddingTop) - parseFloat(gcs.paddingBottom) - 2;
      const heights = [...right.children].map((el) => el.getBoundingClientRect().height + parseFloat(getComputedStyle(el).marginBottom));
      const next = [[]]; let used = 0;
      heights.forEach((h, n) => {
        const page = next[next.length - 1];
        if (page.length && used + h > avail) { next.push([]); used = 0; }
        next[next.length - 1].push(n); used += h;
      });
      setPages((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
      let bm = '', bw = 0, sm = '', sw = 0;
      root.querySelectorAll('.lpc-capprobe').forEach((el) => {
        const w = el.offsetWidth;
        if (el.dataset.g === 'main') { if (w > bw) { bw = w; bm = el.textContent; } } else if (w > sw) { sw = w; sm = el.textContent; }
      });
      if (bm && sm) setRefs((prev) => (prev.main === bm && prev.side === sm ? prev : { main: bm, side: sm }));
      onLayout?.({ pages: next.length, oversize: heights.some((h) => h > avail) });
    };
    run();
    document.fonts?.ready.then(run);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [l, lang, capsules, edge, urFontSize, urLineHeight, b.logo, b.schoolLogoUrl, b.schoolName, b.teacherName]);

  return (
    <div className="lpc-doc">
      {/* hidden copy used only for measuring */}
      <div className="lpc-measure" aria-hidden="true">
        <div className={cls} dir={S.dir} lang={lang} style={style} ref={mRoot}>
          <div ref={mBanner}><Banner l={l} b={b} S={S} ur={ur} /></div>
          <div className="lpc-grid" ref={mGrid}>
            <div className="lpc-col lpc-left" />
            <div className="lpc-col lpc-right" ref={mRight}>{boxes.map((x, n) => renderBox(x, n))}</div>
          </div>
          <div ref={mFooter}><Footer b={b} S={S} page={1} pages={1} /></div>
          {mainLabels.map((t) => <span className="lpc-capprobe" data-g="main" key={'m' + t}>{t}</span>)}
          {sideLabels.map((t) => <span className="lpc-capprobe" data-g="side" key={'s' + t}>{t}</span>)}
        </div>
      </div>

      {pages.map((idx, p) => (
        <div className={cls} dir={S.dir} lang={lang} style={style} key={p}>
          <Banner l={l} b={b} S={S} ur={ur} onEdit={editable ? onEdit : undefined} />
          <div className="lpc-grid">
            <div className="lpc-col lpc-left">
              {p === 0 && (
                <>
                  <div className="lpc-box lpc-glance">
                    <p className="lpc-k">{S.glance}</p>
                    <b>{S.time}</b> {S.periods(l.minutes, l.minutes > 60 ? 2 : 1)}<br /><b>{S.date}</b> ____________
                    <p className="lpc-k lpc-gap">{S.studentsWill}</p>
                    {l.slos.map((x, k) => <div key={k}>{x}{ur ? '۔' : '.'}</div>)}
                    <p className="lpc-k lpc-gap">{S.bring}</p>
                    {l.materials}{ur ? '۔' : '.'}
                    {editable && <Pencil abs onClick={() => onEdit?.('glance')} label={`${S.dialog.editBox}: ${S.glance}`} />}
                  </div>
                  <div className="lpc-box">
                    <p className="lpc-k">{S.teacherNotes}</p>
                    {l.teacherInfo.map((it, k) => <div key={k}><Item i={it} /></div>)}
                    {editable && <Pencil abs onClick={() => onEdit?.('teacherInfo')} label={`${S.dialog.editBox}: ${S.teacherNotes}`} />}
                  </div>
                </>
              )}
              <div className="lpc-box lpc-obs"><p className="lpc-k">{S.observations}</p></div>
            </div>
            <div className="lpc-col lpc-right">{idx.map((n) => renderBox(boxes[n], n, editable))}</div>
          </div>
          <Footer b={b} S={S} page={p + 1} pages={pages.length} />
        </div>
      ))}
    </div>
  );
}
