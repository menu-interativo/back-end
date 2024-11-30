-- AlterTable
ALTER TABLE "tables" ADD COLUMN     "waiter_id" TEXT;

-- AddForeignKey
ALTER TABLE "tables" ADD CONSTRAINT "tables_waiter_id_fkey" FOREIGN KEY ("waiter_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
