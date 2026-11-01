import CatalogViewer from "./features/catalog/CatalogViewer.jsx";
import LessonPlanScreen from "./features/lesson-plan/LessonPlanScreen.jsx";
import { UserProvider } from "./context/UserContext.jsx";

export default function App() {
  if (window.location.pathname.replace(/\/+$/, "") === "/lesson-plan") {
    return (
      <UserProvider>
        <LessonPlanScreen />
      </UserProvider>
    );
  }

  return (
    <UserProvider>
      <CatalogViewer />
    </UserProvider>
  );
}
