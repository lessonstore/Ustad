const paths = {
  "arrow-left": <><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></>,
  "arrow-right": <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
  book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></>,
  coins: <><circle cx="8" cy="8" r="6" /><path d="M18.1 12.9A6 6 0 0 1 9 19.2" /><path d="M8 5v6M5 8h6M16 17v4M14 19h4" /></>,
  graduation: <><path d="m22 10-10 5L2 10l10-5 10 5Z" /><path d="M6 12v5c3 3 9 3 12 0v-5M22 10v6" /></>,
  home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v12h14V9M9 21v-7h6v7" /></>,
  tag: <><path d="m20.6 13.4-7.2 7.2a2 2 0 0 1-2.8 0l-8.2-8.2a2 2 0 0 1-.6-1.4V4h7l11.8 6.6a2 2 0 0 1 0 2.8Z" /><circle cx="7.5" cy="7.5" r=".8" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M5 21a7 7 0 0 1 14 0" /></>,
  login: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
};

export default function UiIcon({ name, size = 20 }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}
