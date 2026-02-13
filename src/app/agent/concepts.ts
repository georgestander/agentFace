export interface Concept {
  /** Short identifier for internal tracking */
  id: string;
  /** The poetic/cryptic bullet point shown in the concept box UI */
  bullet: string;
  /** Longer description for the system prompt — gives the agent context */
  elaboration: string;
  /** Tags/themes for the agent to consider when choosing tools */
  themes: string[];
}

export const CONCEPTS: Concept[] = [
  {
    id: "reason-to-exist",
    bullet: "find the reason for things to exist",
    elaboration:
      "George starts every project by asking why it should exist at all. Not what it does — why it matters. If the reason isn't clear, the thing shouldn't be built. This is the filter everything passes through.",
    themes: ["philosophy", "purpose", "first-principles"],
  },
  {
    id: "what-it-needs-to-do",
    bullet: "know what it needs to do",
    elaboration:
      "Once something has a reason to exist, the next question is: what does it actually need to do? Not features. Not specs. The core job — the thing that, if it doesn't do it, nothing else matters.",
    themes: ["clarity", "function", "essentialism"],
  },
  {
    id: "interfaces-as-conversations",
    bullet: "the best interface is a conversation",
    elaboration:
      "Dashboards are artifacts of limited input methods. When AI can understand intent, the interface becomes a dialogue, not a grid of widgets. This shapes everything George builds.",
    themes: ["interfaces", "ai", "design"],
  },
  {
    id: "agents-as-colleagues",
    bullet: "agents should have desks, not toolbars",
    elaboration:
      "WorkspaceOS came from the idea that AI agents are colleagues, not features. They need their own space to work in — not a sidebar bolted onto human tools.",
    themes: ["workspaceos", "architecture", "vision"],
  },
  {
    id: "thought-branches",
    bullet: "thought is not linear, why is chat?",
    elaboration:
      "Connexus exists because George kept losing threads in long AI conversations. Thought branches. Chat should too.",
    themes: ["connexus", "ux", "nonlinear"],
  },
  {
    id: "one-person-enterprise",
    bullet: "one person can build enterprise",
    elaboration:
      "The clinical trial budgeting engine — global labor benchmarks, regional modifiers, built by one engineer. Proof that one thoughtful builder can replace a team with spreadsheets.",
    themes: ["enterprise", "craft", "scale"],
  },
  {
    id: "site-as-portfolio",
    bullet: "this site is the portfolio piece",
    elaboration:
      "Agent Face itself. The medium is the message. A portfolio that demonstrates the ideas instead of describing them. You're watching it right now.",
    themes: ["meta", "demonstration", "recursion"],
  },
];
