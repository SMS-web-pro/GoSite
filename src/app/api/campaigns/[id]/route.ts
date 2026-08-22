import { NextResponse } from "next/server";
import { db } from "@/db";
import { campaigns, prospects, businesses, messageLogs } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { localStore } from "@/lib/local-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const cid = parseInt(id, 10);
  if (Number.isNaN(cid)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }
  let campaign;
  try {
    [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, cid))
      .limit(1);
  } catch (dbErr) {
    console.warn("DB unavailable for campaign GET, using local store:", dbErr);
    const data = localStore.get();
    campaign = data.campaigns.find((c: any) => c.id === cid) || null;
  }
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }
  return NextResponse.json({ campaign });
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const cid = parseInt(id, 10);
  if (Number.isNaN(cid)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const updates: any = { updatedAt: new Date() };
  if (body.name !== undefined) updates.name = body.name;
  if (body.description !== undefined) updates.description = body.description;
  if (body.sector !== undefined) updates.sector = body.sector;
  if (body.location !== undefined) updates.location = body.location;
  if (body.status !== undefined) updates.status = body.status;
  if (body.language !== undefined) updates.language = body.language;
  if (body.pricingTiers !== undefined) updates.pricingTiers = body.pricingTiers;

  let updated;
  try {
    [updated] = await db
      .update(campaigns)
      .set(updates)
      .where(eq(campaigns.id, cid))
      .returning();
  } catch (dbErr) {
    console.warn("DB unavailable for campaign PATCH, using local store:", dbErr);
    const data = localStore.get();
    const idx = data.campaigns.findIndex((c: any) => c.id === cid);
    if (idx >= 0) {
      data.campaigns[idx] = { ...data.campaigns[idx], ...updates };
      localStore.save(data);
      updated = data.campaigns[idx];
    }
  }
  if (!updated) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }
  return NextResponse.json({ campaign: updated });
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const cid = parseInt(id, 10);
  if (Number.isNaN(cid)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  // Default: cascade delete (delete prospects + their businesses).
  // Use ?keep=prospects to detach instead of delete.
  const url = new URL(req.url);
  const keepProspects = url.searchParams.get("keep") === "prospects";

  // Verify campaign exists
  let campaign;
  try {
    [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, cid))
      .limit(1);
  } catch (dbErr) {
    console.warn("DB unavailable for campaign DELETE, using local store:", dbErr);
    const data = localStore.get();
    const idx = data.campaigns.findIndex((c: any) => c.id === cid);
    if (idx < 0) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }
    data.campaigns.splice(idx, 1);
    // Also remove linked prospects
    if (!keepProspects) {
      data.prospects = data.prospects.filter((p: any) => p.campaignId !== cid);
    } else {
      data.prospects.forEach((p: any) => {
        if (p.campaignId === cid) p.campaignId = null;
      });
    }
    localStore.save(data);
    return NextResponse.json({
      ok: true,
      deleted: cid,
      deletedProspects: 0,
      mode: keepProspects ? "detach" : "cascade",
    });
  }
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  // Collect the prospect IDs linked to this campaign (for cleanup of
  // their businesses once the prospects are deleted)
  let linkedProspects: { id: number; businessId: number }[] = [];
  try {
    linkedProspects = await db
      .select({ id: prospects.id, businessId: prospects.businessId })
      .from(prospects)
      .where(eq(prospects.campaignId, cid));
  } catch {
    // keep empty array
  }
  const prospectIds = linkedProspects.map((p) => p.id);

  try {
    if (keepProspects) {
      // Detach: set campaignId = null on linked prospects
      if (prospectIds.length > 0) {
        await db
          .update(prospects)
          .set({ campaignId: null, updatedAt: new Date() })
          .where(eq(prospects.campaignId, cid));
      }
    } else {
      // Cascade: delete the prospects, their message_logs, and the
      // businesses they were created from. The message_logs table has
      // a FK with onDelete: "cascade" so it goes automatically.
      if (prospectIds.length > 0) {
        await db.delete(prospects).where(inArray(prospects.id, prospectIds));
      }
      // Also clean up the businesses that were created solely for these
      // prospects (source = "manual_import" from the CSV import or
      // "photon"/"openstreetmap" from search). We only delete businesses
      // that are no longer referenced by any prospect.
      const businessIds = Array.from(
        new Set(linkedProspects.map((p) => p.businessId).filter(Boolean) as number[])
      );
      if (businessIds.length > 0) {
        // Find which businesses are still referenced by other prospects
        const stillReferenced = await db
          .select({ businessId: prospects.businessId })
          .from(prospects)
          .where(inArray(prospects.businessId, businessIds));
        const referencedSet = new Set(
          stillReferenced.map((p) => p.businessId).filter(Boolean) as number[]
        );
        // Delete businesses that are no longer referenced
        const orphanBusinessIds = businessIds.filter((b) => !referencedSet.has(b));
        if (orphanBusinessIds.length > 0) {
          await db.delete(businesses).where(inArray(businesses.id, orphanBusinessIds));
        }
      }
    }
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la suppression des données liées" },
      { status: 500 }
    );
  }

  // Now delete the campaign itself
  let deleted;
  try {
    [deleted] = await db
      .delete(campaigns)
      .where(eq(campaigns.id, cid))
      .returning();
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la campagne" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    deleted: deleted?.id,
    deletedProspects: keepProspects ? 0 : prospectIds.length,
    mode: keepProspects ? "detach" : "cascade",
  });
}
