import { useUser } from "../context/UserContext.jsx";
import { getCurrentMonthKey } from "../utils/monthUtils.js";
import UiIcon from "./UiIcon.jsx";
import HeaderSubtitle from "./HeaderSubtitle.jsx";

const links = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/classes", label: "Classes", icon: "book" },
  { href: "/pricing", label: "Plans", icon: "tag" },
];

export default function SiteShell({ children }) {
  const { currentUser, userProfile, isAdmin, authError, profileError } = useUser();
  const balance = Number(userProfile?.tokens?.[getCurrentMonthKey()] ?? 0);
  const path = window.location.pathname;
  const isActive = (href) => path === href || (href !== "/" && path.startsWith(`${href}/`));

  return (
    <div className="ustad-shell">
      <header className="ustad-header">
        <div className="ustad-header-inner">
          <a className="ustad-brand" href="/">
            <span className="ustad-brand-icon"><UiIcon name="graduation" size={22} /></span>
            <span className="min-w-0 leading-tight"><b>USTAD</b><HeaderSubtitle /></span>
          </a>
          <nav className="ustad-desktop-nav" aria-label="Main navigation">
            {links.map(({ href, label }) => <a className={isActive(href) ? "is-active" : ""} href={href} key={href}>{label}</a>)}
            {isAdmin && <a className={isActive("/admin") ? "is-active" : ""} href="/admin">Admin</a>}
            {currentUser ? (
              <a className="ustad-wallet-link" href="/profile"><UiIcon name="coins" size={16} /><b>{balance.toLocaleString()}</b><span>tokens</span><UiIcon name="user" size={16} /></a>
            ) : (
              <a className="ustad-signin" href="/auth">Sign in</a>
            )}
          </nav>
          {currentUser ? (
            <a className="ustad-mobile-wallet" href="/profile" title="Your token balance">
              <UiIcon name="coins" size={16} /><b>{balance.toLocaleString()}</b><span>tokens</span>
            </a>
          ) : (
            <a className="ustad-mobile-wallet" href="/pricing"><UiIcon name="coins" size={16} />Get tokens</a>
          )}
        </div>
      </header>
      {(authError || profileError) && <p className="ustad-account-alert" role="alert">{authError || profileError}</p>}
      <div className="ustad-main">{children}</div>
      <footer className="ustad-footer">USTAD · Built for teachers of School Education Department, Punjab</footer>
      <nav className="ustad-mobile-nav" aria-label="Mobile navigation">
        {links.map(({ href, label, icon }) => <a className={isActive(href) ? "is-active" : ""} href={href} key={href}><UiIcon name={icon} size={20} /><span>{label}</span></a>)}
        {currentUser
          ? <a href="/profile"><UiIcon name="user" size={20} /><span>Profile</span></a>
          : <a className={isActive("/auth") ? "is-active" : ""} href="/auth"><UiIcon name="login" size={20} /><span>Sign in</span></a>}
      </nav>
    </div>
  );
}
