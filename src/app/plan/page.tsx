"use client";

import { useEffect, useMemo, useState } from "react";
import { curriculum, dayNumberFromStart, tone } from "@/lib/curriculum";
import { useDesk, type DayLog } from "@/components/progress-provider";
import { Button } from "@/components/ui/button";

const STATUSES: DayLog["status"][] = ["Not started", "Light", "In progress", "Done", "Redo", "Skipped"];

type Cut = "60" | "120" | "180";

export default function PlanPage() {
  const desk = useDesk();
  const suggested = dayNumberFromStart(desk.start);
  const initial =
    suggested && suggested >= 1 && suggested <= curriculum.days.length ? suggested : 1;
  const [selected, setSelected] = useState(initial);

  useEffect(() => {
    if (!desk.ready) return;
    const next = dayNumberFromStart(desk.start);
    if (next && next >= 1 && next <= curriculum.days.length) setSelected(next);
  }, [desk.ready, desk.start]);
  const [weekFilter, setWeekFilter] = useState<number | "all">("all");
  const [emphasis, setEmphasis] = useState<"all" | "Core" | "Coding" | "AI">("all");
  const [cut, setCut] = useState<Cut>("120");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    return curriculum.days.filter((day) => {
      if (weekFilter !== "all" && day.week !== weekFilter) return false;
      if (emphasis !== "all" && day.emphasis !== emphasis && day.emphasis !== "Core") return false;
      if (query) {
        const blob = `${day.theme} ${day.pattern} ${day.concept} ${day.problems}`.toLowerCase();
        if (!blob.includes(query.toLowerCase())) return false;
      }
      return true;
    });
  }, [weekFilter, emphasis, query]);

  const day = curriculum.days.find((item) => item.day === selected) ?? visible[0] ?? curriculum.days[0];
  const log = desk.days[String(day.day)];

  const advice = adviceFor(desk.path, day.emphasis, day.week, log?.confidence ?? 0, cut);

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-3 lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:overflow-auto">
        <div className="rounded-3xl border border-[#e4d9c8] bg-white p-4">
          <label className="text-xs uppercase tracking-[0.16em] text-[#5e584e]" htmlFor="start-plan">
            Start date
          </label>
          <input
            id="start-plan"
            type="date"
            value={desk.start}
            onChange={(e) => desk.setStart(e.target.value)}
            className="mt-2 h-9 w-full rounded-xl border border-[#e4d9c8] px-2 text-sm"
          />
          {suggested && suggested >= 1 && suggested <= curriculum.days.length && (
            <button
              type="button"
              className="mt-2 text-sm font-medium text-[#c56a12]"
              onClick={() => setSelected(suggested)}
            >
              Jump to day {suggested}
            </button>
          )}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search themes"
          className="h-10 w-full rounded-2xl border border-[#e4d9c8] bg-white px-3 text-sm"
        />
        <div className="flex gap-1 overflow-x-auto">
          {(["all", "Core", "Coding", "AI"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setEmphasis(item)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs ${
                emphasis === item ? "bg-[#1e2a32] text-white" : "bg-white text-[#5e584e]"
              }`}
            >
              {item === "all" ? "All emphasis" : item}
            </button>
          ))}
        </div>
        <select
          value={String(weekFilter)}
          onChange={(e) => setWeekFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
          className="h-9 w-full rounded-xl border border-[#e4d9c8] bg-white px-2 text-sm"
        >
          <option value="all">All weeks</option>
          {curriculum.weeks.map((week) => (
            <option key={week.week} value={week.week}>
              Week {week.week}: {week.title}
            </option>
          ))}
        </select>
        <ul className="space-y-1">
          {visible.map((item) => {
            const status = desk.days[String(item.day)]?.status;
            const active = item.day === day.day;
            return (
              <li key={item.day}>
                <button
                  type="button"
                  onClick={() => setSelected(item.day)}
                  className={`w-full rounded-2xl px-3 py-2 text-left ${
                    active ? "bg-[#1e2a32] text-[#f6f1e7]" : "bg-white hover:bg-[#efe8dc]"
                  }`}
                >
                  <span className="flex items-center justify-between text-[11px] uppercase tracking-wide opacity-70">
                    <span>
                      W{item.week} · {item.weekday.slice(0, 3)}
                    </span>
                    <span>{status && status !== "Not started" ? status : item.priority}</span>
                  </span>
                  <span className="mt-0.5 block text-sm">{item.theme}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <article className="rounded-[28px] border border-[#e4d9c8] bg-white p-5 md:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs ${tone(day.track)}`}>{day.track}</span>
          <span className="rounded-full bg-[#efe8dc] px-2 py-0.5 text-xs">{day.emphasis}</span>
          <span className="rounded-full bg-[#efe8dc] px-2 py-0.5 text-xs">{day.priority}</span>
          <span className="text-xs text-[#5e584e]">
            Day {day.day} · Week {day.week} · {day.weekday} · {day.minutes} min planned
          </span>
        </div>
        <h1 className="mt-3 text-4xl leading-tight text-[#1e2a32]">{day.theme}</h1>
        <p className="mt-1 text-[#5e584e]">
          {day.phase} · {day.week_title}
          {day.optional_week ? " · optional on-ramp" : ""}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {(
            [
              ["60", "60 minutes"],
              ["120", "Two hours"],
              ["180", "Three hours"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setCut(value)}
              className={`rounded-full px-3 py-1 text-sm ${
                cut === value ? "bg-[#c56a12] text-white" : "bg-[#f6f1e7] text-[#1e2a32]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-4 rounded-2xl bg-[#f8f0dc] px-4 py-3 text-sm leading-relaxed text-[#3c3832]">
          {advice}
        </p>

        <div className="mt-6 space-y-4">
          <Block title="Pattern" highlight={cut === "60"}>
            {day.pattern}
          </Block>
          <Block title={cut === "60" ? "Do this" : "Coding block"} highlight={cut !== "180"}>
            {cut === "60" ? day.min60 : day.coding}
          </Block>
          {cut !== "60" && (
            <Block title="Problems" highlight>
              {day.problems}
            </Block>
          )}
          {cut !== "60" && (
            <Block title="Second block" highlight={cut === "180" || day.emphasis === "AI"}>
              {day.second}
            </Block>
          )}
          <Block title="Concept">{day.concept}</Block>
          {cut !== "60" && <Block title="Drill">{day.drill}</Block>}
          {cut === "180" && <Block title="Stretch">{day.hrs3}</Block>}
          {cut !== "60" && <Block title="Review">{day.review}</Block>}
          {cut === "60" && (
            <p className="text-sm text-[#5e584e]">
              The full coding block and the 3-hour stretch stay on the row. Mark Light if this cut is a
              choice, not a stall.
            </p>
          )}
        </div>

        <div className="mt-8 grid gap-3 border-t border-[#e4d9c8] pt-5 md:grid-cols-[1fr_160px]">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[#5e584e]">Status</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => desk.setDay(day.day, { status })}
                  className={`rounded-full px-3 py-1 text-sm ${
                    (log?.status ?? "Not started") === status
                      ? "bg-[#1e2a32] text-white"
                      : "bg-[#f6f1e7]"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          <label className="text-sm">
            Confidence 1–5
            <input
              type="number"
              min={1}
              max={5}
              value={log?.confidence || ""}
              onChange={(e) => desk.setDay(day.day, { confidence: Number(e.target.value) })}
              className="mt-1 h-10 w-full rounded-xl border border-[#e4d9c8] px-3"
            />
          </label>
        </div>
        <label className="mt-3 block text-sm">
          Notes
          <textarea
            value={log?.notes ?? ""}
            onChange={(e) => desk.setDay(day.day, { notes: e.target.value })}
            rows={3}
            className="mt-1 w-full rounded-2xl border border-[#e4d9c8] px-3 py-2"
            placeholder="What broke, what to redo, which story you touched."
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="rounded-full bg-white"
            disabled={day.day <= 1}
            onClick={() => setSelected(day.day - 1)}
          >
            Previous day
          </Button>
          <Button
            className="rounded-full"
            disabled={day.day >= curriculum.days.length}
            onClick={() => setSelected(day.day + 1)}
          >
            Next day
          </Button>
        </div>
      </article>
    </div>
  );
}

function Block({
  title,
  children,
  highlight,
}: {
  title: string;
  children: string;
  highlight?: boolean;
}) {
  return (
    <section className={`rounded-2xl px-4 py-3 ${highlight ? "bg-[#f6f1e7]" : "bg-[#fffdf8]"}`}>
      <h2 className="text-xs uppercase tracking-[0.16em] text-[#8c6a2f]">{title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-[#1a1814]">{children}</p>
    </section>
  );
}

function adviceFor(
  path: string,
  emphasis: string,
  week: number,
  confidence: number,
  cut: Cut,
) {
  if (confidence > 0 && confidence <= 2) {
    return "Confidence is 1 or 2. Redo this row before you take a new pattern. The stretch column can wait.";
  }
  if (path === "general" && emphasis === "AI") {
    return cut === "60"
      ? "General SDE-2 path: this AI block is literacy. The 60-minute cut is enough, then stop."
      : "General SDE-2 path: do the 60-minute cut of the AI work, then spend the rest on a second problem from this pattern.";
  }
  if (path === "ai_eng" && week >= 9 && emphasis === "Coding") {
    return "Applied AI path, after the coding core: one timed problem, then back to the build. Do not open a new pattern guide.";
  }
  if (path === "ai_sde" && cut === "60") {
    return "AI-product path on a short day: keep one timed problem and the drill. Leave the stretch.";
  }
  if (cut === "60") return "Short day. Do only the 60-minute cut and mark the row Light.";
  if (cut === "180") return "Deep day. Finish the written row, then the stretch. Do not add a topic from outside this row.";
  return "Standard day. Finish both blocks and the review note. That is the whole assignment.";
}
