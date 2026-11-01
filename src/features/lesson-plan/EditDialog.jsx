import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { STRINGS } from './strings.js';
import { phaseMinutes } from './timing.js';
import './lesson-plan-edit.css';

let uid = 0;
const toRows = (items = []) => items.map((it) => ({
  id: ++uid,
  lead: typeof it === 'string' ? '' : it.lead,
  text: typeof it === 'string' ? it : it.text,
  showLead: typeof it !== 'string',
}));
const fromRows = (rows) => rows
  .filter((r) => r.text.trim() || r.lead.trim())
  .map((r) => (r.lead.trim() ? { lead: r.lead.trim(), text: r.text.trim() } : r.text.trim()));
const blank = () => ({ id: ++uid, lead: '', text: '', showLead: false });

function AutoText({ value, onChange, onEnter, placeholder, autoFocus }) {
  const ref = useRef(null);
  useLayoutEffect(() => { const el = ref.current; if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }, [value]);
  return (
    <textarea ref={ref} rows={1} className="lpe-text" value={value} placeholder={placeholder} autoFocus={autoFocus}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && onEnter) { e.preventDefault(); onEnter(); } }} />
  );
}

function Rows({ D, rows, setRows, checkbox }) {
  const patch = (id, p) => setRows(rows.map((r) => (r.id === id ? { ...r, ...p } : r)));
  const move = (i, d) => { const j = i + d; if (j < 0 || j >= rows.length) return; const a = [...rows]; [a[i], a[j]] = [a[j], a[i]]; setRows(a); };
  const addAfter = (i) => { const a = [...rows]; a.splice(i + 1, 0, { ...blank(), focus: true }); setRows(a); };
  return (
    <>
      <ul className="lpe-rows">
        {rows.map((r, i) => (
          <li className="lpe-row" key={r.id}>
            {checkbox ? <i className="lpe-check" /> : <span className="lpe-dot" />}
            <div className="lpe-fields">
              {r.showLead && <input className="lpe-lead" value={r.lead} placeholder={D.label} onChange={(e) => patch(r.id, { lead: e.target.value })} />}
              <AutoText value={r.text} placeholder={D.line} autoFocus={r.focus} onChange={(v) => patch(r.id, { text: v })} onEnter={() => addAfter(i)} />
              {!r.showLead && <button type="button" className="lpe-link" onClick={() => patch(r.id, { showLead: true })}>{D.addLabel}</button>}
            </div>
            <div className="lpe-tools">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={D.up} title={D.up}>↑</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label={D.down} title={D.down}>↓</button>
              <button type="button" onClick={() => setRows(rows.filter((x) => x.id !== r.id))} aria-label={D.del} title={D.del}>×</button>
            </div>
          </li>
        ))}
      </ul>
      <button type="button" className="lpe-add" onClick={() => setRows([...rows, { ...blank(), focus: true }])}>＋ {D.addLine}</button>
    </>
  );
}

const LIST_KEYS = ['introduction', 'development', 'conclusion', 'assessment', 'followUp', 'teacherInfo'];
const TIMED = ['introduction', 'development', 'conclusion', 'assessment'];

/**
 * One popup for every editable part: a list box, At a glance, or the heading.
 * onSave receives a partial lesson ({ introduction: [...], timing: [...] } etc.).
 */
export default function EditDialog({ section, lesson, original, lang = 'en', onSave, onClose }) {
  const S = STRINGS[lang] ?? STRINGS.en, D = S.dialog, ur = lang === 'ur';
  const isList = LIST_KEYS.includes(section);
  const idx = TIMED.indexOf(section);
  const startMin = (src) => phaseMinutes(src)[idx];

  const init = (src) => ({
    rows: toRows(isList ? src[section] : section === 'glance' ? src.slos : []),
    minutes: idx >= 0 ? startMin(src) : 0,
    materials: src.materials ?? '',
    f: { classLabel: src.classLabel, subject: src.subject, domain: src.domain, subDomain: src.subDomain, topic: src.topic },
  });
  const first = init(lesson);
  const [rows, setRows] = useState(first.rows);
  const [minutes, setMinutes] = useState(first.minutes);
  const [materials, setMaterials] = useState(first.materials);
  const [f, setF] = useState(first.f);

  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [onClose]);

  const reset = () => { const o = init(original ?? lesson); setRows(o.rows); setMinutes(o.minutes); setMaterials(o.materials); setF(o.f); };

  const save = () => {
    if (isList) {
      const patch = { [section]: fromRows(rows) };
      if (idx >= 0) { const t = [...(lesson.timing ?? [])]; t[idx] = Math.max(0, parseInt(minutes, 10) || 0); patch.timing = t; }
      onSave(patch);
    } else if (section === 'glance') {
      onSave({ slos: fromRows(rows).map((x) => (typeof x === 'string' ? x : `${x.lead} ${x.text}`)), materials: materials.trim() });
    } else {
      onSave(Object.fromEntries(Object.entries(f).map(([k, v]) => [k, (v ?? '').trim()])));
    }
  };

  const titles = { introduction: S.introduction, development: S.development, conclusion: S.conclusion, assessment: S.assessment, followUp: S.followUp, teacherInfo: S.teacherNotes, glance: S.glance, banner: D.banner };

  return (
    <div className="lpe-overlay">
      <div className={`lpe-panel${ur ? ' lpe--ur' : ''}`} dir={S.dir} lang={lang} role="dialog" aria-modal="true" aria-label={titles[section]}>
        <div className="lpe-head"><h2>{D.edit}: {titles[section]}</h2><button type="button" className="lpe-x" onClick={onClose} aria-label={D.cancel}>×</button></div>
        <div className="lpe-body">
          {isList && <Rows D={D} rows={rows} setRows={setRows} checkbox={section !== 'teacherInfo'} />}
          {isList && idx >= 0 && (
            <label className="lpe-min">{D.minutes}
              <input type="number" min="0" max="240" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
            </label>
          )}
          {section === 'glance' && (
            <>
              <h3 className="lpe-sub">{D.outcomes}</h3>
              <Rows D={D} rows={rows} setRows={setRows} checkbox={false} />
              <h3 className="lpe-sub">{D.materials}</h3>
              <AutoText value={materials} placeholder={D.materials} onChange={setMaterials} />
            </>
          )}
          {section === 'banner' && ['classLabel', 'subject', 'domain', 'subDomain', 'topic'].map((k) => (
            <label className="lpe-field" key={k}>{D[k]}
              <input className="lpe-lead" value={f[k] ?? ''} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
            </label>
          ))}
        </div>
        <div className="lpe-foot">
          <button type="button" className="lpe-link" onClick={reset}>{D.reset}</button>
          <span className="lpe-spacer" />
          <button type="button" onClick={onClose}>{D.cancel}</button>
          <button type="button" className="lpe-primary" onClick={save}>{D.ok}</button>
        </div>
      </div>
    </div>
  );
}
