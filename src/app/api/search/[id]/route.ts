import { NextResponse } from "next/server";
import { db } from "@/db";
import { searches, businesses } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const searchId = parseInt(id, 10);
  if (Number.isNaN(searchId)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  let search, results;
  try {
    [search] = await db
      .select()
      .from(searches)
      .where(eq(searches.id, searchId))
      .limit(1);
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la recherche" },
      { status: 500 }
    );
  }
  if (!search) {
    return NextResponse.json(
      { error: "Recherche introuvable" },
      { status: 404 }
    );
  }

  try {
    results = await db
      .select()
      .from(businesses)
      .where(eq(businesses.searchId, searchId));
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la récupération des résultats" },
      { status: 500 }
    );
  }

  return NextResponse.json({ search, results });
}
