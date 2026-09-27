"use client";

import { curriculum } from "@/lib/curriculum";
import { useDesk, type DayLog } from "@/components/progress-provider";

const STATUSES: DayLog["status"][] = ["Not started", "In progress", "Done", "Redo"];

export default function StoriesPage() {
  const desk = useDesk();
  const drafted = curriculum.stories.filter((story) => {
    const log = desk.stories[story.id];
    return log && (log.action || log.result);
  }).length;

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-[#8c6a2f]">Story bank</p>
      <h1 className="mt-2 max-w-3xl text-4xl text-[#1e2a32] md:text-5xl">
        Ten true stories. {drafted} have an action or a result so far.
      </h1>
      <p className="mt-3 max-w-2xl text-[#5e584e]">
        Two minutes: a short situation, the decision you made, a concrete result, one lesson.
        SDE-2 listeners are listening for scope beyond a ticket you were handed. Do not invent an
        employer, a metric, or an incident. These notes stay in this browser. The workbook has the
        same prompts if you want them on paper.
      </p>
      <div className="mt-6 space-y-4">
        {curriculum.stories.map((story) => {
          const log = desk.stories[story.id];
          return (
            <article key={story.id} className="rounded-[28px] border border-[#e4d9c8] bg-white p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-2xl text-[#1e2a32]">
                  {story.id}. {story.prompt}
                </h2>
              </div>
              <p className="mt-1 text-sm text-[#5e584e]">{story.signal}</p>
              <p className="text-sm text-[#8c6a2f]">{story.themes}</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {(["situation", "task", "action", "result", "lesson"] as const).map((field) => (
                  <label key={field} className="text-sm capitalize">
                    {field}
                    <textarea
                      value={log?.[field] ?? ""}
                      onChange={(e) => desk.setStory(story.id, { [field]: e.target.value })}
                      rows={3}
                      className="mt-1 w-full rounded-2xl border border-[#e4d9c8] px-3 py-2 font-sans normal-case"
                    />
                  </label>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {STATUSES.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => desk.setStory(story.id, { status })}
                    className={`rounded-full px-3 py-1 text-sm ${
                      (log?.status ?? "Not started") === status ? "bg-[#1e2a32] text-white" : "bg-[#f6f1e7]"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </article>
          );
        })}
      </div>
      <button
        type="button"
        onClick={desk.exportProgress}
        className="mt-6 text-sm font-medium text-[#c56a12]"
      >
        Download progress JSON
      </button>
    </div>
  );
}
