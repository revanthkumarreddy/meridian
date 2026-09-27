"use client";

import { useMemo, useState } from "react";
import { curriculum, tone } from "@/lib/curriculum";
import { useDesk, type DayLog } from "@/components/progress-provider";

const STATUSES: DayLog["status"][] = ["Not started", "In progress", "Done", "Redo"];

export default function LibraryPage() {
  const desk = useDesk();
  const tracks = ["All", ...Array.from(new Set(curriculum.topics.map((topic) => topic.track)))];
  const [track, setTrack] = useState("All");
  const [depth, setDepth] = useState("All");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<number | null>(null);

  const topics = useMemo(() => {
    return curriculum.topics.filter((topic) => {
      if (track !== "All" && topic.track !== track) return false;
      if (depth !== "All" && topic.depth !== depth) return false;
      if (query) {
        const blob = `${topic.topic} ${topic.subtopic} ${topic.why}`.toLowerCase();
        if (!blob.includes(query.toLowerCase())) return false;
      }
      return true;
    });
  }, [track, depth, query]);

  const must = curriculum.topics.filter((topic) => topic.depth === "Must").length;

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-[#0f6e6b]">Topic library</p>
      <h1 className="mt-2 max-w-3xl text-4xl text-[#1e2a32] md:text-5xl">
        {curriculum.topics.length} topics. {must} of them are the bar for this cycle.
      </h1>
      <p className="mt-3 max-w-2xl text-[#5e584e]">
        Must is what an SDE-2 loop can reasonably ask. Should is the next pass after mocks are
        clean. Stretch is a definition you can give, not a new project in the last week. The AI
        lane includes RAG, embeddings, vector indexes, LangChain, LangGraph, evals, and the
        production judgment people forget.
      </p>
      <div className="mt-5 flex flex-col gap-3 md:flex-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search topics"
          className="h-10 flex-1 rounded-2xl border border-[#e4d9c8] bg-white px-3 text-sm"
        />
        <select
          value={depth}
          onChange={(e) => setDepth(e.target.value)}
          className="h-10 rounded-2xl border border-[#e4d9c8] bg-white px-3 text-sm"
        >
          {["All", "Must", "Should", "Stretch"].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto">
        {tracks.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTrack(item)}
            className={`shrink-0 rounded-full px-3 py-1 text-sm ${
              track === item ? "bg-[#1e2a32] text-white" : "bg-white"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm text-[#5e584e]">{topics.length} shown</p>
      <ul className="mt-2 space-y-2">
        {topics.map((topic) => {
          const log = desk.topics[String(topic.id)];
          const expanded = open === topic.id;
          return (
            <li key={topic.id} className="rounded-3xl border border-[#e4d9c8] bg-white">
              <button
                type="button"
                className="flex w-full items-start gap-3 px-4 py-3 text-left"
                onClick={() => setOpen(expanded ? null : topic.id)}
              >
                <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[11px] ${tone(topic.track)}`}>
                  {topic.track}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{topic.subtopic}</span>
                  <span className="text-sm text-[#5e584e]">
                    {topic.topic} · week {topic.week} · {topic.depth} · {topic.hours}h
                  </span>
                </span>
                <span className="text-xs text-[#8c6a2f]">{log?.status ?? "Not started"}</span>
              </button>
              {expanded && (
                <div className="grid gap-3 border-t border-[#e4d9c8] px-4 py-4 text-sm md:grid-cols-2">
                  <Field label="Why it matters" body={topic.why} />
                  <Field label="What good looks like" body={topic.good} />
                  <Field label="Practice" body={topic.practice} />
                  <Field label="Common miss" body={topic.mistakes} />
                  <Field label="Resources" body={topic.resources} />
                  <Field label="Companies and paths" body={`${topic.companies}. Paths: ${topic.paths}. Needs: ${topic.prereq}.`} />
                  <div className="md:col-span-2 flex flex-wrap gap-2">
                    {STATUSES.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => desk.setTopic(topic.id, { status })}
                        className={`rounded-full px-3 py-1 ${
                          (log?.status ?? "Not started") === status ? "bg-[#0f6e6b] text-white" : "bg-[#f6f1e7]"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Field({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <h2 className="text-xs uppercase tracking-[0.14em] text-[#8c6a2f]">{label}</h2>
      <p className="mt-1 leading-relaxed">{body}</p>
    </div>
  );
}
