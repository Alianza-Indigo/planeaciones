import curriculum from "@/data/con-plan.json";
import type { CurriculumCatalog } from "@/lib/curriculum/types";

export function loadCurriculumCatalog(): CurriculumCatalog {
  return curriculum as unknown as CurriculumCatalog;
}
