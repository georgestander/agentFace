"use client";

import { createContext, useContext, type ReactNode } from "react";

interface ChatContextValue {
  onChoiceSelect?: (value: string) => void;
}

const ChatContext = createContext<ChatContextValue>({});

export function ChatProvider({
  children,
  onChoiceSelect,
}: {
  children: ReactNode;
  onChoiceSelect?: (value: string) => void;
}) {
  return (
    <ChatContext.Provider value={{ onChoiceSelect }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}
