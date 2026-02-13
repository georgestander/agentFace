export default function About() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <header className="mb-12">
          <a href="/" className="text-xs font-mono text-ink-faint hover:text-ink-muted transition-colors">
            &larr; back
          </a>
        </header>

        <h1 className="text-2xl font-medium text-ink mb-8">About</h1>

        <div className="space-y-6 text-sm text-ink-muted leading-relaxed">
          <p>
            George Stander builds things that think. Software that has opinions.
            Interfaces that understand context. Systems with soul.
          </p>
          <p>
            He believes every tool should know why it exists, that the best
            interface is a conversation, and that one person with clarity can
            build what usually takes a team.
          </p>
          <p>
            This site is itself the demonstration — an agent that performs
            George's thinking, one concept at a time.
          </p>
        </div>
      </div>
    </div>
  );
}
