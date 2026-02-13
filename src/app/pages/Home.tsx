import { PerformanceProvider } from "../context/PerformanceContext";
import Stage from "../components/Stage";
import ConceptBox from "../components/ConceptBox";

export default function Home() {
  return (
    <PerformanceProvider>
      <div className="relative h-screen w-screen overflow-hidden bg-surface">
        <ConceptBox />
        <Stage />
      </div>
    </PerformanceProvider>
  );
}
