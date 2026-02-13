"use client";

import { PerformanceProvider, usePerformance } from "../context/PerformanceContext";
import Stage from "../components/Stage";
import ConceptBox from "../components/ConceptBox";
import IntroScreen from "../components/IntroScreen";
import FinScreen from "../components/FinScreen";
import Header from "../components/Header";
import Footer from "../components/Footer";

function HomeContent() {
  const { phase, currentConceptIndex } = usePerformance();

  // Show header/footer after the intro is done and at least one concept has started
  const showChrome = phase !== "intro" && (currentConceptIndex > 0 || phase === "complete");

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-surface">
      <Header visible={showChrome} />
      <Footer visible={showChrome} />

      {phase === "intro" ? (
        <IntroScreen />
      ) : phase === "complete" ? (
        <>
          <ConceptBox />
          <FinScreen />
        </>
      ) : (
        <>
          <ConceptBox />
          <Stage />
        </>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <PerformanceProvider>
      <HomeContent />
    </PerformanceProvider>
  );
}
