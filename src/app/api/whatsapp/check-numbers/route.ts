import { NextResponse } from "next/server";
import { checkNumbersOnWhatsApp } from "@/lib/whatsapp-session";
import { normalizePhone } from "@/lib/phone-normalizer";

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
