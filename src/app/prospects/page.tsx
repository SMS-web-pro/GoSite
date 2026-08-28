import Link from "next/link";
import { db } from "@/db";
import { prospects, businesses, campaigns } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import ProspectsList from "./ProspectsList";
import { localStore } from "@/lib/local-store";

export const dynamic = "force-dynamic";

export default async function ProspectsPage() {
  let rows = await db
    .select({ prospect: prospects, business: businesses })
    .from(prospects)
    .innerJoin(businesses, eq(prospects.businessId, businesses.id))
    .orderBy(desc(prospects.updatedAt))
    .limit(100)
    .catch(() => [] as Array<{ prospect: typeof prospects.$inferSelect; business: typeof businesses.$inferSelect }>);

  if (rows.length === 0) {
    rows = localStore.getProspects() as any;
  }

  let campaignList: Array<{ id: number; name: string }> = [];
  try {
    campaignList = await db
      .select({ id: campaigns.id, name: campaigns.name })
      .from(campaigns)
      .orderBy(desc(campaigns.createdAt));
  } catch {}

  return (
      <div className="mx-auto max-w-[1380px] px-6 py-10 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={2}>
                <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
              </svg>
              Accueil
            </Link>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">🎯 Mes prospects</h1>
            <p className="text-sm text-slate-600">
              {rows.length} business locaux transformés en opportunité de vente
            </p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Nouvelle recherche
          </Link>
        </div>
        <ProspectsList items={rows} campaigns={campaignList} />
      </div>
  );
}
