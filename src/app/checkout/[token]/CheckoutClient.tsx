"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CheckoutClient({
  prospectId,
  prospectToken,
  businessName,
  amount,
  currency,
}: {
  prospectId: number;
  prospectToken: string;
  businessName: string;
  amount: number;
  currency: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [card, setCard] = useState("4242 4242 4242 4242");
  const [exp, setExp] = useState("12/28");
  const [cvc, setCvc] = useState("123");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const amountDisplay = (amount / 100).toLocaleString("fr-FR", {
    style: "currency",
    currency: currency,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/prospects/${prospectId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: prospectToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur de paiement");
      }
      setSuccess(true);
      setTimeout(() => {
        router.push(`/delivery/${prospectToken}`);
      }, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-emerald-50 to-white grid place-items-center p-6">
        <div className="max-w-md w-full text-center bg-white rounded-3xl shadow-xl p-10">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Paiement confirmé !</h1>
          <p className="text-slate-600">Redirection vers votre espace de livraison...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-blue-600 mb-2">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={2}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Paiement sécurisé
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Finaliser votre commande</h1>
          <p className="text-slate-600 mt-2">Site web professionnel pour <strong>{businessName}</strong></p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-600">Site web professionnel clé en main</span>
              <span className="text-2xl font-bold text-slate-900">{amountDisplay}</span>
            </div>
            <p className="text-xs text-slate-500">Paiement unique · Livraison en 48h · Satisfait ou remboursé 30j</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom sur la carte</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Jean Dupont"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Numéro de carte</label>
              <input
                type="text"
                value={card}
                onChange={(e) => setCard(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Expiration</label>
                <input
                  type="text"
                  value={exp}
                  onChange={(e) => setExp(e.target.value)}
                  required
                  placeholder="MM/AA"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CVC</label>
                <input
                  type="text"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  required
                  placeholder="123"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
                    <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                  Traitement en cours...
                </span>
              ) : (
                <>💳 Payer {amountDisplay}</>
              )}
            </button>

            <p className="text-xs text-center text-slate-500 mt-3">
              🔒 Paiement 100% sécurisé. Vos données bancaires ne sont jamais stockées.
            </p>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Démo du site : <a href={`/demo/${prospectToken}`} className="text-blue-600 hover:underline" target="_blank">/demo/{prospectToken}</a>
        </p>
      </div>
    </main>
  );
}
