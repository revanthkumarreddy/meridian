import { curriculum, dayNumberFromStart, type DayRecord } from "@/lib/curriculum";
import type { UserId } from "@/lib/users";
import { userName } from "@/lib/users";

export type CoachAction = {
  label: string;
  status: "Light" | "Done" | "Redo";
};

export type CoachReply = {
  text: string;
  link?: { href: string; label: string };
  action?: CoachAction;
  quizAnswer?: string;
};

type CoachContext = {
  user: UserId;
  pathName: string;
  start: string;
  doneDays: number;
  lastQuizAnswer?: string;
};

const STOP = new Set([
  "the", "and", "for", "with", "that", "this", "what", "how", "when", "your", "you",
  "are", "can", "about", "from", "have", "only", "into", "does", "did", "why", "who",
  "which", "should", "today", "please", "tell", "explain", "difference", "between",
  "meridian", "study", "studying",
]);

function tokens(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9+ ]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP.has(token));
}

function overlap(query: string[], text: string) {
  const hay = tokens(text);
  const set = new Set(hay);
  let score = 0;
  for (const token of query) {
    if (set.has(token)) score += 2;
    else if (hay.some((item) => item.startsWith(token) || token.startsWith(item))) score += 1;
  }
  return score;
}

function todayDay(start: string): DayRecord | null {
  const number = dayNumberFromStart(start);
  if (!number || number < 1 || number > curriculum.days.length) return null;
  return curriculum.days[number - 1];
}

function dayLink(day: DayRecord) {
  return { href: `/plan?day=${day.day}`, label: `Open day ${day.day}` };
}

export function answerDoubt(question: string, ctx: CoachContext): CoachReply {
  const name = userName(ctx.user);
  const text = question.trim();
  const lower = text.toLowerCase();
  const today = todayDay(ctx.start);

  if (!text) {
    return { text: `${name}, ask about today's row, a topic, a company loop, or say "quiz me".` };
  }

  if (/\b(reveal|show the answer|answer please)\b/.test(lower) && ctx.lastQuizAnswer) {
    return { text: ctx.lastQuizAnswer };
  }

  if (/\bmark\b/.test(lower) && today) {
    const status = /\bredo\b/.test(lower) ? "Redo" : /\blight\b|\b60\b|\bshort\b/.test(lower) ? "Light" : "Done";
    return {
      text: `${name}, I can mark day ${today.day} (${today.theme}) as ${status}. That only changes your desk on this browser.`,
      action: { label: `Mark day ${today.day} ${status}`, status },
      link: dayLink(today),
    };
  }

  if (/\bquiz\b|\btest me\b|\bask me\b/.test(lower)) {
    return quiz(name, today);
  }

  if (/\b60\b|\bone hour\b|\bshort on time\b|\bonly have an hour\b|\bminutes\b/.test(lower)) {
    if (!today) {
      return {
        text: `${name}, set a start date on the desk first. On a short day the rule is fixed: do the 60-minute cut and mark the row Light. Do not open a new pattern.`,
        link: { href: "/plan", label: "Set the date on Today" },
      };
    }
    return {
      text: `${name}, you have a short day. Week ${today.week}, ${today.theme}. Do this and stop: ${today.min60} Mark it Light if that was a choice, not a stall.`,
      link: dayLink(today),
      action: { label: "Mark today Light", status: "Light" },
    };
  }

  if (/\btoday\b|\bwhat should i\b|\bwhere do i start\b|\bthis day\b/.test(lower)) {
    if (!ctx.start) {
      return {
        text: `${name}, pick your start Monday on the desk. Until then, open Week 0 only if your interview language is not fluent. Otherwise start at Week 1, day 1: hash maps, and write the six sentences on what a language model is not.`,
        link: { href: "/plan?day=8", label: "Open day 1 of the core plan" },
      };
    }
    const number = dayNumberFromStart(ctx.start);
    if (number !== null && number < 1) {
      return { text: `${name}, your start date is still ahead. Rest. The first row opens on that day.` };
    }
    if (!today) {
      return {
        text: `${name}, you are past the last row. Stop adding topics. Use the five-gap list from week 16 and the application tracker in the workbook.`,
        link: { href: "/map", label: "Open week 16" },
      };
    }
    return {
      text: `${name}, this is day ${today.day} of your ${ctx.pathName} plan (${ctx.doneDays} days marked done). ${today.weekday}, week ${today.week}: ${today.theme}. Pattern: ${today.pattern}. Two-hour version: ${today.coding} Then: ${today.second}`,
      link: dayLink(today),
    };
  }

  const company = findCompany(lower);
  if (company) {
    return {
      text: `${company.company}. ${company.level} Coding: ${company.coding} Design: ${company.design} Behavioral: ${company.behavior} AI angle: ${company.ai} What surprises people: ${company.surprise} Bias your prep: ${company.delta}`,
      link: { href: "/loops", label: `Open ${company.company}` },
    };
  }

  const query = tokens(lower);
  if (query.length === 0) {
    return {
      text: `${name}, try a topic name, a company, or "what should I do today". I answer from this plan, not from a live model, so the desk keeps working without a server.`,
    };
  }

  const topicHits = curriculum.topics
    .map((topic) => ({
      topic,
      score: overlap(query, `${topic.topic} ${topic.subtopic} ${topic.why} ${topic.good} ${topic.mistakes}`),
    }))
    .sort((a, b) => b.score - a.score);
  const dayHits = curriculum.days
    .map((day) => ({
      day,
      score: overlap(query, `${day.theme} ${day.pattern} ${day.concept} ${day.second} ${day.coding}`),
    }))
    .sort((a, b) => b.score - a.score);
  const cheatHits = curriculum.cheats
    .map((cheat) => ({ cheat, score: overlap(query, `${cheat.title} ${cheat.body}`) }))
    .sort((a, b) => b.score - a.score);

  const bestTopic = topicHits[0];
  const bestDay = dayHits[0];
  const bestCheat = cheatHits[0];
  const best = Math.max(bestTopic?.score ?? 0, bestDay?.score ?? 0, bestCheat?.score ?? 0);

  if (best < 2) {
    return {
      text: `${name}, I don't have a plan entry that matches that closely. Ask with a topic from the library, such as sliding window, RAG, LangGraph, embeddings, or a company name. For a live coding hint, say the pattern, not only the problem title.`,
      link: { href: "/library", label: "Browse the library" },
    };
  }

  if ((bestCheat?.score ?? 0) >= best && bestCheat.score >= (bestTopic?.score ?? 0)) {
    return {
      text: `${bestCheat.cheat.title}. ${bestCheat.cheat.body}`,
      link: { href: "/cheats", label: "Open cheat sheets" },
    };
  }

  if ((bestDay?.score ?? 0) > (bestTopic?.score ?? 0)) {
    const day = bestDay.day;
    return {
      text: `That sits on day ${day.day}, week ${day.week}: ${day.theme}. ${day.coding} Concept: ${day.concept}. If time is short: ${day.min60}`,
      link: dayLink(day),
    };
  }

  const topic = bestTopic.topic;
  const sibling = topicHits.find((hit, index) => index > 0 && hit.score >= 2);
  const extra = sibling
    ? ` Related: ${sibling.topic.subtopic} — ${sibling.topic.good}`
    : "";
  return {
    text: `${topic.subtopic} (${topic.topic}, week ${topic.week}, ${topic.depth}). Why it matters: ${topic.why} What good looks like: ${topic.good} The usual miss: ${topic.mistakes} Practice: ${topic.practice}.${extra}`,
    link: { href: "/library", label: "Open the library" },
  };
}

const COMPANY_WORDS: { name: string; words: string[] }[] = [
  { name: "Google", words: ["google"] },
  { name: "Meta", words: ["meta", "facebook"] },
  { name: "Amazon", words: ["amazon"] },
  { name: "Microsoft", words: ["microsoft"] },
  { name: "Apple", words: ["apple"] },
  { name: "Netflix", words: ["netflix"] },
  { name: "Uber", words: ["uber"] },
  { name: "Stripe", words: ["stripe"] },
  { name: "Airbnb", words: ["airbnb"] },
  { name: "AI labs and research-heavy product teams", words: ["openai", "anthropic", "labs"] },
];

function findCompany(lower: string) {
  const hit = COMPANY_WORDS.find((item) => item.words.some((word) => new RegExp(`\\b${word}\\b`).test(lower)));
  return curriculum.companies.find((company) => company.company === hit?.name);
}

function quiz(name: string, today: DayRecord | null): CoachReply {
  const pool = curriculum.topics.filter((topic) => {
    if (today) return topic.week === today.week && topic.depth === "Must";
    return topic.depth === "Must";
  });
  const topic = pool[Math.floor(Math.random() * pool.length)] ?? curriculum.topics[0];
  return {
    text: `${name}, quiz from ${today ? `week ${today.week}` : "the must-know list"}. In two minutes, out loud: what does "${topic.subtopic}" mean, and what is the usual way people get it wrong? Say "reveal" when you want the plan's answer.`,
    quizAnswer: `${topic.subtopic}. ${topic.good} Usual miss: ${topic.mistakes}`,
    link: { href: `/plan?day=${today?.day ?? 8}`, label: "Back to the row" },
  };
}
