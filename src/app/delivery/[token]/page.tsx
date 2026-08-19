import { notFound } from "next/navigation";
import { db } from "@/db";
import { prospects, businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import DeliveryClient from "./DeliveryClient";

export const dynamic = "force-dynamic";

export default async function DeliveryPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [row] = await db
    .select({ prospect: prospects, business: businesses })
    .from(prospects)
    .innerJoin(businesses, eq(prospects.businessId, businesses.id))
    .where(eq(prospects.demoToken, token))
    .limit(1);
  if (!row) notFound();
  return (
    <DeliveryClient
      prospectToken={token}
      businessName={row.business.name}
      paymentDate={row.prospect.paymentDate}
      deliveryDate={row.prospect.deliveryDate}
      finalSiteUrl={row.prospect.externalSiteUrl}
    />
  );
}
