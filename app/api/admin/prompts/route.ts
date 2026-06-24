import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/require-admin";
import { prisma } from "@/lib/db";
import { defaultPlanningPromptTemplate } from "@/lib/generation/build-planning-prompt";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const prompts = await prisma.promptTemplate.findMany({
    orderBy: [{ kind: "asc" }, { version: "desc" }],
  });

  return NextResponse.json(prompts);
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const body = (await request.json()) as {
    name?: string;
    body?: string;
    notes?: string;
  };

  const latest = await prisma.promptTemplate.findFirst({
    where: { kind: "PLANNING" },
    orderBy: { version: "desc" },
  });

  const prompt = await prisma.promptTemplate.create({
    data: {
      kind: "PLANNING",
      name: body.name || "Prompt de planeacion",
      body: body.body || defaultPlanningPromptTemplate,
      notes: body.notes,
      version: (latest?.version ?? 0) + 1,
      createdById: auth.session!.user.id,
    },
  });

  return NextResponse.json(prompt, { status: 201 });
}
