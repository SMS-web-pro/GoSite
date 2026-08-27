-- Make businesses.search_id nullable (search functionality removed)
ALTER TABLE "businesses" ALTER COLUMN "search_id" DROP NOT NULL;
