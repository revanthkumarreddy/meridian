"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { answerDoubt } from "@/lib/coach";
import { curriculum, dayNumberFromStart } from "@/lib/curriculum";
import { useDesk } from "@/components/progress-provider";

const PROMPTS = [
  "What should I do today?",
  "I only have 60 minutes",
  "Explain RAG abstention",
  "How does Amazon's loop differ?",
  "What is a bi-encoder?",
  "Quiz me",
];

export default function ChatPage() {
  const desk = useDesk();
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const path = curriculum.paths.find((item) => item.id === desk.path);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [desk.messages.length]);

  function send(text: string) {
    const question = text.trim();
    if (!question) return;
    const lastQuiz = [...desk.messages].reverse().find((message) => message.quizAnswer)?.quizAnswer;
    const doneDays = Object.values(desk.days).filter((day) => day.status === "Done").length;
    const reply = answerDoubt(question, {
      user: desk.user,
      pathName: path?.name ?? "SDE-2",
      start: desk.start,
      doneDays,
      lastQuizAnswer: lastQuiz,
    });
    desk.addMessage({ role: "user", text: question });
    desk.addMessage({ role: "coach", ...reply });
    setDraft("");
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    send(draft);
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col">
      <p className="text-xs uppercase tracking-[0.18em] text-[#0f6e6b]">Doubts · {desk.userName}</p>
      <h1 className="mt-2 text-4xl text-[#1e2a32] md:text-5xl">Ask the plan, then go do the row.</h1>
      <p className="mt-3 text-sm leading-relaxed text-[#5e584e]">
        {desk.userName}&apos;s chat stays on this browser, separate from the other desk. The coach
        answers from the SDE-2 plan: today&apos;s row, topics, company loops, and cheat sheets. It
        does not call an outside model, so the page still works when it is hosted as a static site.
      </p>

      <div className="mt-6 flex min-h-[50vh] flex-col rounded-[28px] border border-[#e4d9c8] bg-white">
        <div className="flex-1 space-y-4 px-4 py-5 md:px-6">
          {desk.messages.length === 0 && (
            <div className="rounded-2xl bg-[#f6f1e7] px-4 py-3 text-sm leading-relaxed">
              {desk.userName}, start with a doubt you actually have. A good one is specific: a
              pattern, a company, or the amount of time you have tonight.
            </div>
          )}
          {desk.messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={message.role === "user" ? "flex justify-end" : ""}>
              <div
                className={`max-w-[40rem] rounded-3xl px-4 py-3 text-sm leading-relaxed ${
                  message.role === "user" ? "bg-[#1e2a32] text-[#f6f1e7]" : "bg-[#e5f2f0] text-[#1a1814]"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>
                {message.link && (
                  <Link href={message.link.href} className="mt-2 inline-block font-medium text-[#c56a12]">
                    {message.link.label} →
                  </Link>
                )}
                {message.action && (
                  <button
                    type="button"
                    className="mt-3 rounded-full bg-[#1e2a32] px-3 py-1 text-xs text-white"
                    onClick={() => {
                      const number = dayNumberFromStart(desk.start);
                      if (number) desk.setDay(number, { status: message.action!.status });
                    }}
                  >
                    {message.action.label}
                  </button>
                )}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="border-t border-[#e4d9c8] px-4 py-3 md:px-6">
          <div className="mb-3 flex gap-2 overflow-x-auto">
            {PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => send(prompt)}
                className="shrink-0 rounded-full bg-[#f6f1e7] px-3 py-1 text-xs text-[#1e2a32]"
              >
                {prompt}
              </button>
            ))}
          </div>
          <form onSubmit={onSubmit} className="flex gap-2">
            <label className="sr-only" htmlFor="doubt">
              Doubt
            </label>
            <input
              id="doubt"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={`Ask as ${desk.userName}`}
              className="h-11 flex-1 rounded-full border border-[#e4d9c8] px-4 text-sm"
            />
            <button type="submit" className="h-11 rounded-full bg-[#0f6e6b] px-4 text-sm text-white">
              Send
            </button>
          </form>
          {desk.messages.length > 0 && (
            <button type="button" onClick={desk.clearMessages} className="mt-2 text-xs text-[#5e584e]">
              Clear this chat
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

