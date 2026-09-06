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
      {/* Header */}
      <div className="mb-8">
        <div className="mb-6 flex items-center gap-2">
          <div className="h-[2px] w-6 rounded bg-[#d9ff4d]" />
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[#d9ff4d]">Prospects</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#d9ff4d]/10 text-[#d9ff4d]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-[#e8efe8] sm:text-4xl" style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: -1.5, lineHeight: 1.1 }}>
                Mes prospects
              </h1>
              <p className="mt-1 text-sm text-[#67766a]">{rows.length} business locaux · opportunités de vente</p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-[#d9ff4d] px-5 py-2.5 text-sm font-bold text-[#0a0d0b] transition hover:bg-[#4ade80]"
          >
            + Nouvelle recherche
          </Link>
        </div>
      </div>

      <ProspectsList items={rows} campaigns={campaignList} />
    </div>
  );
}
