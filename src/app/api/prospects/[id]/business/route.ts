import { NextResponse } from "next/server";
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
    const data = localStore.get();
    const prospect = data.prospects.find((p: any) => p.id === prospectId);
    if (!prospect) {
      return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
    }

    // Separate business fields from prospect fields
    const {
      externalDemoUrl,
      externalSiteUrl,
      ...businessFields
    } = body;

    // Update business
    const business = localStore.updateBusiness(prospect.businessId, businessFields);

    // Update prospect external URLs
    const prospectUpdates: any = {};
    if (externalDemoUrl !== undefined) prospectUpdates.externalDemoUrl = externalDemoUrl;
    if (externalSiteUrl !== undefined) prospectUpdates.externalSiteUrl = externalSiteUrl;

    let updatedProspect = prospect;
    if (Object.keys(prospectUpdates).length > 0) {
      updatedProspect = localStore.updateProspect(prospectId, prospectUpdates) || prospect;
    }

    return NextResponse.json({
      ok: true,
      business,
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
