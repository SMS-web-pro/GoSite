import { NextResponse } from "next/server";
import { db } from "@/db";
import { prospects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { localStore } from "@/lib/local-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const prospectId = parseInt(id, 10);
  if (Number.isNaN(prospectId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const now = new Date();
  const updates = {
    paymentStatus: "paid",
    paymentDate: now.toISOString(),
    deliveryDate: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    workflowStage: "paid",
  };

  // Try DB first
  try {
    const [updated] = await db
      .update(prospects)
      .set({
        ...updates,
        paymentDate: now,
        deliveryDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        updatedAt: now,
      })
      .where(eq(prospects.id, prospectId))
      .returning();
    if (updated) {
      localStore.updateProspect(prospectId, updates);
      return NextResponse.json({ prospect: updated, ok: true });
    }
  } catch {
    // DB unreachable — fall through to localStore
  }

  const updated = localStore.updateProspect(prospectId, updates);
  if (updated) {
    return NextResponse.json({ prospect: updated, ok: true });
  }

  return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
}
