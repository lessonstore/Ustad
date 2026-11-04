import { useEffect, useState } from "react";
import CatalogViewer from "./features/catalog/CatalogViewer.jsx";
import LessonPlanScreen from "./features/lesson-plan/LessonPlanScreen.jsx";
import { UserProvider } from "./context/UserContext.jsx";
import { useUser } from "./context/UserContext.jsx";
import AdminPaymentQueue from "./features/tokens/AdminPaymentQueue.jsx";
import SiteShell from "./components/SiteShell.jsx";

function AppContent() {
  const { currentUser, loading, isAdmin, signIn } = useUser();
  const [, setRouteVersion] = useState(0);
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";

  useEffect(() => {
    const updateRoute = () => setRouteVersion((version) => version + 1);
    const handleLinkClick = (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!link || link.target || link.hasAttribute("download")) return;
      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      event.preventDefault();
      window.history.pushState({}, "", `${destination.pathname}${destination.search}${destination.hash}`);
      updateRoute();
      window.scrollTo(0, 0);
    };
    window.addEventListener("popstate", updateRoute);
    document.addEventListener("click", handleLinkClick);
    return () => {
      window.removeEventListener("popstate", updateRoute);
      document.removeEventListener("click", handleLinkClick);
    };
  }, []);

  if (pathname === "/lesson-plan") {
    return <SiteShell><LessonPlanScreen /></SiteShell>;
  }

  if (pathname === "/auth") {
    return (
      <SiteShell>
        <main className="mx-auto grid max-w-md px-5 py-16">
          <section className="animate-rise rounded-3xl border border-border bg-card p-8 shadow-lift">
            <h1 className="text-3xl font-semibold">{currentUser ? "You are signed in" : "Welcome to USTAD"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{currentUser ? currentUser.email : "For teachers of SED Punjab"}</p>
            {!currentUser && (
              <>
                <p className="mt-6 text-sm text-muted-foreground">Sign in with your Google account to purchase lesson previews and manage your plans.</p>
                <button className="mt-6 w-full rounded-xl bg-gradient-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-60" disabled={loading} onClick={() => void signIn().catch(() => {})} type="button">Continue with Google</button>
              </>
            )}
            {currentUser && <a className="mt-6 inline-block rounded-xl bg-gradient-primary px-5 py-3 font-semibold text-primary-foreground" href="/profile">Go to my profile</a>}
          </section>
        </main>
      </SiteShell>
    );
  }

  if (pathname === "/admin" || pathname === "/admin/queue") {
    if (loading) {
      return <SiteShell><main className="mx-auto max-w-5xl px-5 py-14 text-muted-foreground">Checking administrator access…</main></SiteShell>;
    }

    if (!currentUser || !isAdmin) {
      return (
        <SiteShell>
          <main className="mx-auto max-w-xl px-5 py-14">
            <section className="rounded-3xl border border-border bg-card p-8 shadow-soft">
              <h1 className="text-2xl font-semibold">Administrator access required</h1>
              <p className="mt-2 text-muted-foreground">Sign in with an authorized administrator account to review payments.</p>
              {!currentUser && <button className="mt-5 rounded-xl bg-gradient-primary px-5 py-3 font-semibold text-primary-foreground" onClick={() => void signIn().catch(() => {})} type="button">Continue with Google</button>}
              <a className="mt-5 block text-primary underline" href="/">Back to Catalog</a>
            </section>
          </main>
        </SiteShell>
      );
    }

    return <SiteShell><AdminPaymentQueue /></SiteShell>;
  }

  return <CatalogViewer />;
}

export default function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}
