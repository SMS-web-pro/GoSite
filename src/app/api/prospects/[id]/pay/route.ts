import { NextResponse } from "next/server";
import { db } from "@/db";
import { prospects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { localStore } from "@/lib/local-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const prospectId = parseInt(id, 10);
  if (Number.isNaN(prospectId)) {
    return NextResponse.json({ error: "Invalid prospect ID" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const paymentType = body.type || "deposit"; // "deposit" or "final"

  const now = new Date();
  const updateData: any = {};

  if (paymentType === "deposit") {
    updateData.depositPaid = true;
    updateData.depositPaidAt = now;
    updateData.paymentStatus = "deposit_paid";
    updateData.workflowStage = "deposit_paid";
  } else {
    updateData.finalPaid = true;
    updateData.finalPaidAt = now;
    updateData.paymentStatus = "paid";
    updateData.workflowStage = "paid";
    updateData.deliveryDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }

  let updated;
  try {
    [updated] = await db
      .update(prospects)
      .set(updateData)
      .where(eq(prospects.id, prospectId))
      .returning();
  } catch {
    updated = null;
  }

  if (!updated) {
    const data = localStore.get();
    const p = data.prospects.find((p: any) => p.id === prospectId);
    if (p) {
      Object.assign(p, updateData);
      localStore.save(data);
      updated = p;
    }
  }

  if (!updated) {
    return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
  }

  return NextResponse.json({ prospect: updated, ok: true });
}
