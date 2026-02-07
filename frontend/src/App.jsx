import Productivity from "./pages/Productivity";
import Inventory from "./pages/Inventory";
import StudyMaterials from "./pages/StudyMaterials";
import Assignments from "./pages/Assignments";

function App() {
  return (
    <div>
      <h1>Student Life Dashboard</h1>
      <Productivity />
      <Inventory />
      <StudyMaterials />
      <Assignments />
    </div>
  );
}

export default App;
