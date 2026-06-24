import { PrismaClient } from "@prisma/client";

import { defaultPlanningPromptTemplate } from "../lib/generation/build-planning-prompt";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.promptTemplate.findFirst({
    where: { kind: "PLANNING", isActive: true },
  });

  if (existing) {
    return;
  }

  await prisma.promptTemplate.create({
    data: {
      kind: "PLANNING",
      name: "Prompt maestro inicial",
      version: 1,
      body: defaultPlanningPromptTemplate,
      notes: "Migrado desde la logica de adia_generate.php como version inicial editable.",
      isActive: true,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
