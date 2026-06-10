/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface Feedback {
  id: string;
  type: "bug" | "feature" | "improvement";
  message: string;
  page: string;
  timestamp: Date;
}

interface FeedbackContextValue {
  feedbacks: Feedback[];
  submitFeedback: (type: Feedback["type"], message: string, page: string) => void;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);

  const submitFeedback = useCallback(
    (type: Feedback["type"], message: string, page: string) => {
      const fb: Feedback = {
        id: `fb-${Date.now()}`,
        type,
        message,
        page,
        timestamp: new Date(),
      };
      setFeedbacks((prev) => [fb, ...prev]);
      console.log("Feedback submitted:", fb);
    },
    [],
  );

  return (
    <FeedbackContext.Provider value={{ feedbacks, submitFeedback }}>
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useFeedback must be used within FeedbackProvider");
  return ctx;
}
