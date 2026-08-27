import { NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, prospects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { localStore } from "@/lib/local-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const prospectId = parseInt(id, 10);
    if (Number.isNaN(prospectId)) {
      return NextResponse.json({ error: "Invalid prospect ID" }, { status: 400 });
    }

    const body = await req.json();

    // Find the prospect
    const [prospect] = await db.select().from(prospects).where(eq(prospects.id, prospectId)).limit(1);
    if (!prospect) {
      return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
    }

    // Separate business fields from prospect fields
    const { externalDemoUrl, externalSiteUrl, ...businessFields } = body;

    // Update business in DB
    const [updatedBusiness] = await db
      .update(businesses)
      .set(businessFields)
      .where(eq(businesses.id, prospect.businessId))
      .returning();

    // Update prospect external URLs
    let updatedProspect = prospect;
    if (externalDemoUrl !== undefined || externalSiteUrl !== undefined) {
      const updates: Record<string, any> = {};
      if (externalDemoUrl !== undefined) updates.externalDemoUrl = externalDemoUrl;
      if (externalSiteUrl !== undefined) updates.externalSiteUrl = externalSiteUrl;
      [updatedProspect] = await db
        .update(prospects)
        .set(updates)
        .where(eq(prospects.id, prospectId))
        .returning();
    }

    // Also sync to local-store as fallback
    localStore.updateBusiness(prospect.businessId, businessFields);
    if (externalDemoUrl !== undefined || externalSiteUrl !== undefined) {
      localStore.updateProspect(prospectId, {
        ...(externalDemoUrl !== undefined && { externalDemoUrl }),
        ...(externalSiteUrl !== undefined && { externalSiteUrl }),
      });
    }

    return NextResponse.json({
      ok: true,
      business: updatedBusiness,
      prospect: updatedProspect,
    });
  } catch (err) {
    console.error("Update business error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}
