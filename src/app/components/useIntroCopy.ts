"use client";

import { useEffect, useState } from "react";

const LAST_INTRO_KEY = "agent-face:last-intro-key";

const FALLBACK_TEXT =
  "I am George's agent in live performance mode. I think aloud, then choose one tool.";
const FALLBACK_WARNING =
  "This could go horribly wrong, and that risk is part of the experiment.";

interface IntroApiResponse {
  text?: unknown;
  warning?: unknown;
  key?: unknown;
}

export interface IntroCopyState {
  text: string;
  warning: string;
}

function createNonce(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useIntroCopy(): IntroCopyState {
  const [copy, setCopy] = useState<IntroCopyState>({
    text: FALLBACK_TEXT,
    warning: FALLBACK_WARNING,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadCopy() {
      try {
        const params = new URLSearchParams({
          nonce: createNonce(),
        });

        const avoidKey = sessionStorage.getItem(LAST_INTRO_KEY);
        if (avoidKey) params.set("avoid", avoidKey);

        const response = await fetch(`/api/intro?${params.toString()}`, {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) return;

        const data = (await response.json()) as IntroApiResponse;
        if (cancelled) return;

        const text =
          typeof data.text === "string" && data.text.trim()
            ? data.text.trim()
            : FALLBACK_TEXT;

        const warning =
          typeof data.warning === "string" && data.warning.trim()
            ? data.warning.trim()
            : FALLBACK_WARNING;

        setCopy({ text, warning });

        if (typeof data.key === "string" && data.key.trim()) {
          sessionStorage.setItem(LAST_INTRO_KEY, data.key);
        }
      } catch (err) {
        if (!cancelled) {
          console.warn("[Intro] Failed to load intro copy:", err);
        }
      }
    }

    loadCopy();

    return () => {
      cancelled = true;
    };
  }, []);

  return copy;
}
