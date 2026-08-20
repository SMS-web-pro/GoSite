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
  const campaignId = parseInt(id, 10);
  if (Number.isNaN(campaignId)) notFound();

  let campaign;
  try {
    [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);
  } catch {
    campaign = null;
  }
  if (!campaign) notFound();

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
