"use client";

interface FooterProps {
  visible: boolean;
}

export default function Footer({ visible }: FooterProps) {
  return (
    <footer
      className={`fixed bottom-4 left-6 z-20 transition-opacity duration-700 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <p className="text-[10px] font-mono text-ink-faint">
        built with curiosity
      </p>
    </footer>
  );
}
