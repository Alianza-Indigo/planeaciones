-- Perfil fijo del docente (identidad + nivel/grado) con contador de cambios.
CREATE TABLE "TeacherProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "escuela" TEXT NOT NULL,
    "nivel" TEXT NOT NULL,
    "grado" TEXT NOT NULL,
    "editCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TeacherProfile_userId_key" ON "TeacherProfile"("userId");

ALTER TABLE "TeacherProfile" ADD CONSTRAINT "TeacherProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
