"use client";

interface HeaderProps {
  visible: boolean;
}

export default function Header({ visible }: HeaderProps) {
  return (
    <header
      className={`fixed top-6 left-6 z-20 transition-opacity duration-700 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <a href="/" className="text-xs font-mono text-ink-faint hover:text-ink-muted transition-colors">
        George Stander
      </a>
    </header>
  );
}
