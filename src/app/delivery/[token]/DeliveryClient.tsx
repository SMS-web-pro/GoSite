"use client";

import { useEffect, useState } from "react";

export default function DeliveryClient({
  prospectToken,
  businessName,
  paymentDate,
  deliveryDate,
  finalSiteUrl,
}: {
  prospectToken: string;
  businessName: string;
  paymentDate: Date | null;
  deliveryDate: Date | null;
  finalSiteUrl: string | null;
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const target = deliveryDate ? new Date(deliveryDate).getTime() : Date.now();
  const diff = target - now;
  const ready = diff <= 0;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 text-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-emerald-300 mb-3">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Paiement confirmé
          </div>
          <h1 className="text-4xl font-bold mb-3">
            🎉 Bravo, votre site est en construction !
          </h1>
          <p className="text-lg text-slate-300">
            Nous créons maintenant le site web final pour <strong>{businessName}</strong>
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-8 mb-6">
          <h2 className="text-xl font-semibold mb-4">Délai de livraison</h2>
          {ready ? (
            <div className="text-center py-6">
              <div className="text-5xl mb-3">🚀</div>
              <p className="text-2xl font-bold text-emerald-300 mb-2">Votre site est prêt !</p>
              {finalSiteUrl && (
                <a
                  href={finalSiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 mt-3 rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white hover:bg-emerald-600 transition"
                >
                  🌐 {finalSiteUrl}
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={2}>
                    <path d="M7 17 17 7" /><path d="M7 7h10v10" />
                  </svg>
                </a>
              )}
            </div>
          ) : (
            <>
              <div className="flex justify-center gap-4 mb-4">
                <CountdownBlock value={hours} label="heures" />
                <CountdownBlock value={minutes} label="min" />
                <CountdownBlock value={seconds} label="sec" />
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all"
                  style={{
                    width: `${Math.max(0, Math.min(100, ((24 * 60 * 60 * 1000 - diff) / (24 * 60 * 60 * 1000)) * 100))}%`,
                  }}
                />
              </div>
              <p className="text-center text-sm text-slate-400 mt-3">
                Site livré en 24h après le paiement · Vous recevrez un email à la livraison
              </p>
            </>
          )}
        </div>

        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-6">
          <h3 className="text-lg font-semibold mb-4">Prochaines étapes</h3>
          <ol className="space-y-3 text-sm text-slate-300">
            <li className="flex gap-3">
              <span className="flex-shrink-0 grid h-7 w-7 place-items-center rounded-full bg-emerald-500/20 text-emerald-300 font-bold">✓</span>
              <span><strong>Paiement reçu</strong> · {paymentDate ? new Date(paymentDate).toLocaleString("fr-FR") : "—"}</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 grid h-7 w-7 place-items-center rounded-full bg-blue-500/20 text-blue-300 font-bold">2</span>
              <span><strong>Génération du site final</strong> · design personnalisé + vos photos</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 grid h-7 w-7 place-items-center rounded-full bg-blue-500/20 text-blue-300 font-bold">3</span>
              <span><strong>Mise en ligne</strong> · sur votre domaine personnalisé + SSL</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 grid h-7 w-7 place-items-center rounded-full bg-slate-500/20 text-slate-400 font-bold">4</span>
              <span><strong>Email de livraison</strong> · avec accès admin + guide d'utilisation</span>
            </li>
          </ol>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Une question ? Répondez simplement à l'email de confirmation.
        </p>
      </div>
    </main>
  );
}

function CountdownBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 min-w-[80px]">
      <div className="text-3xl font-bold tabular-nums">{String(value).padStart(2, "0")}</div>
      <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">{label}</div>
    </div>
  );
}
