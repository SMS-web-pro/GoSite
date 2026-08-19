import { NextResponse } from "next/server";
import { db } from "@/db";
import { campaigns, prospects, businesses } from "@/db/schema";
import { inArray, eq } from "drizzle-orm";
import { localStore } from "@/lib/local-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Bulk delete campaigns by IDs.
 *
 * Body:
 *   { ids: number[], keepProspects?: boolean }
 *
 * Default = cascade delete (campaigns + their prospects + businesses +
 * message logs).
 * If keepProspects = true, prospects are detached (campaignId = null)
 * but not deleted.
 */
export async function POST(req: Request) {
  let body: { ids?: number[]; keepProspects?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const rawIds: number[] = Array.isArray(body.ids) ? body.ids : [];
  const keepProspects: boolean = body.keepProspects === true;

  // Sanitize
  const validIds = rawIds.filter((x) => Number.isInteger(x) && x > 0);
  if (validIds.length === 0) {
    return NextResponse.json({ error: "Aucun ID valide fourni" }, { status: 400 });
  }
  if (validIds.length > 200) {
    return NextResponse.json({ error: "Maximum 200 campagnes par requête" }, { status: 400 });
  }

  // Collect prospect IDs and business IDs for cleanup
  let linkedProspects;
  try {
    linkedProspects = await db
      .select({ id: prospects.id, businessId: prospects.businessId })
      .from(prospects)
      .where(inArray(prospects.campaignId, validIds));
  } catch (dbErr) {
    console.warn("DB unavailable for campaigns bulk-delete, using local store:", dbErr);
    const data = localStore.get();
    const idSet = new Set(validIds);
    if (keepProspects) {
      data.prospects.forEach((p: any) => {
        if (idSet.has(p.campaignId)) p.campaignId = null;
      });
    } else {
      data.prospects = data.prospects.filter((p: any) => !idSet.has(p.campaignId));
    }
    data.campaigns = data.campaigns.filter((c: any) => !idSet.has(c.id));
    localStore.save(data);
    return NextResponse.json({
      ok: true,
      deleted: validIds.length,
      deletedProspects: 0,
      mode: keepProspects ? "detach" : "cascade",
    });
  }
  const prospectIds = linkedProspects.map((p) => p.id);

  try {
    if (!keepProspects) {
      // Cascade: delete prospects (cascades to message_logs)
      if (prospectIds.length > 0) {
        await db.delete(prospects).where(inArray(prospects.id, prospectIds));
      }
      // Clean up orphan businesses
      const businessIds = Array.from(
        new Set(linkedProspects.map((p) => p.businessId).filter(Boolean) as number[])
      );
      if (businessIds.length > 0) {
        const stillReferenced = await db
          .select({ businessId: prospects.businessId })
          .from(prospects)
          .where(inArray(prospects.businessId, businessIds));
        const referencedSet = new Set(
          stillReferenced.map((p) => p.businessId).filter(Boolean) as number[]
        );
        const orphanIds = businessIds.filter((b) => !referencedSet.has(b));
        if (orphanIds.length > 0) {
          await db.delete(businesses).where(inArray(businesses.id, orphanIds));
        }
      }
    } else {
      // Detach: set campaignId = null on linked prospects
      if (prospectIds.length > 0) {
        await db
          .update(prospects)
          .set({ campaignId: null, updatedAt: new Date() })
          .where(inArray(prospects.id, prospectIds));
      }
    }
  } catch (dbErr) {
    console.warn("DB cascade delete failed in campaigns bulk-delete, using local store:", dbErr);
    const data = localStore.get();
    const idSet = new Set(validIds);
    data.prospects = data.prospects.filter((p: any) => !idSet.has(p.campaignId));
    data.campaigns = data.campaigns.filter((c: any) => !idSet.has(c.id));
    localStore.save(data);
  }

  // Delete the campaigns
  let deleted;
  try {
    deleted = await db
      .delete(campaigns)
      .where(inArray(campaigns.id, validIds))
      .returning({ id: campaigns.id });
  } catch (dbErr) {
    console.warn("DB delete campaigns failed in bulk-delete, using local store:", dbErr);
    const data = localStore.get();
    const idSet = new Set(validIds);
    data.campaigns = data.campaigns.filter((c: any) => !idSet.has(c.id));
    localStore.save(data);
    deleted = validIds.map((id) => ({ id }));
  }

  return NextResponse.json({
    ok: true,
    deleted: deleted.length,
    deletedProspects: keepProspects ? 0 : prospectIds.length,
    mode: keepProspects ? "detach" : "cascade",
  });
}
