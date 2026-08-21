-- AlterTable
ALTER TABLE "WorkoutDay" ADD COLUMN     "scheduledDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "WorkoutDay_scheduledDate_idx" ON "WorkoutDay"("scheduledDate");
