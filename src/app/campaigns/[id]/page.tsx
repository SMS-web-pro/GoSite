import { notFound } from "next/navigation";
import { db } from "@/db";
import { campaigns, prospects, businesses, messageLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import CampaignDetail from "./CampaignDetail";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  console.log("[campaign page] params.id =", id);
  const campaignId = parseInt(id, 10);
  if (Number.isNaN(campaignId)) notFound();

  let campaign;
  try {
    console.log("[campaign page] querying DB for campaignId =", campaignId);
    const rows = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);
    console.log("[campaign page] DB returned", rows.length, "rows");
    campaign = rows[0];
  } catch (err: any) {
    console.error("[campaign page] DB error:", err?.message || err);
    console.error("[campaign page] DB error stack:", err?.stack);
    campaign = null;
  }
  if (!campaign) {
    console.log("[campaign page] no campaign found, calling notFound()");
    notFound();
  }

  let prospectsList: Array<{ prospect: typeof prospects.$inferSelect; business: typeof businesses.$inferSelect }> = [];
  try {
    prospectsList = await db
      .select({ prospect: prospects, business: businesses })
      .from(prospects)
      .innerJoin(businesses, eq(prospects.businessId, businesses.id))
      .where(eq(prospects.campaignId, campaignId))
      .orderBy(desc(prospects.updatedAt));
  } catch {
    prospectsList = [];
  }

  let campaignLogs: any[] = [];
  try {
    campaignLogs = await db
      .select()
      .from(messageLogs)
      .where(eq(messageLogs.campaignId, campaignId))
      .orderBy(desc(messageLogs.sentAt));
  } catch {
    campaignLogs = [];
  }

  const settings = await getSettings();

  return <CampaignDetail campaign={campaign} items={prospectsList} messageLogs={campaignLogs} settings={settings} />;
}
