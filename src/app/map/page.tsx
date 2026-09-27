"use client";

import { useState } from "react";
import Link from "next/link";
import { curriculum, tone } from "@/lib/curriculum";
import { useDesk } from "@/components/progress-provider";

export default function MapPage() {
  const [weekNumber, setWeekNumber] = useState(1);
  const desk = useDesk();
  const week = curriculum.weeks.find((item) => item.week === weekNumber) ?? curriculum.weeks[1];
  const done = week.days.filter((day) => desk.days[String(day.day)]?.status === "Done").length;

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-[#c56a12]">Roadmap</p>
      <h1 className="mt-2 max-w-2xl text-4xl text-[#1e2a32] md:text-5xl">
        Leave the week when the exit line is true.
      </h1>
      <p className="mt-3 max-w-2xl text-[#5e584e]">
        Week 0 is the language on-ramp. Skip it only if you can write hash maps, classes, and
        recursion without a tutorial. The other sixteen weeks are the cycle.
      </p>
      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
        {curriculum.weeks.map((item) => (
          <button
            key={item.week}
            type="button"
            onClick={() => setWeekNumber(item.week)}
            className={`shrink-0 rounded-2xl px-3 py-2 text-left ${
              item.week === week.week ? "bg-[#1e2a32] text-[#f6f1e7]" : "bg-white"
            }`}
          >
            <span className="block font-heading text-lg">W{item.week}</span>
            <span className="block max-w-36 text-xs opacity-80">{item.phase}</span>
          </button>
        ))}
      </div>

      <article className="mt-4 rounded-[28px] border border-[#e4d9c8] bg-white p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs ${tone(week.phase.includes("AI") ? "AI" : "Design")}`}>
            {week.phase}
          </span>
          {week.optional && <span className="rounded-full bg-[#f8e7d2] px-2 py-0.5 text-xs">Optional</span>}
          <span className="text-sm text-[#5e584e]">
            {done}/7 days done · {week.hours} hours
          </span>
        </div>
        <h2 className="mt-3 text-4xl text-[#1e2a32]">{week.title}</h2>
        <p className="mt-4 max-w-3xl leading-relaxed">{week.intent}</p>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <Info label="You can leave when" body={week.exit} />
          <Info label="Rhythm" body={week.rhythm} />
          <Info label="Coding" body={week.dsa} />
          <Info label="Systems" body={week.systems} />
          <Info label="AI" body={week.ai} />
          <Info label="Behavioral" body={week.behavior} />
        </div>
        <p className="mt-4 text-sm leading-relaxed text-[#5e584e]">
          <span className="font-medium text-[#1e2a32]">Resources. </span>
          {week.resources}
        </p>
        <ol className="mt-6 divide-y divide-[#e4d9c8] border-y border-[#e4d9c8]">
          {week.days.map((day) => (
            <li key={day.day} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#8c6a2f]">
                  {day.weekday} · {day.pattern}
                </p>
                <p className="text-[#1e2a32]">{day.theme}</p>
              </div>
              <Link href={`/plan?day=${day.day}`} className="text-sm text-[#c56a12]">
                Open in the daily desk
              </Link>
            </li>
          ))}
        </ol>
      </article>
    </div>
  );
}

function Info({ label, body }: { label: string; body: string }) {
  return (
    <div className="rounded-2xl bg-[#f6f1e7] p-4">
      <h3 className="text-xs uppercase tracking-[0.16em] text-[#8c6a2f]">{label}</h3>
      <p className="mt-1 text-sm leading-relaxed">{body}</p>
    </div>
  );
}
