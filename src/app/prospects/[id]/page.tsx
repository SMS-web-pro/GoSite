import { notFound } from "next/navigation";
import { db } from "@/db";
import { prospects, businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import ProspectClient from "./ProspectClient";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function ProspectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const prospectId = parseInt(id, 10);
  if (Number.isNaN(prospectId)) notFound();

  let row;
  try {
    row = await db
      .select({ prospect: prospects, business: businesses })
      .from(prospects)
      .innerJoin(businesses, eq(prospects.businessId, businesses.id))
      .where(eq(prospects.id, prospectId))
      .limit(1)
      .then((res) => res[0]);
  } catch {
    row = null;
  }

  if (!row) notFound();

  const settings = await getSettings();
  return <ProspectClient prospect={row.prospect as any} business={row.business} settings={settings} />;
}
