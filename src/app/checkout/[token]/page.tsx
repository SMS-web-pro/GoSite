import { notFound } from "next/navigation";
import { db } from "@/db";
import { prospects, businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import CheckoutClient from "./CheckoutClient";
import { getSettings } from "@/lib/settings";
import { detectProspectCurrency } from "@/lib/prompt-generator";
import { localStore } from "@/lib/local-store";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  let row = await db
    .select({ prospect: prospects, business: businesses })
    .from(prospects)
    .innerJoin(businesses, eq(prospects.businessId, businesses.id))
    .where(eq(prospects.demoToken, token))
    .limit(1)
    .then((res) => res[0])
    .catch(() => null);

  if (!row) {
    const local = localStore.get();
    const prospect = local.prospects.find((p: any) => p.demoToken === token);
    if (prospect) {
      const business = local.businesses.find((b: any) => b.id === prospect.businessId);
      row = { prospect, business } as any;
    }
  }

  if (!row) notFound();

  const settings = await getSettings();
  const currency = detectProspectCurrency(row.business.country || null, row.business.city || null);
  const marketPrice = currency === "EUR" ? (settings.priceEUR || 0)
    : currency === "USD" ? (settings.priceUSD || 0)
    : (settings.priceMAD || 0);

  return (
    <CheckoutClient
      prospectId={row.prospect.id}
      prospectToken={token}
      businessName={row.business.name}
      amount={(row.prospect as any).paymentAmount || (row.prospect as any).quoteAmount || marketPrice}
      currency={(row.prospect as any).quoteCurrency || currency}
    />
  );
}
