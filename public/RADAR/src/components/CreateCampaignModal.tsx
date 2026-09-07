/* ------------------------------------------------------------------ */
/*  Modal — Créer une campagne GoSite depuis les résultats RADAR       */
/* ------------------------------------------------------------------ */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Rocket, X } from "lucide-react";
import type { Brief, Business, WaStatus } from "../lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  brief: Brief;
  prospects: Business[];
  waMap: Record<string, WaStatus>;
}

export default function CreateCampaignModal({ open, onClose, brief, prospects, waMap }: Props) {
  const [name, setName] = useState(
    `${brief.type} — ${brief.ville}`
  );
  const [sector, setSector] = useState(brief.type);
  const [location, setLocation] = useState(brief.ville);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    ok: boolean;
    campaignId?: number;
    imported?: number;
    errors?: number;
    error?: string;
  } | null>(null);

  const waProspects = prospects.filter((b) => waMap[b.id] === "oui");
  const allProspects = prospects;

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/radar/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign: {
            name: name.trim(),
            sector: sector.trim() || null,
            location: location.trim() || null,
            language: brief.lang,
            currency: brief.lang === "en" ? "USD" : brief.lang === "ar" ? "MAD" : "EUR",
          },
          prospects: allProspects.map((b) => ({
            name: b.name,
            category: b.category,
            address: b.address,
            phone: b.phone,
            zone: b.zone,
            rating: b.rating,
            reviewCount: b.reviewCount,
            reviews: b.reviews,
            services: b.services,
            photoUrl: b.photoUrl,
            websiteUri: b.websiteUri,
            hours: b.hours,
            lat: b.lat,
            lng: b.lng,
            mapsUrl: b.mapsUrl,
            description: b.description,
            web: b.web,
          })),
        }),
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ ok: false, error: "Erreur réseau" });
    } finally {
      setLoading(false);
    }
  };

  const goToCampaign = () => {
    if (result?.campaignId) {
      window.location.href = `/campaigns/${result.campaignId}`;
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime/15 text-lime">
                  <Rocket className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="font-display text-[15px] font-semibold text-zinc-100">
                    Créer la campagne
                  </h2>
                  <p className="text-[11.5px] text-fog">
                    {allProspects.length} prospect{allProspects.length > 1 ? "s" : ""} importé
                    {allProspects.length > 1 ? "s" : ""} · {waProspects.length} WhatsApp vérifié
                    {waProspects.length > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-fog transition-colors hover:bg-raise hover:text-zinc-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-4 px-6 py-5">
              {result?.ok ? (
                <div className="space-y-4 text-center">
                  <div className="flex justify-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-radar/15 text-radar">
                      <Rocket className="h-6 w-6" />
                    </span>
                  </div>
                  <div>
                    <p className="font-display text-lg font-semibold text-zinc-100">
                      Campagne créée !
                    </p>
                    <p className="mt-1 text-[13px] text-fog">
                      {result.imported} prospect{(result.imported ?? 0) > 1 ? "s" : ""} importé
                      {(result.imported ?? 0) > 1 ? "s" : ""}
                      {result.errors ? ` · ${result.errors} erreur(s)` : ""}
                    </p>
                  </div>
                  <p className="text-[12px] leading-relaxed text-mist">
                    Vibecoder prompts, messages WhatsApp, et démos HTML ont été générés automatiquement pour chaque prospect.
                  </p>
                  <button
                    onClick={goToCampaign}
                    className="w-full rounded-xl bg-lime px-5 py-3 font-display text-[13px] font-semibold text-ink transition-colors hover:bg-radar"
                  >
                    Voir la campagne →
                  </button>
                </div>
              ) : result?.error ? (
                <div className="text-center">
                  <p className="text-[13px] text-red-400">{result.error}</p>
                  <button
                    onClick={handleCreate}
                    className="mt-3 rounded-xl border border-line px-4 py-2 text-[12.5px] text-mist hover:text-zinc-100"
                  >
                    Réessayer
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-[0.18em] text-fog">
                      Nom de la campagne *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Plombiers Paris — Campagne 1"
                      className="w-full rounded-lg border border-line bg-ink px-3.5 py-2.5 text-[13px] text-zinc-100 placeholder:text-fog/50 focus:border-lime/60 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-[0.18em] text-fog">
                        Secteur
                      </label>
                      <input
                        type="text"
                        value={sector}
                        onChange={(e) => setSector(e.target.value)}
                        placeholder="Plombier"
                        className="w-full rounded-lg border border-line bg-ink px-3.5 py-2.5 text-[13px] text-zinc-100 placeholder:text-fog/50 focus:border-lime/60 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-[0.18em] text-fog">
                        Localisation
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Paris, France"
                        className="w-full rounded-lg border border-line bg-ink px-3.5 py-2.5 text-[13px] text-zinc-100 placeholder:text-fog/50 focus:border-lime/60 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="rounded-xl border border-line bg-ink/50 px-4 py-3">
                    <p className="text-[12px] text-mist">
                      <strong className="text-zinc-100">{allProspects.length}</strong> prospects seront importés dans la campagne.
                      {waProspects.length < allProspects.length && (
                        <span className="ml-1 text-fog">
                          ({allProspects.length - waProspects.length} sans WhatsApp seront en attente)
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-[11px] text-fog">
                      Langue : {brief.lang === "fr" ? "Français" : "English"} · Devise : {brief.lang === "en" ? "USD" : brief.lang === "ar" ? "MAD" : "EUR"}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            {!result?.ok && (
              <div className="flex items-center justify-end gap-3 border-t border-line px-6 py-4">
                <button
                  onClick={onClose}
                  className="rounded-xl border border-line px-4 py-2.5 text-[12.5px] font-medium text-mist transition-colors hover:text-zinc-100"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!name.trim() || loading}
                  className="flex items-center gap-2 rounded-xl bg-lime px-5 py-2.5 font-display text-[13px] font-semibold text-ink transition-colors hover:bg-radar disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Rocket className="h-4 w-4" />
                  )}
                  {loading ? "Création…" : "Créer la campagne"}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
