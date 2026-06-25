import type { Metadata } from "next";

import { TeacherDashboard } from "@/components/teacher-dashboard";

export const metadata: Metadata = {
  title: "Generación — ADIA",
};

export default function PlannerPage() {
  return <TeacherDashboard />;
}
