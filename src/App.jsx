import CatalogViewer from "./features/catalog/CatalogViewer.jsx";
import LessonPlanScreen from "./features/lesson-plan/LessonPlanScreen.jsx";
import { UserProvider } from "./context/UserContext.jsx";
import { useUser } from "./context/UserContext.jsx";
import AdminPaymentQueue from "./features/tokens/AdminPaymentQueue.jsx";

function AppContent() {
  const { currentUser, loading, isAdmin, signIn } = useUser();
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";

  if (pathname === "/lesson-plan") {
    return <LessonPlanScreen />;
  }

  if (pathname === "/admin" || pathname === "/admin/queue") {
    if (loading) {
      return <main className="p-6 text-slate-700">Checking administrator access…</main>;
    }

    if (!currentUser || !isAdmin) {
      return (
        <main className="mx-auto max-w-xl p-6 text-slate-900">
          <h1 className="text-2xl font-semibold">Administrator access required</h1>
          <p className="mt-2 text-slate-600">
            Sign in with an authorized administrator account to review payments.
          </p>
          {!currentUser && (
            <button
              className="mt-5 min-h-11 rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white"
              onClick={() => void signIn().catch(() => {})}
              type="button"
            >
              Sign in with Google
            </button>
          )}
          <a className="mt-5 block text-indigo-700 underline" href="/">
            Back to Catalog
          </a>
        </main>
      );
    }

    return <AdminPaymentQueue />;
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
