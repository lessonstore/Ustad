import { useRef, useState } from 'react';
import LessonPlanC from './LessonPlanC.jsx';
import EditDialog from './EditDialog.jsx';
import { STRINGS } from './strings.js';
import './lesson-plan-edit.css';

const read = (key) => { try { const raw = key && localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch { return null; } };
const write = (key, v) => { try { if (!key) return; v == null ? localStorage.removeItem(key) : localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage full or blocked */ } };

/**
 * The lesson plan with editing: a pencil on every box opens a popup; OK saves and the page
 * re-arranges itself. The teacher's edited copy is kept apart from the original (server) lesson.
 *
 *   <LessonPlanEditor lesson={lessonFromServer} lang="en" branding={...} storageKey={`plan-${id}`} onChange={save} />
 */
export default function LessonPlanEditor({ lesson: original, lang = 'en', branding, capsules, storageKey, onChange, ...layout }) {
  const S = STRINGS[lang] ?? STRINGS.en, D = S.dialog;
  const [edits, setEdits] = useState(() => read(storageKey)); // null = untouched
  const lesson = edits ?? original;
  const [open, setOpen] = useState(null);
  const [undo, setUndo] = useState(null);
  const [oversize, setOversize] = useState(false);
  const timer = useRef(null);

  const apply = (next) => { setEdits(next); write(storageKey, next); onChange?.(next ?? original); };

  const commit = (patch) => {
    setUndo({ prev: edits });
    apply({ ...lesson, ...patch });
    setOpen(null);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setUndo(null), 7000);
  };
  const doUndo = () => { apply(undo.prev); setUndo(null); clearTimeout(timer.current); };

  return (
    <>
      <LessonPlanC lesson={lesson} lang={lang} branding={branding} capsules={capsules} {...layout}
        editable onEdit={setOpen} onLayout={(x) => setOversize(x.oversize)} />
      {oversize && <div className="lpe-warn" role="alert">{D.tooLong}</div>}
      {open && <EditDialog key={open} section={open} lesson={lesson} original={original} lang={lang} onSave={commit} onClose={() => setOpen(null)} />}
      {undo && <div className="lpe-toast" role="status"><span>{D.saved}</span><button type="button" onClick={doUndo}>{D.undo}</button></div>}
    </>
  );
}
