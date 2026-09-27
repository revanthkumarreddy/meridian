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
import type { CoachAction } from "@/lib/coach";
import { USERS, userName, type UserId } from "@/lib/users";

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

export type ChatMessage = {
  role: "user" | "coach";
  text: string;
  link?: { href: string; label: string };
  action?: CoachAction;
  quizAnswer?: string;
};

type DeskState = {
  path: PathId;
  start: string;
  days: Record<string, DayLog>;
  topics: Record<string, { status: DayLog["status"]; confidence: number }>;
  stories: Record<string, StoryLog>;
  projects: Record<string, DayLog["status"]>;
  messages: ChatMessage[];
};

const EMPTY: DeskState = {
  path: "ai_sde",
  start: "",
  days: {},
  topics: {},
  stories: {},
  projects: {},
  messages: [],
};

const LEGACY_KEY = "meridian-desk-v1";
const USER_KEY = "meridian-user";

function storageKey(user: UserId) {
  return `meridian-desk-v2:${user}`;
}

function loadDesk(user: UserId): DeskState {
  try {
    const raw = localStorage.getItem(storageKey(user));
    if (raw) return { ...EMPTY, ...JSON.parse(raw) };
    if (user === "revanth") {
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) return { ...EMPTY, ...JSON.parse(legacy), messages: [] };
    }
  } catch {
    /* keep defaults */
  }
  return { ...EMPTY, messages: [] };
}

type DeskContextValue = DeskState & {
  ready: boolean;
  user: UserId;
  userName: string;
  users: typeof USERS;
  setUser: (user: UserId) => void;
  setPath: (path: PathId) => void;
  setStart: (start: string) => void;
  setDay: (day: number, patch: Partial<DayLog>) => void;
  setTopic: (id: number, patch: Partial<DeskState["topics"][string]>) => void;
  setStory: (id: string, patch: Partial<StoryLog>) => void;
  setProject: (name: string, status: DayLog["status"]) => void;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  exportProgress: () => void;
};

const DeskContext = createContext<DeskContextValue | null>(null);

function blankDay(): DayLog {
  return { status: "Not started", confidence: 0, notes: "" };
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserId>("revanth");
  const [state, setState] = useState<DeskState>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(USER_KEY);
    const next: UserId = saved === "anjali" ? "anjali" : "revanth";
    setUserState(next);
    setState(loadDesk(next));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(storageKey(user), JSON.stringify(state));
    localStorage.setItem(USER_KEY, user);
  }, [state, user, ready]);

  const value = useMemo<DeskContextValue>(() => {
    return {
      ...state,
      ready,
      user,
      userName: userName(user),
      users: USERS,
      setUser: (next) => {
        if (next === user) return;
        localStorage.setItem(storageKey(user), JSON.stringify(state));
        localStorage.setItem(USER_KEY, next);
        setUserState(next);
        setState(loadDesk(next));
      },
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
      addMessage: (message) =>
        setState((s) => ({ ...s, messages: [...s.messages, message].slice(-40) })),
      clearMessages: () => setState((s) => ({ ...s, messages: [] })),
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
  }, [state, ready, user]);

  return <DeskContext.Provider value={value}>{children}</DeskContext.Provider>;
}

export function useDesk() {
  const ctx = useContext(DeskContext);
  if (!ctx) throw new Error("useDesk must be used inside ProgressProvider");
  return ctx;
}
