import { NextResponse } from "next/server";

import { loadCurriculumCatalog } from "@/lib/curriculum/load-curriculum";

export async function GET() {
  return NextResponse.json(loadCurriculumCatalog());
}
