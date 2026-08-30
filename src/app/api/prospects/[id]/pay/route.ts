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

  // Read body {type} where type = 'deposit' | 'final' default 'deposit' for compat
  let type: "deposit" | "final" = "deposit";
  try {
    const body = await req.json();
    if (body && (body.type === "final" || body.type === "deposit")) {
      type = body.type;
    }
  } catch {
    // No body or invalid JSON — keep default 'deposit'
  }

  const now = new Date();

  if (type === "final") {
    const dbUpdates = {
      finalPaymentStatus: "paid" as const,
      finalPaymentDate: now,
      paymentStatus: "paid" as const,
      paymentDate: now,
      workflowStage: "paid" as const,
      deliveryDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      updatedAt: now,
    };
    const localUpdates = {
      finalPaymentStatus: "paid",
      finalPaymentDate: now.toISOString(),
      paymentStatus: "paid",
      paymentDate: now.toISOString(),
      workflowStage: "paid",
      deliveryDate: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    };

    // Try DB first
    try {
      const [updated] = await db
        .update(prospects)
        .set(dbUpdates)
        .where(eq(prospects.id, prospectId))
        .returning();
      if (updated) {
        localStore.updateProspect(prospectId, localUpdates);
        return NextResponse.json({ prospect: updated, ok: true });
      }
    } catch {
      // DB unreachable — fall through to localStore
    }

    const updated = localStore.updateProspect(prospectId, localUpdates);
    if (updated) {
      return NextResponse.json({ prospect: updated, ok: true });
    }

    return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
  } else {
    const dbUpdates = {
      depositStatus: "paid" as const,
      depositDate: now,
      workflowStage: "deposit_paid" as const,
      updatedAt: now,
    };
    const localUpdates = {
      depositStatus: "paid",
      depositDate: now.toISOString(),
      workflowStage: "deposit_paid",
    };

    // Try DB first
    try {
      const [updated] = await db
        .update(prospects)
        .set(dbUpdates)
        .where(eq(prospects.id, prospectId))
        .returning();
      if (updated) {
        localStore.updateProspect(prospectId, localUpdates);
        return NextResponse.json({ prospect: updated, ok: true });
      }
    } catch {
      // DB unreachable — fall through to localStore
    }

    const updated = localStore.updateProspect(prospectId, localUpdates);
    if (updated) {
      return NextResponse.json({ prospect: updated, ok: true });
    }

    return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
  }
}
