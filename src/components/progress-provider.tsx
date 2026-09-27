"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { PathId } from "@/lib/curriculum";

export type DayLog = {
  status: "Not started" | "Light" | "In progress" | "Done" | "Redo" | "Skipped";
  confidence: number;
  notes: string;
};

export type StoryLog = {
  situation: string;
  task: string;
  action: string;
  result: string;
  lesson: string;
  status: DayLog["status"];
};

type DeskState = {
  path: PathId;
  start: string;
  days: Record<string, DayLog>;
  topics: Record<string, { status: DayLog["status"]; confidence: number }>;
  stories: Record<string, StoryLog>;
  projects: Record<string, DayLog["status"]>;
};

const EMPTY: DeskState = {
  path: "ai_sde",
  start: "",
  days: {},
  topics: {},
  stories: {},
  projects: {},
};

const KEY = "meridian-desk-v1";

type DeskContextValue = DeskState & {
  ready: boolean;
  setPath: (path: PathId) => void;
  setStart: (start: string) => void;
  setDay: (day: number, patch: Partial<DayLog>) => void;
  setTopic: (id: number, patch: Partial<DeskState["topics"][string]>) => void;
  setStory: (id: string, patch: Partial<StoryLog>) => void;
  setProject: (name: string, status: DayLog["status"]) => void;
  exportProgress: () => void;
};

const DeskContext = createContext<DeskContextValue | null>(null);

function blankDay(): DayLog {
  return { status: "Not started", confidence: 0, notes: "" };
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DeskState>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DeskState;
        setState({ ...EMPTY, ...parsed });
      }
    } catch {
      /* keep defaults */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, ready]);

  const value = useMemo<DeskContextValue>(() => {
    return {
      ...state,
      ready,
      setPath: (path) => setState((s) => ({ ...s, path })),
      setStart: (start) => setState((s) => ({ ...s, start })),
      setDay: (day, patch) =>
        setState((s) => ({
          ...s,
          days: {
            ...s.days,
            [day]: { ...blankDay(), ...s.days[String(day)], ...patch },
          },
        })),
      setTopic: (id, patch) =>
        setState((s) => ({
          ...s,
          topics: {
            ...s.topics,
            [id]: {
              ...{ status: "Not started" as const, confidence: 0 },
              ...s.topics[String(id)],
              ...patch,
            },
          },
        })),
      setStory: (id, patch) =>
        setState((s) => ({
          ...s,
          stories: {
            ...s.stories,
            [id]: {
              ...{
                situation: "",
                task: "",
                action: "",
                result: "",
                lesson: "",
                status: "Not started" as const,
              },
              ...s.stories[id],
              ...patch,
            },
          },
        })),
      setProject: (name, status) =>
        setState((s) => ({ ...s, projects: { ...s.projects, [name]: status } })),
      exportProgress: () => {
        const blob = new Blob([JSON.stringify(state, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "meridian-progress.json";
        a.click();
        URL.revokeObjectURL(url);
      },
    };
  }, [state, ready]);

  return <DeskContext.Provider value={value}>{children}</DeskContext.Provider>;
}

export function useDesk() {
  const ctx = useContext(DeskContext);
  if (!ctx) throw new Error("useDesk must be used inside ProgressProvider");
  return ctx;
}
