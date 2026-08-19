import { NextResponse } from "next/server";
import { db } from "@/db";
import { prospects, businesses, messageLogs } from "@/db/schema";
import { inArray, eq } from "drizzle-orm";
import { localStore } from "@/lib/local-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Bulk delete prospects by IDs. Cascades to:
 *  - messageLogs (via FK onDelete cascade)
 *  - businesses that are no longer referenced by any prospect
 */
export async function POST(req: Request) {
  let body: { ids?: number[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const ids: number[] = Array.isArray(body.ids) ? body.ids : [];
  if (ids.length === 0) {
    return NextResponse.json({ error: "Aucun ID fourni" }, { status: 400 });
  }
  // Sanitize
  const validIds = ids.filter((x) => Number.isInteger(x) && x > 0);
  if (validIds.length === 0) {
    return NextResponse.json({ error: "IDs invalides" }, { status: 400 });
  }
  if (validIds.length > 500) {
    return NextResponse.json({ error: "Maximum 500 prospects par requête" }, { status: 400 });
  }

  // Get the businesses to potentially clean up
  let linked;
  try {
    linked = await db
      .select({ id: prospects.id, businessId: prospects.businessId })
      .from(prospects)
      .where(inArray(prospects.id, validIds));
  } catch (dbErr) {
    console.warn("DB unavailable for bulk-delete, using local store:", dbErr);
    const result = localStore.deleteProspects(validIds);
    return NextResponse.json({
      ok: true,
      deleted: result.deleted,
      deletedBusinesses: result.deletedBusinesses,
    });
  }
  const businessIds = Array.from(
    new Set(linked.map((p) => p.businessId).filter(Boolean) as number[])
  );

  let deletedBusinessCount = 0;
  try {
    // Delete the prospects (this also cascades to messageLogs)
    await db.delete(prospects).where(inArray(prospects.id, validIds));

    // Clean up orphan businesses
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
        deletedBusinessCount = orphanIds.length;
      }
    }
  } catch (dbErr) {
    console.warn("DB delete failed in bulk-delete, using local store:", dbErr);
    const result = localStore.deleteProspects(validIds);
    return NextResponse.json({
      ok: true,
      deleted: result.deleted,
      deletedBusinesses: result.deletedBusinesses,
    });
  }

  return NextResponse.json({
    ok: true,
    deleted: validIds.length,
    deletedBusinesses: deletedBusinessCount,
  });
}
