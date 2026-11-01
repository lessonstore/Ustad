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
const SECTION_KEYS = ['introduction', 'development', 'conclusion', 'assessment', 'followUp'];
const longest = (arr) => arr.reduce((a, c) => (c.length > a.length ? c : a), '');

function Pencil({ onClick, label, abs }) {
  return (
    <button type="button" className={'lpc-edit' + (abs ? ' lpc-edit--abs' : '')} onClick={onClick} aria-label={label} title={label}>
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></svg>
    </button>
  );
}

function Editable({ children, className }) {
  return (
    <span
      className={`lpc-editable${className ? ` ${className}` : ''}`}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
    >
      {children}
    </span>
  );
}

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

function Banner({ l, b, S, ur, onEdit }) {
  const { boxRef, aRef, bRef, sep } = useSeparateLines([
    l.domain,
    l.subDomain,
    b.logo,
    ur,
  ]);
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
export default function LessonPlanC({ lesson: l, lang = 'en', branding = {}, capsules = true, editable = false, onEdit, onLayout }) {
  const S = STRINGS[lang] ?? STRINGS.en;
  const ur = lang === 'ur';
  const b = { ...DEFAULT_BRANDING, ...branding };
  const mins = phaseMinutes(l);

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

  const cls = `lpc${ur ? ' lpc--ur' : ''}${capsules ? '' : ' lpc--plain'}`;
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
      {items.map((it, k) => <div className="lpc-check" key={k}><i /><span><Editable><Item i={it} /></Editable></span></div>)}
    </div>
  );

  const [pages, setPages] = useState(() => [boxes.map((_, index) => index)]);
  const measureRootRef = useRef(null);
  const measureBannerRef = useRef(null);
  const measureGridRef = useRef(null);
  const measureRightRef = useRef(null);
  const measureFooterRef = useRef(null);

  useLayoutEffect(() => {
    let cancelled = false;

    function paginate() {
      const root = measureRootRef.current;
      const banner = measureBannerRef.current;
      const grid = measureGridRef.current;
      const right = measureRightRef.current;
      const footer = measureFooterRef.current;
      if (!root || !banner || !grid || !right || !footer) return;

      const rootStyle = getComputedStyle(root);
      const gridStyle = getComputedStyle(grid);
      const availableHeight =
        root.clientHeight -
        parseFloat(rootStyle.paddingTop) -
        parseFloat(rootStyle.paddingBottom) -
        banner.offsetHeight -
        footer.offsetHeight -
        parseFloat(gridStyle.paddingTop) -
        parseFloat(gridStyle.paddingBottom) -
        2;
      const boxHeights = [...right.children].map(
        (box) =>
          box.offsetHeight +
          parseFloat(getComputedStyle(box).marginBottom),
      );
      const nextPages = [[]];
      let usedHeight = 0;

      boxHeights.forEach((height, index) => {
        const currentPage = nextPages[nextPages.length - 1];
        if (currentPage.length && usedHeight + height > availableHeight) {
          nextPages.push([]);
          usedHeight = 0;
        }
        nextPages[nextPages.length - 1].push(index);
        usedHeight += height;
      });

      if (!cancelled) {
        setPages((currentPages) =>
          JSON.stringify(currentPages) === JSON.stringify(nextPages)
            ? currentPages
            : nextPages,
        );
      }
      onLayout?.({ pages: nextPages.length, oversize: boxHeights.some((height) => height > availableHeight) });
    }

    paginate();
    document.fonts?.ready.then(paginate);

    return () => {
      cancelled = true;
    };
  }, [
    l,
    lang,
    capsules,
    b.logo,
    b.schoolLogoUrl,
    b.schoolName,
    b.teacherName,
    b.appName,
    b.extraMargin,
  ]);

  return (
    <div className="lpc-doc">
      <div className="lpc-measure" aria-hidden="true">
        <div className={cls} dir={S.dir} lang={lang} style={style} ref={measureRootRef}>
          <div ref={measureBannerRef}>
            <Banner l={l} b={b} S={S} ur={ur} />
          </div>
          <div className="lpc-grid" ref={measureGridRef}>
            <div className="lpc-col lpc-left" />
            <div className="lpc-col lpc-right" ref={measureRightRef}>
              {boxes.map(renderBox)}
            </div>
          </div>
          <div ref={measureFooterRef}>
            <Footer b={b} S={S} page={1} pages={1} />
          </div>
        </div>
      </div>

      {pages.map((pageIndexes, pageIndex) => (
        <div className={cls} dir={S.dir} lang={lang} style={style} key={pageIndex}>
          <Banner l={l} b={b} S={S} ur={ur} onEdit={editable ? onEdit : undefined} />
          <div className="lpc-grid">
            <div className="lpc-col lpc-left">
              {pageIndex === 0 && (
                <>
                  <div className="lpc-box lpc-glance">
                    <p className="lpc-k">{S.glance}</p>
                    <b>{S.time}</b> <Editable>{S.periods(l.minutes, l.minutes > 60 ? 2 : 1)}</Editable>
                    <br /><b>{S.date}</b> <Editable>____________</Editable>
                    <p className="lpc-k lpc-gap">{S.studentsWill}</p>
                    {l.slos.map((text, index) => (
                      <div key={index}><Editable>{text}{ur ? '۔' : '.'}</Editable></div>
                    ))}
                    <p className="lpc-k lpc-gap">{S.bring}</p>
                    <Editable>{l.materials}{ur ? '۔' : '.'}</Editable>
                    {editable && <Pencil abs onClick={() => onEdit?.('glance')} label={`${S.dialog.editBox}: ${S.glance}`} />}
                  </div>
                  <div className="lpc-box">
                    <p className="lpc-k">{S.teacherNotes}</p>
                    {l.teacherInfo.map((item, index) => (
                      <div key={index}><Editable><Item i={item} /></Editable></div>
                    ))}
                    {editable && <Pencil abs onClick={() => onEdit?.('teacherInfo')} label={`${S.dialog.editBox}: ${S.teacherNotes}`} />}
                  </div>
                </>
              )}
              <div className="lpc-box lpc-obs">
                <p className="lpc-k">{S.observations}</p>
                <div
                  aria-label={S.observations}
                  className="lpc-editable lpc-observations-editable"
                  contentEditable
                  suppressContentEditableWarning
                  spellCheck={false}
                />
              </div>
            </div>
            <div className="lpc-col lpc-right">
              {pageIndexes.map((index) => renderBox(boxes[index], index, editable))}
            </div>
          </div>
          <Footer
            b={b}
            S={S}
            page={pageIndex + 1}
            pages={pages.length}
          />
        </div>
      ))}
    </div>
  );
}
