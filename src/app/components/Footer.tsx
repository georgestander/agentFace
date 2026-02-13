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
      <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-ink-faint">
        <span className="text-ink-faint">built with curiosity</span>
        <a href="/about" className="hover:text-ink transition-colors">
          About George
        </a>
        <a href="/musings" className="hover:text-ink transition-colors">
          Musings
        </a>
        <a href="/contact" className="hover:text-ink transition-colors">
          Contact George
        </a>
      </div>
    </footer>
  );
}
