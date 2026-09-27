import { Suspense } from "react";
import { Planner } from "@/components/planner";

export default function PlanPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[#5e584e]">Opening the daily desk…</p>}>
      <Planner />
    </Suspense>
  );
}
