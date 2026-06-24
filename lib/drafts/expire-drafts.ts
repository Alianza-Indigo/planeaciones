import { prisma } from "@/lib/db";

export function deleteExpiredDrafts() {
  return prisma.planningDraft.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
}
