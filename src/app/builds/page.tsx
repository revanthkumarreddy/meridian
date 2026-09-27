"use client";

import { curriculum } from "@/lib/curriculum";
import { useDesk, type DayLog } from "@/components/progress-provider";

const STATUSES: DayLog["status"][] = ["Not started", "In progress", "Done", "Redo"];

export default function BuildsPage() {
  const desk = useDesk();
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-[#0f6e6b]">AI builds</p>
      <h1 className="mt-2 max-w-3xl text-4xl text-[#1e2a32] md:text-5xl">
        Four artifacts. Notes without a run do not count.
      </h1>
      <p className="mt-3 max-w-2xl text-[#5e584e]">
        Search, then RAG, then a tool graph, then a production pass. Each week extends the last
        repo. If you have no model key, use a local embedding model or a documented bag-of-words
        fallback and keep the eval. The metric is the interview.
      </p>
      <ol className="mt-6 space-y-4">
        {curriculum.projects.map((project, index) => {
          const status = desk.projects[project.name] ?? "Not started";
          return (
            <li key={project.name} className="rounded-[28px] border border-[#e4d9c8] bg-white p-6">
              <p className="text-xs uppercase tracking-[0.16em] text-[#0f6e6b]">
                0{index + 1} · week {project.week}
              </p>
              <h2 className="mt-1 text-3xl text-[#1e2a32]">{project.name}</h2>
              <p className="mt-3 text-sm leading-relaxed">{project.outcome}</p>
              <p className="mt-2 text-sm leading-relaxed text-[#5e584e]">
                <span className="font-medium text-[#1a1814]">Done when. </span>
                {project.done_when}
              </p>
              <p className="mt-2 text-sm leading-relaxed">{project.steps}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {STATUSES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => desk.setProject(project.name, item)}
                    className={`rounded-full px-3 py-1 text-sm ${
                      status === item ? "bg-[#0f6e6b] text-white" : "bg-[#f6f1e7]"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
