import { notFound } from "next/navigation";
import { db } from "@/db";
import { prospects, businesses, campaigns } from "@/db/schema";
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
      .select({ prospect: prospects, business: businesses, campaign: campaigns })
      .from(prospects)
      .innerJoin(businesses, eq(prospects.businessId, businesses.id))
      .leftJoin(campaigns, eq(prospects.campaignId, campaigns.id))
      .where(eq(prospects.id, prospectId))
      .limit(1)
      .then((res) => res[0]);
  } catch (err: any) {
    console.error("[prospect page] DB error:", err?.message || err);
    row = null;
  }

  if (!row) notFound();

  const settings = await getSettings();
  const campaignLanguage = (row.campaign as any)?.language || "fr";
  return <ProspectClient prospect={row.prospect as any} business={row.business} settings={settings} campaignLanguage={campaignLanguage} />;
}
