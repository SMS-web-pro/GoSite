import { notFound } from "next/navigation";
import { db } from "@/db";
import { prospects, businesses } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function DemoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [row] = await db
    .select({ prospect: prospects, business: businesses })
    .from(prospects)
    .innerJoin(businesses, eq(prospects.businessId, businesses.id))
    .where(eq(prospects.demoToken, token))
    .limit(1);
  if (!row || !row.prospect.demoHtml) {
    notFound();
  }
  // Serve the raw HTML
  return (
    <div
      style={{ margin: 0, padding: 0 }}
      dangerouslySetInnerHTML={{ __html: row.prospect.demoHtml }}
    />
  );
}
