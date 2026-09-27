import data from "@/data/curriculum.json";

export const curriculum = data;

export type DayRecord = (typeof data.days)[number];
export type TopicRecord = (typeof data.topics)[number];
export type PathId = "general" | "ai_sde" | "ai_eng";

export const PATHS: { id: PathId; name: string }[] = [
  { id: "general", name: "General SDE-2" },
  { id: "ai_sde", name: "AI-product SDE-2" },
  { id: "ai_eng", name: "Applied AI engineer" },
];

export const trackTone: Record<string, string> = {
  DSA: "bg-[#f8e4de] text-[#9c4034]",
  CS: "bg-[#e3e8f2] text-[#2c4068]",
  Design: "bg-[#e7eef5] text-[#2c4068]",
  Behavioral: "bg-[#f8f0dc] text-[#8c6a2f]",
  AI: "bg-[#e3f2f0] text-[#0f6e6b]",
  Foundations: "bg-[#f3ebdf] text-[#6b5344]",
  Interview: "bg-[#f8e7d2] text-[#c56a12]",
  "Interview ops": "bg-[#f8e7d2] text-[#c56a12]",
};

export function tone(track: string) {
  return trackTone[track] ?? "bg-muted text-foreground";
}

export function dayNumberFromStart(start: string, today = new Date()) {
  if (!start) return null;
  const startDate = new Date(`${start}T00:00:00`);
  if (Number.isNaN(startDate.getTime())) return null;
  const current = new Date(today);
  current.setHours(0, 0, 0, 0);
  const diff = Math.floor((current.getTime() - startDate.getTime()) / 86400000) + 1;
  return diff;
}
