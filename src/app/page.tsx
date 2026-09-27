"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { curriculum, dayNumberFromStart, PATHS, tone } from "@/lib/curriculum";
import { publicFile } from "@/lib/public-path";
import { useDesk } from "@/components/progress-provider";

export default function HomePage() {
  const desk = useDesk();
  const path = curriculum.paths.find((item) => item.id === desk.path) ?? curriculum.paths[1];
  const dayNumber = dayNumberFromStart(desk.start);
  const today =
    dayNumber && dayNumber >= 1 && dayNumber <= curriculum.days.length
      ? curriculum.days[dayNumber - 1]
      : null;
  const done = Object.values(desk.days).filter((d) => d.status === "Done").length;
  const light = Object.values(desk.days).filter((d) => d.status === "Light").length;
  const currentWeek = today?.week ?? 1;

  return (
    <div className="space-y-10">
      <section className="grid gap-8 border-b border-[#e4d9c8] pb-10 md:grid-cols-[1.4fr_0.8fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#c56a12]">
            {desk.userName}&apos;s desk
          </p>
          <h1 className="mt-3 max-w-xl text-5xl leading-[0.95] text-[#1e2a32] md:text-6xl">
            Prepare for SDE-2, and learn the AI you will be asked to ship.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#3c3832]">
            Sixteen weeks from a blank language on-ramp to mocks. Coding, system design, and
            stories for Google L4 and the neighboring ladders, plus embeddings, RAG, vector
            search, LangChain, and LangGraph with something you can demo.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="h-10 rounded-full px-4">
              <Link href="/plan">Open today&apos;s row</Link>
            </Button>
            <Button asChild variant="outline" className="h-10 rounded-full bg-white px-4">
              <a href={publicFile("/Meridian-SDE2-AI-Roadmap.xlsx")}>Download the workbook</a>
            </Button>
          </div>
        </div>
        <aside className="relative overflow-hidden rounded-3xl bg-[#1e2a32] p-6 text-[#f6f1e7]">
          <p className="text-xs uppercase tracking-[0.18em] text-[#e7b56a]">Your path</p>
          <h2 className="mt-2 text-3xl">{path.name}</h2>
          <p className="mt-3 text-sm leading-relaxed text-[#e7e1d6]">{path.daily_rule}</p>
          <dl className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-white/10 px-2 py-3">
              <dt className="text-[10px] uppercase tracking-wider text-[#e7b56a]">Done</dt>
              <dd className="font-heading text-2xl">{done}</dd>
            </div>
            <div className="rounded-2xl bg-white/10 px-2 py-3">
              <dt className="text-[10px] uppercase tracking-wider text-[#e7b56a]">Light</dt>
              <dd className="font-heading text-2xl">{light}</dd>
            </div>
            <div className="rounded-2xl bg-white/10 px-2 py-3">
              <dt className="text-[10px] uppercase tracking-wider text-[#e7b56a]">Week</dt>
              <dd className="font-heading text-2xl">{desk.start ? currentWeek : "—"}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs leading-relaxed text-[#cfc6b8]">{curriculum.meta.level_note}</p>
        </aside>
      </section>

      <section className="grid gap-4 md:grid-cols-[220px_1fr]">
        <div>
          <h2 className="text-2xl text-[#1e2a32]">Start date</h2>
          <p className="mt-1 text-sm text-[#5e584e]">A Monday works best. Week 0 is optional.</p>
        </div>
        <div className="rounded-3xl border border-[#e4d9c8] bg-white p-5">
          <label htmlFor="start" className="text-sm font-medium">
            First day of the plan
          </label>
          <input
            id="start"
            type="date"
            value={desk.start}
            onChange={(e) => desk.setStart(e.target.value)}
            className="mt-2 h-10 rounded-xl border border-[#e4d9c8] bg-[#fffdf8] px-3"
          />
          {today ? (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[#0f6e6b]">
                Day {today.day} · Week {today.week} · {today.weekday}
              </p>
              <p className="mt-1 font-heading text-2xl text-[#1e2a32]">{today.theme}</p>
              <p className="mt-2 text-sm text-[#3c3832]">{today.min60}</p>
              <Link href="/plan" className="mt-3 inline-block text-sm font-medium text-[#c56a12]">
                Decide the cut →
              </Link>
            </div>
          ) : (
            <p className="mt-4 text-sm text-[#5e584e]">
              {dayNumber !== null && dayNumber < 1
                ? "That date is still ahead. The desk will open on day 1."
                : dayNumber !== null && dayNumber > curriculum.days.length
                  ? "You are past the last row. Use the gap list from week 16 and the application tracker."
                  : "Set a date and the desk will point at one row."}
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-2xl text-[#1e2a32]">Three ways to weight the same days</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {curriculum.paths.map((item) => {
            const active = item.id === desk.path;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => desk.setPath(item.id as (typeof PATHS)[number]["id"])}
                className={`rounded-3xl border p-5 text-left ${
                  active ? "border-[#1e2a32] bg-[#1e2a32] text-[#f6f1e7]" : "border-[#e4d9c8] bg-white"
                }`}
              >
                <p className={`text-xs uppercase tracking-[0.16em] ${active ? "text-[#e7b56a]" : "text-[#c56a12]"}`}>
                  {active ? "Selected" : "Switch"}
                </p>
                <h3 className="mt-2 font-heading text-2xl">{item.name}</h3>
                <p className={`mt-3 text-sm leading-relaxed ${active ? "text-[#e7e1d6]" : "text-[#3c3832]"}`}>
                  {item.for}
                </p>
                <p className={`mt-3 text-sm leading-relaxed ${active ? "text-[#cfc6b8]" : "text-[#5e584e]"}`}>
                  {item.weekly_shape}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-2xl text-[#1e2a32]">What the sixteen weeks cover</h2>
          <ol className="mt-4 space-y-2">
            {curriculum.weeks.map((week) => (
              <li key={week.week} className="flex gap-3 rounded-2xl bg-white px-3 py-2">
                <span className="w-8 shrink-0 font-heading text-lg text-[#c56a12]">{week.week}</span>
                <span>
                  <span className={`mr-2 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${tone(week.phase.includes("AI") ? "AI" : week.phase.includes("design") ? "Design" : "DSA")}`}>
                    {week.phase}
                  </span>
                  <span className="text-sm">{week.title}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl text-[#1e2a32]">How a day is decided</h2>
          <div className="rounded-3xl border border-[#e4d9c8] bg-[#fffdf8] p-5 text-sm leading-relaxed">
            <p>If you have an hour, do the 60-minute cut and mark the day Light.</p>
            <p className="mt-3">If you have two hours, do the row as written.</p>
            <p className="mt-3">If you have three, add the stretch column. Do not invent a new topic.</p>
            <p className="mt-3">
              If yesterday is unfinished, finish yesterday&apos;s 60-minute cut before a new pattern.
              Confidence 1 or 2 means the next session is a redo.
            </p>
            <p className="mt-3">Sunday is review and stories. The plan already includes rest.</p>
          </div>
          <div className="rounded-3xl bg-[#0f6e6b] p-5 text-[#f4fffd]">
            <h3 className="font-heading text-2xl">The workbook</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#d7efec]">
              Eleven sheets: start page with a live day lookup, paths, roadmap, 119-day plan,
              topic library, company loops, AI builds, cheat sheets, story bank, Sunday review
              formulas, and an application tracker. Status cells are dropdowns.
            </p>
            <Button asChild variant="secondary" className="mt-4 h-10 rounded-full px-4">
              <a href={publicFile("/Meridian-SDE2-AI-Roadmap.xlsx")}>Meridian-SDE2-AI-Roadmap.xlsx</a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
