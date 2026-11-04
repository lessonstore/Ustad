import { useUser } from "../context/UserContext.jsx";
import { getCurrentMonthKey } from "../utils/monthUtils.js";
import UiIcon from "./UiIcon.jsx";
import InstallPrompt from "./InstallPrompt.jsx";

const links = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/classes", label: "Classes", icon: "book" },
  { href: "/pricing", label: "Plans", icon: "tag" },
];

export default function SiteShell({ children }) {
  const { currentUser, userProfile, loading, signIn, isAdmin, authError, profileError } = useUser();
  const balance = Number(userProfile?.tokens?.[getCurrentMonthKey()] ?? 0);

  return (
    <div className="ustad-shell">
      <header className="ustad-header">
        <div className="ustad-header-inner">
          <a className="ustad-brand" href="/">
            <span className="ustad-brand-icon"><UiIcon name="graduation" size={22} /></span>
            <span><b>USTAD</b><small>Unique Smart Teacher Assistant Dashboard</small></span>
          </a>
          <nav className="ustad-desktop-nav" aria-label="Main navigation">
            {links.map(({ href, label }) => <a href={href} key={href}>{label}</a>)}
            {isAdmin && <a href="/admin">Admin</a>}
            {currentUser ? (
              <a className="ustad-wallet-link" href="/profile"><UiIcon name="coins" size={16} /> {balance.toLocaleString()} tokens <UiIcon name="user" size={16} /></a>
            ) : (
              <button className="ustad-signin" disabled={loading} onClick={() => void signIn().catch(() => {})} type="button">Sign in</button>
            )}
          </nav>
          <div className="ustad-install-prompt"><InstallPrompt /></div>
          {currentUser ? (
            <a className="ustad-mobile-wallet" href="/profile" aria-label={`${balance} tokens`}>
              <UiIcon name="coins" size={17} /> {balance.toLocaleString()}
            </a>
          ) : (
            <button className="ustad-mobile-wallet" disabled={loading} onClick={() => void signIn().catch(() => {})} type="button">
              <UiIcon name="login" size={16} /> Sign in
            </button>
          )}
        </div>
      </header>
      {(authError || profileError) && <p className="ustad-account-alert" role="alert">{authError || profileError}</p>}
      <div className="ustad-main">{children}</div>
      <footer className="ustad-footer">USTAD · Built for teachers of School Education Department, Punjab</footer>
      <nav className="ustad-mobile-nav" aria-label="Mobile navigation">
        {links.map(({ href, label, icon }) => <a href={href} key={href}><UiIcon name={icon} size={20} /><span>{label}</span></a>)}
        {currentUser
          ? <a href="/profile"><UiIcon name="user" size={20} /><span>Profile</span></a>
          : <button disabled={loading} onClick={() => void signIn().catch(() => {})} type="button"><UiIcon name="login" size={20} /><span>Sign in</span></button>}
      </nav>
    </div>
  );
}
