"use client";

import { curriculum } from "@/lib/curriculum";

export default function CheatsPage() {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-[#2f6b4f]">Cheat sheets</p>
      <h1 className="mt-2 max-w-3xl text-4xl text-[#1e2a32] md:text-5xl">
        Speak them. A sheet you have not said out loud is still a document.
      </h1>
      <div className="mt-6 space-y-4">
        {curriculum.cheats.map((cheat) => (
          <article key={cheat.title} className="rounded-[28px] border border-[#e4d9c8] bg-white p-6">
            <h2 className="text-2xl text-[#1e2a32]">{cheat.title}</h2>
            <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-[#1a1814]">
              {cheat.body}
            </pre>
          </article>
        ))}
        <article className="rounded-[28px] bg-[#1e2a32] p-6 text-[#f6f1e7]">
          <h2 className="text-2xl">Rules of the desk</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[#e7e1d6]">
            {curriculum.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ol>
        </article>
      </div>
    </div>
  );
}
