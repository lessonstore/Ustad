import { useLayoutEffect, useRef, useState } from 'react';
import { STRINGS } from './strings.js';
import { phaseMinutes } from './timing.js';
import sedLogo from './assets/sed-logo.png';
import './lesson-plan-c.css';

const DEFAULT_BRANDING = {
  logo: 'sed',         // 'sed' (bundled, default) | 'school' | 'none'
  schoolLogoUrl: '',   // teacher's uploaded logo (object URL / data URL)
  schoolName: '',
  teacherName: '',
  appName: 'Your App Name',
  extraMargin: 'none', // advanced: 'left' | 'right' adds 5 mm for binding
};

const Item = ({ i }) => (typeof i === 'string' ? i : <><b>{i.lead}</b> {i.text}</>);
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
      <span className="lpc-footer-brand">{S.madeWith(b.appName)}</span>
      <div className="lpc-footer-right">
        {b.teacherName && <><span className="lpc-nowrap">{S.preparedBy} <b>{b.teacherName}</b></span><b>|</b></>}
        {b.schoolName && <><span className="lpc-footer-school">{b.schoolName}</span><b>|</b></>}
        <b className="lpc-nowrap">{page} / {pages}</b>
      </div>
    </div>
  );
}

/**
 * Lesson plan, template C ("Planner Checklist"), English or Urdu, one A4 page.
 * <LessonPlanC lang="ur" lesson={lessonUr} branding={{ teacherName, schoolName }} />
 */
export default function LessonPlanC({ lesson: l, lang = 'en', branding = {}, page = 1, pages = 1, capsules = true }) {
  const S = STRINGS[lang] ?? STRINGS.en;
  const ur = lang === 'ur';
  const b = { ...DEFAULT_BRANDING, ...branding };
  const mins = phaseMinutes(l);
  const periods = l.minutes > 60 ? 2 : 1;
  const { boxRef, aRef, bRef, sep } = useSeparateLines([l.domain, l.subDomain, lang, b.logo]);

  const boxes = [
    [S.introduction, l.introduction, true],
    [S.development, l.development, true],
    [S.conclusion, l.conclusion, true],
    [S.assessment, l.assessment, true],
    [S.followUp, l.followUp, false],
  ];

  const style = {
    '--lp-pl': b.extraMargin === 'left' ? '20mm' : '15mm',
    '--lp-pr': b.extraMargin === 'right' ? '20mm' : '15mm',
    // Urdu capsules: every capsule in a group is as wide as the longest label of the group
    '--lpc-ref-main': JSON.stringify(longest(boxes.map((x) => x[0]))),
    '--lpc-ref-side': JSON.stringify(longest([S.glance, S.teacherNotes, S.observations])),
  };

  return (
    <div className={`lpc${ur ? ' lpc--ur' : ''}${capsules ? '' : ' lpc--plain'}`} dir={S.dir} lang={lang} style={style}>
      {ur ? (
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
          <div className="lpc-badge">{S.lesson} {l.lessonNo}</div>
        </div>
      ) : (
        <div className="lpc-banner">
          <div className="lpc-banner-left">
            <Logo b={b} S={S} size={64} />
            <div>
              <div className="lpc-meta"><b>{l.classLabel} · {l.subject}</b>{l.domain} · {l.subDomain}</div>
              <div className="lpc-topic">{l.topic}</div>
            </div>
          </div>
          <div className="lpc-badge">{S.lesson} {l.lessonNo}</div>
        </div>
      )}

      <div className="lpc-grid">
        <div className="lpc-col lpc-left">
          <div className="lpc-box lpc-glance">
            <p className="lpc-k">{S.glance}</p>
            <b>{S.time}</b> {S.periods(l.minutes, periods)}<br /><b>{S.date}</b> ____________
            <p className="lpc-k lpc-gap">{S.studentsWill}</p>
            {l.slos.map((s, k) => <div key={k}>{s}{ur ? '۔' : '.'}</div>)}
            <p className="lpc-k lpc-gap">{S.bring}</p>
            {l.materials}{ur ? '۔' : '.'}
          </div>
          <div className="lpc-box">
            <p className="lpc-k">{S.teacherNotes}</p>
            {l.teacherInfo.map((it, k) => <div key={k}><Item i={it} /></div>)}
          </div>
          <div className="lpc-box lpc-obs"><p className="lpc-k">{S.observations}</p></div>
        </div>

        <div className="lpc-col lpc-right">
          {boxes.map(([title, items, timed], n) => (
            <div className="lpc-box" key={n}>
              <h3><span className="lpc-cap">{title}</span>{timed && <span className="lpc-pill">{mins[n]} {S.min}</span>}</h3>
              {items.map((it, k) => <div className="lpc-check" key={k}><i /><span><Item i={it} /></span></div>)}
            </div>
          ))}
        </div>
      </div>

      <Footer b={b} S={S} page={page} pages={pages} />
    </div>
  );
}
