import CatalogViewer from "./features/catalog/CatalogViewer.jsx";
import LessonPlanScreen from "./features/lesson-plan/LessonPlanScreen.jsx";

export default function App() {
  if (window.location.pathname.replace(/\/+$/, "") === "/lesson-plan") {
    return <LessonPlanScreen />;
  }

  return <CatalogViewer />;
}
