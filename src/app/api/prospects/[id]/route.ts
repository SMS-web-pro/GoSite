import { NextResponse } from "next/server";
import { db } from "@/db";
import { prospects, businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  generateVibecoderPrompt,
  generateDefaultWhatsAppMessages,
  detectProspectCurrency,
} from "@/lib/prompt-generator";
import { generateDemoSiteHtml } from "@/lib/site-generator";
import { getSettings } from "@/lib/settings";

import { localStore } from "@/lib/local-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const prospectId = parseInt(id, 10);
  if (Number.isNaN(prospectId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const [row] = await db
      .select({ prospect: prospects, business: businesses })
      .from(prospects)
      .innerJoin(businesses, eq(prospects.businessId, businesses.id))
      .where(eq(prospects.id, prospectId))
      .limit(1);
    if (row) {
      return NextResponse.json(row);
    }
  } catch (err) {
    console.warn("DB query failed in GET /api/prospects/[id]:", err);
  }

  const localRow = localStore.getProspectById(prospectId);
  if (localRow) {
    return NextResponse.json(localRow);
  }

  return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const prospectId = parseInt(id, 10);
  if (Number.isNaN(prospectId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }
  const body = await req.json();
  const updates: any = { updatedAt: new Date() };
  // Workflow
  if (body.workflowStage) updates.workflowStage = body.workflowStage;
  if (body.notes !== undefined) updates.notes = body.notes;
  if (body.vibecoderPrompt) updates.vibecoderPrompt = body.vibecoderPrompt;
  if (body.whatsappMessages) updates.whatsappMessages = body.whatsappMessages;
  // Payment — legacy + 2-step split
  if (body.paymentStatus) updates.paymentStatus = body.paymentStatus;
  if (body.paymentAmount !== undefined) updates.paymentAmount = body.paymentAmount;
  if (body.paymentStatus === "paid") {
    updates.paymentDate = new Date();
    updates.deliveryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    updates.workflowStage = "paid";
  }
  if (body.depositStatus) updates.depositStatus = body.depositStatus;
  if (body.finalPaymentStatus) updates.finalPaymentStatus = body.finalPaymentStatus;
  if (body.depositStatus === "paid") {
    updates.depositDate = new Date();
    updates.workflowStage = "deposit_paid";
  }
  if (body.finalPaymentStatus === "paid") {
    updates.finalPaymentDate = new Date();
    updates.paymentDate = new Date();
    updates.paymentStatus = "paid";
    updates.workflowStage = "paid";
  }
  if (body.totalAmount !== undefined) updates.totalAmount = body.totalAmount;
  if (body.depositAmount !== undefined) updates.depositAmount = body.depositAmount;
  if (body.finalAmount !== undefined) updates.finalAmount = body.finalAmount;
  if (body.depositDate !== undefined) updates.depositDate = body.depositDate ? new Date(body.depositDate) : null;
  if (body.finalPaymentDate !== undefined) updates.finalPaymentDate = body.finalPaymentDate ? new Date(body.finalPaymentDate) : null;
  // Quotes & external links
  if (body.quoteAmount !== undefined) updates.quoteAmount = body.quoteAmount;
  if (body.quoteCurrency) updates.quoteCurrency = body.quoteCurrency;
  if (body.externalDemoUrl !== undefined) {
    updates.externalDemoUrl = body.externalDemoUrl === "" ? null : body.externalDemoUrl;
  }
  if (body.externalSiteUrl !== undefined) {
    updates.externalSiteUrl = body.externalSiteUrl === "" ? null : body.externalSiteUrl;
  }
  if (body.finalSiteUrl !== undefined) {
    updates.finalSiteUrl = body.finalSiteUrl === "" ? null : body.finalSiteUrl;
  }
  if (body.quoteTier) {
    const settings = await getSettings();
    const currency = detectProspectCurrency(body.country || null, body.city || null);
    const deposit = currency === "EUR" ? (settings as any).depositPriceEUR || 9900 : currency === "USD" ? (settings as any).depositPriceUSD || 9900 : (settings as any).depositPriceMAD || 99000;
    const final = currency === "EUR" ? (settings as any).finalPriceEUR || 15000 : currency === "USD" ? (settings as any).finalPriceUSD || 15000 : (settings as any).finalPriceMAD || 150000;
    const total = deposit + final;
    updates.quoteAmount = total;
    updates.quoteCurrency = currency;
    updates.totalAmount = total;
    updates.depositAmount = deposit;
    updates.finalAmount = final;
  }

  try {
    const [updated] = await db
      .update(prospects)
      .set(updates)
      .where(eq(prospects.id, prospectId))
      .returning();
    if (updated) {
      localStore.updateProspect(prospectId, updates);
      return NextResponse.json({ prospect: updated });
    }
  } catch (err) {
    console.warn("DB update failed in PATCH /api/prospects/[id]:", err);
  }

  const updatedLocally = localStore.updateProspect(prospectId, updates);
  if (updatedLocally) {
    return NextResponse.json({ prospect: updatedLocally });
  }

  return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const prospectId = parseInt(id, 10);
  if (Number.isNaN(prospectId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const [p] = await db
      .select()
      .from(prospects)
      .where(eq(prospects.id, prospectId))
      .limit(1);
    if (p) {
      await db.delete(prospects).where(eq(prospects.id, prospectId));
      if (p.businessId) {
        await db.delete(businesses).where(eq(businesses.id, p.businessId)).catch(() => {});
      }
    }
  } catch (err) {
    console.warn("DB delete failed in DELETE /api/prospects/[id]:", err);
  }

  localStore.deleteProspect(prospectId);
  return NextResponse.json({ ok: true, deleted: prospectId });
}
