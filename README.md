# Meridian

A preparation desk for **SDE-2** loops (Google L4 and the neighboring ladders at Meta, Amazon, Microsoft, Apple, Netflix, Uber, Stripe, Airbnb, and AI product teams) and for the applied AI those teams now ask about: embeddings, vector search, RAG, LangChain, LangGraph, evals, and production judgment.

The same curriculum feeds two tools:

- A web desk for choosing what to do today.
- An Excel workbook with dropdowns, a live “today” lookup, and a Sunday review that counts your progress.

This is a study plan, not an offer. Loops, levels, and pay bands change. Confirm the loop with your recruiter.

## Run it

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

The header has a student menu for **Revanth** and **Anjali**. Each name keeps its own start date, path, daily status, stories, and doubt chat in that browser. Switch names and you are on the other desk.

The Doubts page answers from this plan: today's row, the topic library, company loops, and the cheat sheets. It also quizzes you and can mark today Light or Done. It does not call an external model, so the desk still works as a static site.

## Always-on link

GitHub does not keep a Node server running for a normal repository. The always-available form of this desk is a static export on GitHub Pages, at:

`https://revanthkumarreddy.github.io/meridian/`

Pushing `main` to a repository named `meridian` under `revanthkumarreddy` runs `.github/workflows/pages.yml`, which builds with `GITHUB_PAGES=true` and `NEXT_PUBLIC_BASE_PATH=/meridian`. In the repository settings, allow GitHub Actions to deploy to Pages (Settings → Pages → Source: GitHub Actions).

Progress and chat stay in each browser. Two people on two phones do not see each other's notes, because a static site has no shared database. That is what keeps the link up without a paid server.

Download the workbook from the desk, or open `public/Meridian-SDE2-AI-Roadmap.xlsx`.

## How to use the plan

1. Pick a path: general SDE-2, SDE-2 on an AI product team, or applied AI engineer who still has a coding screen.
2. Set a start date. Week 0 is optional and is only for making one interview language fluent.
3. Work one daily row. One hour means the 60-minute cut (mark it Light). Two hours means the row as written. Three hours means the stretch column.
4. From week 7, mocks replace extra problems. From week 12, the AI work is a project with an eval, not another tutorial.
5. Sundays are for review and true stories. Do not add a new pattern on Sunday.

Progress in the web desk stays in this browser. The spreadsheet is edited on its own. You can download a JSON copy of the web progress from the Stories page.

## Workbook sheets

| Sheet | What it is for |
| --- | --- |
| Start Here | How to use the book, a start date, today’s row, a progress bar |
| Paths | How to cut a day for each target |
| Roadmap | Week intent, exit test, and resources |
| Daily Plan | 119 days, status dropdowns, confidence |
| Topic Library | SDE-2 and AI topics, depth, mistakes |
| Company Loops | What each company actually weighs |
| AI Builds | Search, RAG, tool graph, production pass |
| Cheat Sheets | Coding card, design agenda, RAG checklist |
| Story Bank | Ten prompts, blank STAR columns |
| Weekly Review | Counts pulled from the daily plan |
| Applications | Roles you actually contacted |

Regenerate both the JSON and the workbook after curriculum edits:

```bash
npm run curriculum
```

That command needs Python 3 and `openpyxl` (`pip install openpyxl`).
