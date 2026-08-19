import { NextResponse } from "next/server";
import { localStore } from "@/lib/local-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const data = localStore.get();
  return NextResponse.json({
    prospects: data.prospects.length,
    campaigns: data.campaigns.length,
  });
}
