"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const SECTOR_SUGGESTIONS = [
  "Restaurant",
  "Café",
  "Coiffeur",
  "Garage automobile",
  "Pharmacie",
  "Boulangerie",
  "Plombier",
  "Agence immobilière",
  "Salle de sport",
  "Dentiste",
];

const LOCATION_SUGGESTIONS = [
  "Paris, France",
  "Lyon, France",
  "Marseille, France",
  "Bordeaux, France",
  "Toulouse, France",
  "Lille, France",
  "Nice, France",
  "Nantes, France",
];

export default function SearchForm({
  initialSector = "",
  initialLocation = "",
  initialCampaignId,
}: {
  initialSector?: string;
  initialLocation?: string;
  initialCampaignId?: number;
}) {
  const router = useRouter();
  const [sector, setSector] = useState(initialSector);
  const [location, setLocation] = useState(initialLocation);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!sector.trim() || !location.trim()) {
      setError("Veuillez renseigner le secteur et la localisation.");
      return;
    }
    setError(null);
    const params = new URLSearchParams({
      sector: sector.trim(),
      location: location.trim(),
    });
    if (initialCampaignId) {
      params.set("campaignId", String(initialCampaignId));
    }
    startTransition(() => {
      router.push(`/search?${params.toString()}`);
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Lancer une recherche
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Saisissez le secteur d&apos;activité et la zone géographique.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="sector"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Secteur d&apos;activité
          </label>
          <input
            id="sector"
            name="sector"
            type="text"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            placeholder="ex. Restaurant italien, Coiffeur, Plombier…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            list="sector-suggestions"
            autoComplete="off"
          />
          <datalist id="sector-suggestions">
            {SECTOR_SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>

        <div>
          <label
            htmlFor="location"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Localisation
          </label>
          <input
            id="location"
            name="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="ex. Paris, France"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            list="location-suggestions"
            autoComplete="off"
          />
          <datalist id="location-suggestions">
            {LOCATION_SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          Vous serez redirigé vers une page dédiée où le scraping sera
          lancé automatiquement.
        </p>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeOpacity="0.25"
                  strokeWidth="4"
                />
                <path
                  d="M22 12a10 10 0 0 1-10 10"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
              Préparation…
            </>
          ) : (
            <>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4"
                stroke="currentColor"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-3.5-3.5" />
              </svg>
              Lancer la recherche
            </>
          )}
        </button>
      </div>
    </form>
  );
}
