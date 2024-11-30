-- DropForeignKey
ALTER TABLE "customizations" DROP CONSTRAINT "customizations_dish_id_fkey";

-- AlterTable
ALTER TABLE "customizations" ALTER COLUMN "dish_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "customizations" ADD CONSTRAINT "customizations_dish_id_fkey" FOREIGN KEY ("dish_id") REFERENCES "dishes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
