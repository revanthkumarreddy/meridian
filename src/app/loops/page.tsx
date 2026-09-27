"use client";

import { useState } from "react";
import { curriculum } from "@/lib/curriculum";

export default function LoopsPage() {
  const [active, setActive] = useState(curriculum.companies[0].company);
  const company = curriculum.companies.find((item) => item.company === active) ?? curriculum.companies[0];

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-[#8c6a2f]">Company loops</p>
      <h1 className="mt-2 max-w-3xl text-4xl text-[#1e2a32] md:text-5xl">
        Same skills, different weights.
      </h1>
      <p className="mt-3 max-w-2xl text-[#5e584e]">
        Google L4, Meta E4, Amazon L5, and Microsoft 62 are the usual SDE-2 neighborhood. Loops
        change. Ask your recruiter what yours contains the week you schedule it, and write that
        answer in the application tracker.
      </p>
      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
        {curriculum.companies.map((item) => (
          <button
            key={item.company}
            type="button"
            onClick={() => setActive(item.company)}
            className={`shrink-0 rounded-full px-3 py-1 text-sm ${
              item.company === company.company ? "bg-[#1e2a32] text-white" : "bg-white"
            }`}
          >
            {item.company}
          </button>
        ))}
      </div>
      <article className="mt-2 rounded-[28px] border border-[#e4d9c8] bg-white p-6 md:p-8">
        <h2 className="text-4xl text-[#1e2a32]">{company.company}</h2>
        <div className="mt-6 grid gap-4">
          <Row label="Level" body={company.level} />
          <Row label="Loop" body={company.loop} />
          <Row label="Coding" body={company.coding} />
          <Row label="Design" body={company.design} />
          <Row label="Behavioral" body={company.behavior} />
          <Row label="AI angle" body={company.ai} />
          <Row label="Surprise" body={company.surprise} />
          <Row label="Bias your prep" body={company.delta} />
        </div>
      </article>
    </div>
  );
}

function Row({ label, body }: { label: string; body: string }) {
  return (
    <div className="grid gap-1 border-b border-[#efe8dc] pb-4 md:grid-cols-[140px_1fr]">
      <h3 className="text-xs uppercase tracking-[0.16em] text-[#c56a12]">{label}</h3>
      <p className="text-sm leading-relaxed">{body}</p>
    </div>
  );
}
