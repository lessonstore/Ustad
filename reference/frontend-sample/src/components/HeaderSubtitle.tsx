import { useEffect, useRef, useState } from "react";

const subtitle = "Unique Smart Teacher Assistant Dashboard";

export function HeaderSubtitle() {
  const viewport = useRef<HTMLSpanElement>(null);
  const text = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const box = viewport.current;
    const label = text.current;
    if (!box || !label) return;
    const measure = () => setOverflow(label.scrollWidth > box.clientWidth);
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    observer.observe(label);
    measure();
    document.fonts.ready.then(measure);
    return () => observer.disconnect();
  }, []);
  return (
    <span ref={viewport} className="block overflow-hidden text-[10px] uppercase text-muted-foreground" aria-label={subtitle}>
      <span className={`inline-flex w-max whitespace-nowrap ${overflow ? "header-subtitle-roll" : ""}`} aria-hidden="true">
        <span ref={text}>{subtitle}</span>
        {overflow && <><span className="w-10 shrink-0" /><span>{subtitle}</span><span className="w-10 shrink-0" /></>}
      </span>
    </span>
  );
}