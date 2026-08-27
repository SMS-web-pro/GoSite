import { NextResponse } from "next/server";
import { isExternalServerConfigured, callServer } from "@/lib/whatsapp-client";
import { checkNumbersOnWhatsApp } from "@/lib/whatsapp-session";
import { normalizePhone } from "@/lib/phone-normalizer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const numbers: Array<{ phone: string; country?: string }> = body.numbers;
    if (!Array.isArray(numbers) || numbers.length === 0) {
      return NextResponse.json({ error: "numbers array required" }, { status: 400 });
    }
    const normalized = numbers.map((n) => ({
      raw: n.phone,
      normalized: normalizePhone(n.phone, n.country) || n.phone.replace(/[^0-9]/g, ""),
    }));

    // If external server is configured, use it
    if (isExternalServerConfigured()) {
      try {
        const data = await callServer("/check-numbers", {
          method: "POST",
          body: JSON.stringify({ phones: normalized.map((n) => n.normalized) }),
        });
        if (data.error) {
          return NextResponse.json({ error: data.error });
        }
        const mapped = (data.results || []).map((r: any, i: number) => ({
          phone: normalized[i].raw,
          normalized: r.phone || normalized[i].normalized,
          exists: r.exists,
          jid: r.jid,
        }));
        return NextResponse.json({ results: mapped });
      } catch (err: any) {
        return NextResponse.json({ error: err.message || "Check failed" }, { status: 500 });
      }
    }

    // Fallback: local Baileys
    const results = await checkNumbersOnWhatsApp(normalized.map((n) => n.normalized));
    const mapped = results.map((r, i) => ({
      phone: normalized[i].raw,
      normalized: r.phone,
      exists: r.exists,
      jid: r.jid,
    }));
    return NextResponse.json({ results: mapped });
  } catch {
    return NextResponse.json({ error: "Check failed" }, { status: 500 });
  }
}
