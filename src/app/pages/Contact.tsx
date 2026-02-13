export default function Contact() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <header className="mb-12">
          <a href="/" className="text-xs font-mono text-ink-faint hover:text-ink-muted transition-colors">
            &larr; back
          </a>
        </header>

        <h1 className="text-2xl font-medium text-ink mb-8">Contact</h1>

        <div className="space-y-6 text-sm text-ink-muted leading-relaxed">
          <p>
            If something here resonated — whether you're building something similar,
            looking for someone to build with, or just want to talk about how
            software should think — reach out.
          </p>

          <div className="space-y-3 font-mono text-xs">
            <p>
              <span className="text-ink-faint">email</span>{" "}
              <a
                href="mailto:george@georgestander.com"
                className="text-ink-muted hover:text-ink transition-colors"
              >
                george@georgestander.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
