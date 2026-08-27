import { NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, prospects, campaigns } from "@/db/schema";
import { eq } from "drizzle-orm";
import { localStore } from "@/lib/local-store";
import {
  generateVibecoderPrompt,
  generateDefaultWhatsAppMessages,
} from "@/lib/prompt-generator";
import { generateDemoSiteHtml } from "@/lib/site-generator";

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

    // Separate business fields from prospect fields
    const { externalDemoUrl, externalSiteUrl, ...businessFields } = body;

    let prospect: typeof prospects.$inferSelect | null = null;
    let business: typeof businesses.$inferSelect | null = null;
    let campaignLanguage = "fr";

    // Try DB first
    try {
      const [p] = await db.select().from(prospects).where(eq(prospects.id, prospectId)).limit(1);
      if (p) {
        prospect = p;
        if (p.campaignId) {
          const [c] = await db.select().from(campaigns).where(eq(campaigns.id, p.campaignId)).limit(1);
          if (c?.language) campaignLanguage = c.language;
        }

        // Update business in DB
        const [updatedBiz] = await db
          .update(businesses)
          .set(businessFields)
          .where(eq(businesses.id, p.businessId))
          .returning();
        business = updatedBiz;

        // Auto-regenerate prompt and messages with the updated business details
        const updatedVibecoderPrompt = generateVibecoderPrompt(updatedBiz as any, campaignLanguage);
        const updatedWhatsappMessages = generateDefaultWhatsAppMessages(updatedBiz as any);
        const updatedDemoHtml = generateDemoSiteHtml(updatedBiz as any);

        const prospectUpdates: Record<string, any> = {
          vibecoderPrompt: updatedVibecoderPrompt,
          whatsappMessages: updatedWhatsappMessages,
          demoHtml: updatedDemoHtml,
          updatedAt: new Date(),
        };

        if (externalDemoUrl !== undefined) {
          prospectUpdates.externalDemoUrl = externalDemoUrl === "" ? null : externalDemoUrl;
        }
        if (externalSiteUrl !== undefined) {
          prospectUpdates.externalSiteUrl = externalSiteUrl === "" ? null : externalSiteUrl;
        }

        const [updatedP] = await db
          .update(prospects)
          .set(prospectUpdates)
          .where(eq(prospects.id, prospectId))
          .returning();
        prospect = updatedP;

        // Also sync to local-store
        localStore.updateBusiness(p.businessId, businessFields);
        localStore.updateProspect(prospectId, {
          ...prospectUpdates,
        });

        return NextResponse.json({
          ok: true,
          business: updatedBiz,
          prospect: updatedP,
        });
      }
    } catch (dbErr) {
      console.warn("DB update failed in PATCH /business, using local-store fallback:", dbErr);
    }

    // LocalStore fallback
    const local = localStore.getProspectById(prospectId);
    if (!local) {
      return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
    }

    const updatedBiz = localStore.updateBusiness(local.prospect.businessId, businessFields);
    const updatedVibecoderPrompt = generateVibecoderPrompt(updatedBiz as any, "fr");
    const updatedWhatsappMessages = generateDefaultWhatsAppMessages(updatedBiz as any);
    const updatedDemoHtml = generateDemoSiteHtml(updatedBiz as any);

    const prospectUpdates: Record<string, any> = {
      vibecoderPrompt: updatedVibecoderPrompt,
      whatsappMessages: updatedWhatsappMessages,
      demoHtml: updatedDemoHtml,
    };
    if (externalDemoUrl !== undefined) prospectUpdates.externalDemoUrl = externalDemoUrl === "" ? null : externalDemoUrl;
    if (externalSiteUrl !== undefined) prospectUpdates.externalSiteUrl = externalSiteUrl === "" ? null : externalSiteUrl;

    const updatedP = localStore.updateProspect(prospectId, prospectUpdates);

    return NextResponse.json({
      ok: true,
      business: updatedBiz,
      prospect: updatedP,
    });
  } catch (err) {
    console.error("Update business error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}
