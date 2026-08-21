"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function getCampaignIdFromUrl(searchParamsString?: string): number | undefined {
  if (typeof window === "undefined" && !searchParamsString) return undefined;
  const v = new URLSearchParams(searchParamsString || (typeof window !== "undefined" ? window.location.search : "")).get("campaignId");
  return v ? Number(v) : undefined;
}

type ScrapedBusiness = {
  name: string;
  category: string | null;
  subcategory: string | null;
  osmType: string | null;
  osmId: number | null;
  wikidataId: string | null;
  wikipedia: string | null;
  address: string | null;
  housenumber: string | null;
  street: string | null;
  neighbourhood: string | null;
  suburb: string | null;
  postcode: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  phone: string | null;
  mobile: string | null;
  email: string | null;
  website: string | null;
  facebook: string | null;
  twitter: string | null;
  instagram: string | null;
  linkedin: string | null;
  youtube: string | null;
  openingHours: string | null;
  cuisine: string | null;
  description: string | null;
  wheelchair: string | null;
  wifi: string | null;
  takeaway: string | null;
  delivery: string | null;
  outdoorSeating: string | null;
  smoking: string | null;
  reservation: string | null;
  parking: string | null;
  airConditioning: string | null;
  paymentCash: string | null;
  paymentCard: string | null;
  capacity: string | null;
  stars: string | null;
  latitude: string | null;
  longitude: string | null;
  bingUrl: string | null;
  osmUrl: string | null;
  googleMapsUrl: string | null;
  rating: string | null;
  reviewsCount: number | null;
  source: string;
  extraTags: string | null;
  detailCount: number;
  popularity: number | null;
};

type SearchResponse = {
  searchId?: number;
  sector?: string;
  location?: string;
  count?: number;
  total?: number;
  enriched?: number;
  sources?: string[];
  note?: string;
  results?: ScrapedBusiness[];
  error?: string;
};

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  bing_maps: { label: "Bing Maps", color: "bg-sky-50 text-sky-700 border-sky-200" },
  openstreetmap: { label: "OpenStreetMap", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  photon: { label: "Photon (OSM)", color: "bg-violet-50 text-violet-700 border-violet-200" },
};

type Props = {
  sector: string;
  location: string;
  initialResults?: ScrapedBusiness[];
  campaignId?: number;
  initialCampaign?: { id: number; name: string } | null;
};

export default function SearchClient({
  sector: initialSector,
  location: initialLocation,
  initialResults,
  campaignId: initialCampaignId,
  initialCampaign,
}: Props) {
  const router = useRouter();
  const [sector, setSector] = useState(initialSector);
  const [location, setLocation] = useState(initialLocation);
  const [loading, setLoading] = useState(!initialResults);
  const [results, setResults] = useState<ScrapedBusiness[]>(initialResults || []);
  const [count, setCount] = useState<number>(initialResults?.length ?? 0);
  const [enrichedCount, setEnrichedCount] = useState<number>(0);
  const [sources, setSources] = useState<string[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [sort, setSort] = useState<"popularity" | "details" | "name" | "reviews">("popularity");
  // Filters
  const [showOnlyWithPhone, setShowOnlyWithPhone] = useState(false);
  const [showOnlyWithWebsite, setShowOnlyWithWebsite] = useState(false);
  const [showOnlyWithHours, setShowOnlyWithHours] = useState(false);
  const [showOnlyWithEmail, setShowOnlyWithEmail] = useState(false);
  const [showOnlyWithReviews, setShowOnlyWithReviews] = useState(false);
  const [showOnlyWithDescription, setShowOnlyWithDescription] = useState(false);
  const [showOnlyWithSocial, setShowOnlyWithSocial] = useState(false);
  const [showOnlyWithCuisine, setShowOnlyWithCuisine] = useState(false);
  const [showOnlyWithValidWhatsapp, setShowOnlyWithValidWhatsapp] = useState(false);
  const [excludeNoWebsite, setExcludeNoWebsite] = useState(false);
  const [onlyNoWebsite, setOnlyNoWebsite] = useState(true); // DEFAULT: prospects only
  const [minPopularity, setMinPopularity] = useState(0);
  const [selected, setSelected] = useState<ScrapedBusiness | null>(null);
  const [selectedForProspect, setSelectedForProspect] = useState<Set<string>>(new Set());
  const [bulkProspecting, setBulkProspecting] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ ok: boolean; imported: number; errors: number } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<Map<string, boolean>>(new Map());
  const [checkingWhatsapp, setCheckingWhatsapp] = useState(false);
  const startedRef = useRef(false);
  const [progress, setProgress] = useState(0);
  const [campaign, setCampaign] = useState<{ id: number; name: string } | null>(initialCampaign || null);

  // Fetch campaign info if campaignId is set and we don't have it
  useEffect(() => {
    if (!initialCampaignId || campaign) return;
    fetch(`/api/campaigns/${initialCampaignId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.campaign) setCampaign(data.campaign);
      })
      .catch(() => {});
  }, [initialCampaignId, campaign]);

  const runSearch = useCallback(
    async (sec: string, loc: string) => {
      setLoading(true);
      setError(null);
      setNote(null);
      setResults([]);
      setCount(0);
      setEnrichedCount(0);
      setSources([]);
      setProgress(0);
      setSelected(null);
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sector: sec, location: loc }),
        });
        const data: SearchResponse = await res.json();
        if (!res.ok) {
          throw new Error(
            data.error || `Erreur HTTP ${res.status}` || "Erreur inconnue"
          );
        }
        setResults(data.results || []);
        setCount(data.count || 0);
        setEnrichedCount(data.enriched || 0);
        setSources(data.sources || []);
        setNote(data.note || null);
        setProgress(100);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (initialResults) return;
    if (startedRef.current) return;
    if (!sector.trim() || !location.trim()) {
      setError("Veuillez renseigner le secteur et la localisation dans la barre de recherche ci-dessus.");
      return;
    }
    startedRef.current = true;
    runSearch(sector, location);
    const interval = setInterval(() => {
      setProgress((p) => (p < 80 ? p + 1.2 : p));
    }, 800);
    return () => clearInterval(interval);
  }, [sector, location, runSearch, initialResults]);

  // Auto-check WhatsApp numbers after results load
  useEffect(() => {
    if (results.length === 0 || checkingWhatsapp) return;
    const withPhone = results.filter((r) => r.phone && r.phone.replace(/[^0-9]/g, "").length >= 8);
    if (withPhone.length === 0) return;
    setCheckingWhatsapp(true);
    const chunks: Array<{ phone: string; country?: string }>[] = [];
    for (let i = 0; i < withPhone.length; i += 20) {
      chunks.push(withPhone.slice(i, i + 20).map((r) => ({ phone: r.phone!, country: r.country || undefined })));
    }
    (async () => {
      const newMap = new Map<string, boolean>();
      for (const chunk of chunks) {
        try {
          const res = await fetch("/api/whatsapp/check-numbers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ numbers: chunk }),
          });
          const data = await res.json();
          if (data.results) {
            for (const r of data.results) {
              newMap.set(r.phone, r.exists);
            }
          }
        } catch {}
      }
      setWhatsappStatus(newMap);
      setCheckingWhatsapp(false);
    })();
  }, [results]);

  const filtered = useMemo(() => {
    return results
      .filter((r) => {
        if (sourceFilter !== "all" && r.source !== sourceFilter) return false;
        if (showOnlyWithPhone && !r.phone) return false;
        if (showOnlyWithWebsite && !r.website) return false;
        if (showOnlyWithHours && !r.openingHours) return false;
        if (showOnlyWithEmail && !r.email) return false;
        if (showOnlyWithReviews && !r.reviewsCount) return false;
        if (showOnlyWithDescription && !r.description) return false;
        if (showOnlyWithSocial && !r.facebook && !r.instagram && !r.twitter && !r.linkedin) return false;
        if (showOnlyWithCuisine && !r.cuisine) return false;
        if (showOnlyWithValidWhatsapp && whatsappStatus.get(r.phone || "") !== true) return false;
        if (excludeNoWebsite && !r.website) return false;
        if (onlyNoWebsite && r.website) return false;
        if (minPopularity > 0 && (r.popularity || 0) < minPopularity) return false;
        if (query.trim()) {
          const q = query.toLowerCase();
          return (
            r.name.toLowerCase().includes(q) ||
            (r.address || "").toLowerCase().includes(q) ||
            (r.city || "").toLowerCase().includes(q) ||
            (r.category || "").toLowerCase().includes(q) ||
            (r.cuisine || "").toLowerCase().includes(q) ||
            (r.phone || "").toLowerCase().includes(q) ||
            (r.website || "").toLowerCase().includes(q) ||
            (r.description || "").toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name);
        if (sort === "details") return b.detailCount - a.detailCount;
        if (sort === "reviews") {
          return (b.reviewsCount || 0) - (a.reviewsCount || 0);
        }
        return (b.popularity || 0) - (a.popularity || 0);
      });
  }, [results, query, sourceFilter, sort, showOnlyWithPhone, showOnlyWithWebsite, showOnlyWithHours, showOnlyWithEmail, showOnlyWithReviews, showOnlyWithDescription, showOnlyWithSocial, showOnlyWithCuisine, showOnlyWithValidWhatsapp, whatsappStatus, excludeNoWebsite, onlyNoWebsite, minPopularity]);

  const stats = useMemo(() => {
    const s = {
      total: results.length,
      withPhone: 0,
      withWebsite: 0,
      withHours: 0,
      withAddress: 0,
      withCuisine: 0,
      withEmail: 0,
      withSocial: 0,
      withDescription: 0,
      withWikipedia: 0,
      withRating: 0,
      withReviews: 0,
      complete: 0,
      avgPopularity: 0,
    };
    let totalPop = 0;
    for (const r of results) {
      if (r.phone) s.withPhone++;
      if (r.website) s.withWebsite++;
      if (r.openingHours) s.withHours++;
      if (r.street && r.city) s.withAddress++;
      if (r.cuisine) s.withCuisine++;
      if (r.email) s.withEmail++;
      if (r.facebook || r.instagram || r.twitter || r.linkedin) s.withSocial++;
      if (r.description) s.withDescription++;
      if (r.wikipedia) s.withWikipedia++;
      if (r.rating) s.withRating++;
      if (r.reviewsCount) s.withReviews++;
      if (r.detailCount >= 5) s.complete++;
      totalPop += r.popularity || 0;
    }
    s.avgPopularity = results.length > 0 ? Math.round(totalPop / results.length) : 0;
    return s;
  }, [results]);

  const onReSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!sector.trim() || !location.trim()) return;
    const params = new URLSearchParams({ sector, location });
    router.push(`/search?${params.toString()}`);
    startedRef.current = false;
    runSearch(sector, location);
  };

  const exportCsv = () => {
    if (results.length === 0) return;
    const headers = [
      "Nom", "Catégorie", "Sous-catégorie", "Cuisine", "Note", "Avis",
      "Description", "Adresse complète", "Rue", "Numéro", "Quartier", "Code postal",
      "Ville", "Région", "Pays", "Téléphone", "Mobile", "Email", "Site web",
      "Facebook", "Instagram", "Twitter", "LinkedIn", "Horaires",
      "Accessibilité", "Wi-Fi", "À emporter", "Livraison", "Terrasse", "Tabac",
      "Réservation", "Parking", "Climatisation", "Paiement cash", "Paiement carte",
      "Capacité", "Étoiles", "Latitude", "Longitude", "Wikidata", "Wikipedia",
      "Bing Maps", "OpenStreetMap", "Google Maps", "Popularité", "Détail count", "Source",
    ];
    const esc = (v: string | number | null | undefined) => {
      if (v == null) return "";
      const s = String(v);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };
    const lines = [headers.join(",")];
    for (const r of results) {
      lines.push([
        esc(r.name), esc(r.category), esc(r.subcategory), esc(r.cuisine),
        esc(r.rating), esc(r.reviewsCount), esc(r.description),
        esc(r.address), esc(r.street), esc(r.housenumber), esc(r.neighbourhood),
        esc(r.postcode), esc(r.city), esc(r.state), esc(r.country),
        esc(r.phone), esc(r.mobile), esc(r.email), esc(r.website),
        esc(r.facebook), esc(r.instagram), esc(r.twitter), esc(r.linkedin),
        esc(r.openingHours), esc(r.wheelchair), esc(r.wifi), esc(r.takeaway),
        esc(r.delivery), esc(r.outdoorSeating), esc(r.smoking), esc(r.reservation),
        esc(r.parking), esc(r.airConditioning), esc(r.paymentCash), esc(r.paymentCard),
        esc(r.capacity), esc(r.stars), esc(r.latitude), esc(r.longitude),
        esc(r.wikidataId), esc(r.wikipedia), esc(r.bingUrl), esc(r.osmUrl),
        esc(r.googleMapsUrl), esc(r.popularity), esc(r.detailCount), esc(r.source),
      ].join(","));
    }
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `business-${sector.replace(/\s+/g, "_")}-${location.replace(/\s+/g, "_").replace(/,/g, "")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleSelectAll = () => {
    if (selectedForProspect.size === filtered.length) {
      setSelectedForProspect(new Set());
    } else {
      setSelectedForProspect(new Set(filtered.map((r) => r.name)));
    }
  };

  const toggleSelectOne = (name: string) => {
    setSelectedForProspect((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const bulkProspect = async (targets: ScrapedBusiness[]) => {
    if (!initialCampaignId || targets.length === 0) return;
    setBulkProspecting(true);
    setBulkResult(null);
    try {
      const res = await fetch("/api/prospects/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businesses: targets.map((r) => ({
            name: r.name,
            category: r.category,
            subcategory: r.subcategory,
            address: r.address,
            phone: r.phone,
            email: r.email,
            website: r.website,
            city: r.city,
            postcode: r.postcode,
            country: r.country,
            rating: r.rating,
            description: r.description,
            latitude: r.latitude,
            longitude: r.longitude,
            source: r.source,
          })),
          campaignId: initialCampaignId,
        }),
      });
      const data = await res.json();
      setBulkResult({ ok: true, imported: data.imported || 0, errors: data.errors || 0 });
      setSelectedForProspect(new Set());
    } catch (e) {
      setBulkResult({ ok: false, imported: 0, errors: targets.length });
    } finally {
      setBulkProspecting(false);
    }
  };

  const activeFiltersCount = [
    showOnlyWithPhone, showOnlyWithWebsite, showOnlyWithHours, showOnlyWithEmail,
    showOnlyWithReviews, showOnlyWithDescription, showOnlyWithSocial, showOnlyWithCuisine,
    excludeNoWebsite, minPopularity > 0,
  ].filter(Boolean).length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="mx-auto max-w-[1380px] px-6 py-10 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
            </svg>
            Nouvelle recherche
          </Link>
          {results.length > 0 ? (
            <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Exporter CSV ({results.length} fiches)
            </button>
          ) : null}
        </div>

        {campaign && (
          <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border-2 border-violet-200 bg-violet-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-lg">📋</span>
              <span className="font-medium text-violet-900">Prospection pour la campagne :</span>
              <span className="rounded-lg bg-white px-2 py-0.5 font-bold text-violet-700">{campaign.name}</span>
              <span className="text-xs text-violet-600">Les prospects créés ici seront ajoutés à cette campagne.</span>
            </div>
            <Link
              href={`/campaigns/${campaign.id}`}
              className="rounded-lg bg-violet-600 px-3 py-1 text-xs font-semibold text-white hover:bg-violet-700"
            >
              Voir la campagne →
            </Link>
          </div>
        )}

        <form onSubmit={onReSearch} className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_24px_60px_rgba(15,23,42,0.06)] sm:p-6">
          <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
            <div>
              <label htmlFor="sector" className="mb-1 block text-xs font-medium text-slate-600">Secteur</label>
              <input id="sector" value={sector} onChange={(e) => setSector(e.target.value)} placeholder="ex. Restaurant, Pharmacie, Coiffeur…" className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div>
              <label htmlFor="location" className="mb-1 block text-xs font-medium text-slate-600">Localisation</label>
              <input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="ex. Paris, France" className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 disabled:opacity-60 sm:w-auto">
                {loading ? (
                  <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" /><path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg>Scraping…</>
                ) : (
                  <><svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-3.5-3.5" /></svg>Relancer</>
                )}
              </button>
            </div>
          </div>
          {loading ? (
            <div className="mt-3">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                Collecte des POIs via OpenStreetMap, puis enrichissement (téléphone, horaires, équipements, descriptions Wikipedia…). Cela peut prendre 1-3 minutes pour les grandes villes.
              </p>
            </div>
          ) : null}
        </form>

        {!loading && results.length > 0 ? (
          <>
            <section className="mt-6 grid gap-2 sm:grid-cols-4 lg:grid-cols-8">
              <StatCard label="Total" value={count} icon="📊" tone="slate" />
              <StatCard label="Complets" value={stats.complete} icon="⭐" tone="amber" />
              <StatCard label="📞 Tél" value={stats.withPhone} tone="blue" />
              <StatCard label="🌐 Site" value={stats.withWebsite} tone="blue" />
              <StatCard label="🕐 Horaires" value={stats.withHours} tone="green" />
              <StatCard label="📍 Adresse" value={stats.withAddress} tone="slate" />
              <StatCard label="📝 Desc" value={stats.withDescription} tone="violet" />
              <StatCard label="📚 Wiki" value={stats.withWikipedia} tone="amber" />
            </section>

            {sources.length > 0 ? (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-500">Sources :</span>
                {sources.map((s) => {
                  const meta = SOURCE_LABELS[s] || { label: s, color: "bg-slate-50 text-slate-700 border-slate-200" };
                  return <span key={s} className={`rounded-full border px-2.5 py-0.5 font-medium ${meta.color}`}>{meta.label}</span>;
                })}
                <span className="ml-2 text-slate-500">· Popularité moyenne : {stats.avgPopularity}/100</span>
              </div>
            ) : null}

            {note ? (
              <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                <p className="font-semibold">À propos des résultats</p>
                <p className="mt-1 text-blue-800/90">{note}</p>
              </div>
            ) : null}

            <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_340px]">
              <div className="space-y-3">
                {/* Top filter bar */}
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 lg:flex-row lg:items-center">
                  <div className="relative flex-1">
                    <svg viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="7" /><path d="m21 21-3.5-3.5" />
                    </svg>
                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filtrer par nom, adresse, cuisine, téléphone, site, description…" className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      showFilters || activeFiltersCount > 0
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                    </svg>
                    Filtres
                    {activeFiltersCount > 0 ? (
                      <span className="rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">{activeFiltersCount}</span>
                    ) : null}
                  </button>
                  <select value={sort} onChange={(e) => setSort(e.target.value as "popularity" | "details" | "name" | "reviews")} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-500">
                    <option value="popularity">Plus populaires</option>
                    <option value="details">Plus détaillés</option>
                    <option value="reviews">Plus d&apos;avis</option>
                    <option value="name">Nom A-Z</option>
                  </select>
                </div>

                {/* Advanced filters panel */}
                {showFilters ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-900">🎯 Filtres de prospection</h3>
                      <button onClick={() => {
                        setShowOnlyWithPhone(false);
                        setShowOnlyWithWebsite(false);
                        setShowOnlyWithHours(false);
                        setShowOnlyWithEmail(false);
                        setShowOnlyWithReviews(false);
                        setShowOnlyWithDescription(false);
                        setShowOnlyWithSocial(false);
                        setShowOnlyWithCuisine(false);
                        setExcludeNoWebsite(false);
                        setOnlyNoWebsite(true);
                        setMinPopularity(0);
                        setSourceFilter("all");
                      }} className="text-xs text-blue-600 hover:underline">Réinitialiser</button>
                    </div>
                    <div className="mb-3 rounded-xl border-2 border-amber-300 bg-white p-3">
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={onlyNoWebsite}
                          onChange={(e) => setOnlyNoWebsite(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded"
                        />
                        <div>
                          <p className="text-sm font-bold text-amber-900">🎯 Cible prospect uniquement</p>
                          <p className="text-xs text-amber-700">Affiche uniquement les business SANS site web (= clients potentiels)</p>
                        </div>
                      </label>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <FilterToggle icon="📞" label="Avec téléphone" checked={showOnlyWithPhone} onChange={setShowOnlyWithPhone} />
                      <FilterToggle icon="🌐" label="Avec site web" checked={showOnlyWithWebsite} onChange={setShowOnlyWithWebsite} />
                      <FilterToggle icon="🚫" label="Exclure sans site web" checked={excludeNoWebsite} onChange={setExcludeNoWebsite} />
                      <FilterToggle icon="🕐" label="Avec horaires" checked={showOnlyWithHours} onChange={setShowOnlyWithHours} />
                      <FilterToggle icon="✉️" label="Avec email" checked={showOnlyWithEmail} onChange={setShowOnlyWithEmail} />
                      <FilterToggle icon="📝" label="Avec description" checked={showOnlyWithDescription} onChange={setShowOnlyWithDescription} />
                      <FilterToggle icon="⭐" label="Avec note/avis" checked={showOnlyWithReviews} onChange={setShowOnlyWithReviews} />
                      <FilterToggle icon="📱" label="Avec réseaux sociaux" checked={showOnlyWithSocial} onChange={setShowOnlyWithSocial} />
                      <FilterToggle icon="🍽️" label="Avec type de cuisine" checked={showOnlyWithCuisine} onChange={setShowOnlyWithCuisine} />
                      <FilterToggle icon="✅" label="WhatsApp valide" checked={showOnlyWithValidWhatsapp} onChange={setShowOnlyWithValidWhatsapp} />
                    </div>
                    <div className="mt-4">
                      <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-700">
                        <span>Popularité minimale : {minPopularity}/100</span>
                        <span className="text-slate-400">{filtered.length}/{results.length} résultats</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={minPopularity}
                        onChange={(e) => setMinPopularity(parseInt(e.target.value, 10))}
                        className="w-full accent-blue-600"
                      />
                    </div>
                    <div className="mt-3">
                      <label className="mb-1 block text-xs font-medium text-slate-700">Source</label>
                      <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-blue-500">
                        <option value="all">Toutes les sources</option>
                        {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : null}

                <p className="text-xs text-slate-500">
                  {filtered.length} résultat{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""} sur {results.length}
                  {checkingWhatsapp && <span className="ml-2 text-blue-500">⏳ Vérification WhatsApp...</span>}
                  {!checkingWhatsapp && whatsappStatus.size > 0 && (
                    <span className="ml-2">
                      <span className="text-green-600 font-semibold">{Array.from(whatsappStatus.values()).filter(Boolean).length} WA ✓</span>
                      <span className="text-slate-400 mx-1">·</span>
                      <span className="text-red-500 font-semibold">{Array.from(whatsappStatus.values()).filter((v) => !v).length} WA ✗</span>
                    </span>
                  )}
                </p>

                {initialCampaignId && filtered.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={selectedForProspect.size === filtered.length && filtered.length > 0}
                        onChange={toggleSelectAll}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      Tout sélectionner ({filtered.length})
                    </label>
                    {selectedForProspect.size > 0 ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); bulkProspect(filtered.filter((r) => selectedForProspect.has(r.name))); }}
                        disabled={bulkProspecting}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:from-amber-600 hover:to-orange-600 disabled:opacity-50"
                      >
                        {bulkProspecting ? (
                          <><svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" /><path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg>Prospection...</>
                        ) : (
                          <>🎯 Prospecter ({selectedForProspect.size})</>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); bulkProspect(filtered); }}
                        disabled={bulkProspecting}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
                      >
                        {bulkProspecting ? (
                          <><svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" /><path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg>Prospection...</>
                        ) : (
                          <>🚀 Prospecter tout ({filtered.length})</>
                        )}
                      </button>
                    )}
                  </div>
                )}

                {bulkResult && (
                  <div className={`rounded-lg border-2 px-3 py-2 text-xs font-medium ${bulkResult.ok ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-red-300 bg-red-50 text-red-800"}`}>
                    {bulkResult.ok
                      ? `✅ ${bulkResult.imported} prospect${bulkResult.imported > 1 ? "s" : ""} créé${bulkResult.imported > 1 ? "s" : ""}${bulkResult.errors ? `, ${bulkResult.errors} erreur${bulkResult.errors > 1 ? "s" : ""}` : ""}`
                      : `❌ Erreur lors de la prospection`}
                    <button onClick={() => setBulkResult(null)} className="ml-2 underline">Fermer</button>
                  </div>
                )}

                <ul className="grid gap-3">
                  {filtered.map((r, i) => (
                    <BusinessCard
                      key={`${r.osmId || r.name}-${i}`}
                      b={r}
                      expanded={selected?.osmId === r.osmId && selected?.name === r.name}
                      campaignId={initialCampaignId}
                      selected={selectedForProspect.has(r.name)}
                      onSelect={() => toggleSelectOne(r.name)}
                      whatsappValid={r.phone ? whatsappStatus.get(r.phone) : undefined}
                      onToggle={() =>
                        setSelected(
                          selected?.osmId === r.osmId && selected?.name === r.name
                            ? null
                            : r
                        )
                      }
                    />
                  ))}
                </ul>
              </div>

              <aside className="hidden lg:block">
                <DetailPanel business={selected} />
              </aside>
            </div>
          </>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-semibold">Erreur</p>
            <p className="mt-1">{error}</p>
          </div>
        ) : null}

        {loading ? (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white" />
            ))}
          </div>
        ) : !loading && results.length === 0 && !error ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center text-sm text-slate-500">
            Aucun résultat. Essayez avec un autre secteur ou une autre localisation.
          </div>
        ) : null}
      </div>
    </main>
  );
}

function FilterToggle({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition ${
        checked
          ? "border-blue-500 bg-blue-50 text-blue-700"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
      }`}
    >
      <span>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {checked ? (
        <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : null}
    </button>
  );
}

function StatCard({
  label, value, icon, tone = "slate",
}: {
  label: string; value: string | number; icon?: string;
  tone?: "slate" | "blue" | "green" | "amber" | "violet";
}) {
  const tones: Record<string, string> = {
    slate: "from-slate-50 to-white border-slate-200",
    blue: "from-blue-50 to-white border-blue-200",
    green: "from-emerald-50 to-white border-emerald-200",
    amber: "from-amber-50 to-white border-amber-200",
    violet: "from-violet-50 to-white border-violet-200",
  };
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-3 shadow-sm ${tones[tone]}`}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        {icon ? <span className="text-base" aria-hidden>{icon}</span> : null}
      </div>
      <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function BusinessCard({ b, expanded, onToggle, campaignId, selected, onSelect, whatsappValid }: { b: ScrapedBusiness; expanded: boolean; onToggle: () => void; campaignId?: number; selected?: boolean; onSelect?: () => void; whatsappValid?: boolean }) {
  const sourceMeta = SOURCE_LABELS[b.source] || { label: b.source, color: "bg-slate-50 text-slate-700 border-slate-200" };
  const initials = b.name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("");
  const popularity = b.popularity || 0;
  const popColor = popularity >= 70 ? "text-emerald-700 bg-emerald-100" : popularity >= 40 ? "text-amber-700 bg-amber-100" : "text-slate-600 bg-slate-100";

  return (
    <li className="group rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:border-blue-300 hover:shadow-md">
      <div className="flex flex-col gap-3 p-4 sm:flex-row">
        <div className="flex items-start gap-3 sm:w-64 sm:shrink-0">
          {campaignId && onSelect && (
            <input
              type="checkbox"
              checked={selected}
              onChange={onSelect}
              className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              title="Sélectionner pour prospection en masse"
            />
          )}
          <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
            {initials || "B"}
            {whatsappValid !== undefined && (
              <span className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${whatsappValid ? "bg-green-500" : "bg-red-400"}`} title={whatsappValid ? "Numéro WhatsApp valide" : "Numéro non WhatsApp"} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <h3 className="truncate text-base font-semibold text-slate-900 flex-1" title={b.name}>{b.name}</h3>
              {b.rating ? (
                <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-xs font-bold text-amber-700">
                  ★ {b.rating}
                  {b.reviewsCount ? <span className="font-normal text-amber-600">({b.reviewsCount})</span> : null}
                </span>
              ) : null}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              {b.subcategory ? (
                <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-blue-700">{b.subcategory}</span>
              ) : null}
              {b.cuisine ? (
                <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700" title="Type de cuisine">🍽️ {b.cuisine}</span>
              ) : null}
              {b.stars ? (
                <span className="rounded-md bg-yellow-50 px-1.5 py-0.5 text-[10px] font-medium text-yellow-700">{"★".repeat(parseInt(b.stars) || 1)}</span>
              ) : null}
              <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${popColor}`} title={`Score de popularité basé sur ${b.detailCount} champs remplis`}>
                ⚡ {popularity}
              </span>
              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${sourceMeta.color}`}>{sourceMeta.label}</span>
            </div>
            {b.description ? (
              <p className="mt-1.5 line-clamp-2 text-xs text-slate-600" title={b.description}>
                {b.description}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-2">
          {b.address || (b.street && b.city) ? (
            <InfoIcon icon="📍" label="Adresse" value={
              <span className="line-clamp-1" title={b.address || ""}>
                {[b.housenumber, b.street, [b.postcode, b.city].filter(Boolean).join(" ")].filter(Boolean).join(", ")}
              </span>
            } />
          ) : null}
          {b.phone ? (
            <InfoIcon icon="📞" label="Téléphone" value={
              <span className="flex items-center gap-1.5">
                <a href={`tel:${b.phone}`} className="font-medium text-blue-700 hover:underline">{b.phone}</a>
                {whatsappValid === true && <span className="text-[10px] font-bold text-green-600">WA ✓</span>}
                {whatsappValid === false && <span className="text-[10px] font-bold text-red-500">WA ✗</span>}
              </span>
            } />
          ) : null}
          {b.website ? (
            <InfoIcon icon="🌐" label="Site web" value={
              <a href={b.website} target="_blank" rel="noreferrer" className="truncate font-medium text-blue-700 hover:underline" title={b.website}>
                {(() => { try { return new URL(b.website).hostname.replace("www.", ""); } catch { return b.website; } })()}
              </a>
            } />
          ) : null}
          {b.openingHours ? (
            <InfoIcon icon="🕐" label="Horaires" value={
              <span className="line-clamp-1" title={b.openingHours}>{b.openingHours}</span>
            } />
          ) : null}
          {b.email ? (
            <InfoIcon icon="✉️" label="Email" value={
              <a href={`mailto:${b.email}`} className="truncate font-medium text-blue-700 hover:underline">{b.email}</a>
            } />
          ) : null}
          {b.cuisine ? <InfoIcon icon="🍽️" label="Cuisine" value={b.cuisine} /> : null}
          {b.reviewsCount ? <InfoIcon icon="⭐" label="Avis" value={`${b.reviewsCount} avis`} /> : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 bg-slate-50/40 px-4 py-2">
        {b.wheelchair === "yes" && <Badge tone="blue">♿ Accessible</Badge>}
        {b.wheelchair === "limited" && <Badge tone="amber">♿ Partiel</Badge>}
        {b.wifi === "yes" && <Badge tone="blue">📶 Wi-Fi</Badge>}
        {b.outdoorSeating === "yes" && <Badge tone="green">☀️ Terrasse</Badge>}
        {b.takeaway === "yes" && <Badge tone="purple">🥡 À emporter</Badge>}
        {b.delivery === "yes" && <Badge tone="purple">🚚 Livraison</Badge>}
        {b.reservation === "yes" && <Badge tone="green">📅 Réservation</Badge>}
        {b.airConditioning === "yes" && <Badge tone="blue">❄️ Clim</Badge>}
        {b.parking && b.parking !== "no" && <Badge tone="slate">🅿️ {b.parking}</Badge>}
        {b.paymentCard && <Badge tone="slate">💳 CB</Badge>}
        {b.facebook && <Badge tone="blue">📘 Facebook</Badge>}
        {b.instagram && <Badge tone="violet">📷 Instagram</Badge>}
        {b.twitter && <Badge tone="blue">🐦 Twitter</Badge>}
        {b.linkedin && <Badge tone="blue">💼 LinkedIn</Badge>}
        {b.wikipedia && <Badge tone="amber">📚 Wikipedia</Badge>}

        <div className="ml-auto flex items-center gap-1.5">
          {b.phone && (
            <a href={`tel:${b.phone}`} className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white transition hover:bg-slate-700">
              📞 Appeler
            </a>
          )}
          {b.website && (
            <a href={b.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700">
              🌐 Visiter
            </a>
          )}
          {b.googleMapsUrl && (
            <a href={b.googleMapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md bg-amber-600 px-2 py-1 text-[10px] font-semibold text-white transition hover:bg-amber-700" title="Voir les avis clients sur Google Maps">
              ⭐ Avis Google
            </a>
          )}
          {b.bingUrl && (
            <a href={b.bingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md bg-sky-600 px-2 py-1 text-[10px] font-semibold text-white transition hover:bg-sky-700">
              📍 Bing
            </a>
          )}
          <ConvertToProspectButton business={b} campaignId={campaignId} />
          <button onClick={onToggle} className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700">
            {expanded ? "Réduire" : "Détails"}
            <svg viewBox="0 0 24 24" fill="none" className={`h-3 w-3 transition ${expanded ? "rotate-180" : ""}`} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </div>

      {expanded ? <ExpandedDetails b={b} /> : null}
    </li>
  );
}

function ExpandedDetails({ b }: { b: ScrapedBusiness }) {
  const extraTagsParsed = b.extraTags ? safeJson(b.extraTags) : null;
  const otherTags = extraTagsParsed
    ? Object.entries(extraTagsParsed).filter(([k]) => ![
        "phone", "contact:phone", "mobile", "contact:mobile", "email", "contact:email",
        "website", "contact:website", "url", "opening_hours", "cuisine", "description",
        "note", "wheelchair", "wifi", "internet_access", "takeaway", "delivery",
        "delivery:food", "outdoor_seating", "smoking", "reservation", "parking",
        "air_conditioning", "payment:cash", "payment_cash", "payment:credit_cards",
        "payment:debit_cards", "payment:cards", "capacity", "stars", "contact:facebook",
        "facebook", "contact:twitter", "twitter", "contact:instagram", "instagram",
        "contact:linkedin", "linkedin", "contact:youtube", "youtube", "wikidata", "wikipedia",
        "addr:housenumber", "addr:street", "addr:postcode", "addr:city", "addr:suburb",
        "addr:country", "addr:neighbourhood", "addr:quarter", "name", "name:fr", "ref",
      ].includes(k))
    : [];

  return (
    <div className="grid gap-4 border-t border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-2 lg:grid-cols-3">
      {b.description ? (
        <Section title="Description">
          <p className="text-sm text-slate-700">{b.description}</p>
          {b.wikipedia ? (
            <a href={b.wikipedia} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[10px] text-blue-600 hover:underline">
              📚 Lire sur Wikipedia
            </a>
          ) : null}
        </Section>
      ) : null}

      <Section title="Adresse complète">
        <div className="text-sm text-slate-700">
          {b.housenumber || b.street ? <div>{b.housenumber} {b.street}</div> : null}
          {b.neighbourhood ? <div>{b.neighbourhood}</div> : null}
          {b.suburb ? <div>{b.suburb}</div> : null}
          {b.postcode || b.city ? <div>{b.postcode} {b.city}</div> : null}
          {b.state ? <div>{b.state}</div> : null}
          {b.country ? <div>{b.country}</div> : null}
        </div>
      </Section>

      {(b.phone || b.mobile || b.email || b.website) && (
        <Section title="Contact">
          <div className="space-y-1 text-sm">
            {b.phone ? <div><span className="text-slate-500">Tél :</span> <a href={`tel:${b.phone}`} className="font-medium text-blue-700 hover:underline">{b.phone}</a></div> : null}
            {b.mobile ? <div><span className="text-slate-500">Mobile :</span> <a href={`tel:${b.mobile}`} className="font-medium text-blue-700 hover:underline">{b.mobile}</a></div> : null}
            {b.email ? <div><span className="text-slate-500">Email :</span> <a href={`mailto:${b.email}`} className="font-medium text-blue-700 hover:underline">{b.email}</a></div> : null}
            {b.website ? <div><span className="text-slate-500">Web :</span> <a href={b.website} target="_blank" rel="noreferrer" className="break-all font-medium text-blue-700 hover:underline">{b.website}</a></div> : null}
          </div>
        </Section>
      )}

      {b.openingHours ? (
        <Section title="Horaires d'ouverture">
          <p className="text-sm text-slate-700">{b.openingHours}</p>
          <a href="https://wiki.openstreetmap.org/wiki/Key:opening_hours" target="_blank" rel="noreferrer" className="mt-1 text-[10px] text-slate-400 hover:underline">Format OpenStreetMap</a>
        </Section>
      ) : null}

      {(b.facebook || b.instagram || b.twitter || b.linkedin || b.youtube) && (
        <Section title="Réseaux sociaux">
          <div className="flex flex-wrap gap-1.5">
            {b.facebook ? <SocialLink href={b.facebook} icon="📘" label="Facebook" /> : null}
            {b.instagram ? <SocialLink href={b.instagram} icon="📷" label="Instagram" /> : null}
            {b.twitter ? <SocialLink href={b.twitter} icon="🐦" label="Twitter" /> : null}
            {b.linkedin ? <SocialLink href={b.linkedin} icon="💼" label="LinkedIn" /> : null}
            {b.youtube ? <SocialLink href={b.youtube} icon="▶️" label="YouTube" /> : null}
          </div>
        </Section>
      )}

      {(b.wheelchair || b.wifi || b.parking || b.outdoorSeating || b.airConditioning || b.reservation || b.takeaway || b.delivery) && (
        <Section title="Équipements & services">
          <div className="grid grid-cols-2 gap-1.5 text-sm">
            {b.wheelchair && <EquipLine label="♿ Accès handicapé" value={b.wheelchair} />}
            {b.wifi && <EquipLine label="📶 Wi-Fi" value={b.wifi} />}
            {b.parking && <EquipLine label="🅿️ Parking" value={b.parking} />}
            {b.outdoorSeating && <EquipLine label="☀️ Terrasse" value={b.outdoorSeating} />}
            {b.airConditioning && <EquipLine label="❄️ Climatisation" value={b.airConditioning} />}
            {b.reservation && <EquipLine label="📅 Réservation" value={b.reservation} />}
            {b.takeaway && <EquipLine label="🥡 À emporter" value={b.takeaway} />}
            {b.delivery && <EquipLine label="🚚 Livraison" value={b.delivery} />}
            {b.smoking && <EquipLine label="🚬 Tabac" value={b.smoking} />}
            {b.paymentCash && <EquipLine label="💵 Espèces" value={b.paymentCash} />}
            {b.paymentCard && <EquipLine label="💳 CB" value={b.paymentCard} />}
            {b.capacity && <EquipLine label="👥 Capacité" value={b.capacity} />}
          </div>
        </Section>
      )}

      <Section title="Voir sur les cartes">
        <div className="flex flex-col gap-1.5">
          {b.googleMapsUrl && (
            <a href={b.googleMapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-amber-700 hover:underline">
              ⭐ Avis Google Maps
            </a>
          )}
          {b.bingUrl && <a href={b.bingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-sky-700 hover:underline">📍 Bing Maps</a>}
          {b.osmUrl && <a href={b.osmUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-emerald-700 hover:underline">🗺️ OpenStreetMap</a>}
          {b.wikipedia && <a href={b.wikipedia} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-blue-700 hover:underline">📚 Wikipedia</a>}
        </div>
      </Section>

      {b.latitude && b.longitude ? (
        <Section title="Coordonnées GPS">
          <code className="block font-mono text-xs text-slate-600">{parseFloat(b.latitude).toFixed(6)}, {parseFloat(b.longitude).toFixed(6)}</code>
        </Section>
      ) : null}

      {otherTags.length > 0 ? (
        <Section title={`Autres tags OSM (${otherTags.length})`} className="sm:col-span-2 lg:col-span-3">
          <div className="grid grid-cols-1 gap-x-4 gap-y-0.5 sm:grid-cols-2 lg:grid-cols-3">
            {otherTags.slice(0, 30).map(([k, v]) => (
              <div key={k} className="text-xs text-slate-600">
                <span className="font-medium text-slate-500">{k}:</span>{" "}
                <span className="text-slate-700">{String(v)}</span>
              </div>
            ))}
          </div>
        </Section>
      ) : null}
    </div>
  );
}

function DetailPanel({ business }: { business: ScrapedBusiness | null }) {
  if (!business) {
    return (
      <div className="sticky top-6 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center text-sm text-slate-500">
        <p className="text-2xl">👈</p>
        <p className="mt-2 font-medium text-slate-700">Cliquez sur &quot;Détails&quot;</p>
        <p className="mt-1 text-xs text-slate-400">pour voir toutes les informations du business dans une vue détaillée</p>
      </div>
    );
  }
  return (
    <div className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto rounded-2xl border border-blue-200 bg-white p-5 shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <h2 className="truncate text-lg font-bold text-slate-900">{business.name}</h2>
        {business.rating ? (
          <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-xs font-bold text-amber-700">
            ★ {business.rating}
          </span>
        ) : null}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1">
        {business.subcategory && <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">{business.subcategory}</span>}
        {business.cuisine && <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">🍽️ {business.cuisine}</span>}
        {business.popularity != null ? (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">⚡ {business.popularity}/100</span>
        ) : null}
      </div>
      {business.description ? (
        <p className="mt-3 line-clamp-4 text-xs text-slate-600">{business.description}</p>
      ) : null}

      <div className="mt-4 space-y-2.5 text-sm">
        {(business.address || business.street) && (
          <Field label="Adresse" value={
            <div className="text-slate-700">
              {business.housenumber || business.street ? <div>{business.housenumber} {business.street}</div> : null}
              {business.postcode || business.city ? <div>{business.postcode} {business.city}</div> : null}
            </div>
          } />
        )}
        {business.phone && <Field label="Téléphone" value={<a href={`tel:${business.phone}`} className="font-medium text-blue-700 hover:underline">{business.phone}</a>} />}
        {business.website && <Field label="Site web" value={<a href={business.website} target="_blank" rel="noreferrer" className="break-all font-medium text-blue-700 hover:underline">{business.website}</a>} />}
        {business.email && <Field label="Email" value={<a href={`mailto:${business.email}`} className="font-medium text-blue-700 hover:underline">{business.email}</a>} />}
        {business.openingHours && <Field label="Horaires" value={<span className="text-slate-700">{business.openingHours}</span>} />}
        {business.reviewsCount ? <Field label="Avis" value={<span className="text-slate-700">{business.reviewsCount} avis {business.rating ? `(note: ${business.rating})` : ""}</span>} /> : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-1.5">
        {business.googleMapsUrl && <a href={business.googleMapsUrl} target="_blank" rel="noreferrer" className="rounded-md bg-amber-600 px-3 py-1.5 text-center text-xs font-semibold text-white hover:bg-amber-700">⭐ Avis Google</a>}
        {business.bingUrl && <a href={business.bingUrl} target="_blank" rel="noreferrer" className="rounded-md bg-sky-600 px-3 py-1.5 text-center text-xs font-semibold text-white hover:bg-sky-700">📍 Bing</a>}
        {business.osmUrl && <a href={business.osmUrl} target="_blank" rel="noreferrer" className="rounded-md bg-emerald-600 px-3 py-1.5 text-center text-xs font-semibold text-white hover:bg-emerald-700">🗺️ OSM</a>}
        {business.phone && <a href={`tel:${business.phone}`} className="rounded-md bg-slate-900 px-3 py-1.5 text-center text-xs font-semibold text-white hover:bg-slate-700">📞 Appeler</a>}
        {business.website && <a href={business.website} target="_blank" rel="noreferrer" className="rounded-md border border-slate-200 px-3 py-1.5 text-center text-xs font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700">🌐 Visiter</a>}
        {business.wikipedia && <a href={business.wikipedia} target="_blank" rel="noreferrer" className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-center text-xs font-semibold text-amber-700 hover:border-amber-300 col-span-2">📚 Lire sur Wikipedia</a>}
      </div>
    </div>
  );
}

function Section({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{title}</h4>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <div className="mt-0.5">{value}</div>
    </div>
  );
}

function InfoIcon({ icon, label, value }: { icon: string; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-1.5">
      <span className="text-slate-400">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400">{label}</p>
        <div className="text-xs text-slate-700">{value}</div>
      </div>
    </div>
  );
}

function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "blue" | "amber" | "green" | "violet" | "purple" }) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
    purple: "bg-violet-50 text-violet-700 border-violet-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${tones[tone]}`}>{children}</span>
  );
}

function SocialLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 transition hover:border-blue-300 hover:text-blue-700">
      <span>{icon}</span> {label}
    </a>
  );
}

function EquipLine({ label, value }: { label: string; value: string }) {
  const yes = value === "yes";
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span>{label}</span>
      <span className={`ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-medium ${yes ? "bg-emerald-100 text-emerald-700" : value === "no" ? "bg-slate-100 text-slate-500" : "bg-amber-100 text-amber-700"}`}>
        {value}
      </span>
    </div>
  );
}

function safeJson(s: string): Record<string, unknown> | null {
  try { return JSON.parse(s); } catch { return null; }
}

function ConvertToProspectButton({ business, campaignId }: { business: ScrapedBusiness; campaignId?: number }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const convert = async () => {
    setLoading(true);
    setError(null);
    try {
      // Send the full business data so a new business row can be created
      // in the same call (since search results are not in the DB yet
      // unless reloaded from a saved search).
      const payload: any = {
        campaignId,
        newBusiness: {
          searchId: 1, // Default search
          name: business.name,
          category: business.category,
          subcategory: business.subcategory,
          osmType: business.osmType,
          osmId: business.osmId,
          wikidataId: business.wikidataId,
          wikipedia: business.wikipedia,
          address: business.address,
          housenumber: business.housenumber,
          street: business.street,
          neighbourhood: business.neighbourhood,
          suburb: business.suburb,
          postcode: business.postcode,
          city: business.city,
          state: business.state,
          country: business.country,
          phone: business.phone,
          mobile: business.mobile,
          email: business.email,
          website: business.website,
          facebook: business.facebook,
          twitter: business.twitter,
          instagram: business.instagram,
          linkedin: business.linkedin,
          youtube: business.youtube,
          openingHours: business.openingHours,
          cuisine: business.cuisine,
          description: business.description,
          wheelchair: business.wheelchair,
          wifi: business.wifi,
          takeaway: business.takeaway,
          delivery: business.delivery,
          outdoorSeating: business.outdoorSeating,
          smoking: business.smoking,
          reservation: business.reservation,
          parking: business.parking,
          airConditioning: business.airConditioning,
          paymentCash: business.paymentCash,
          paymentCard: business.paymentCard,
          capacity: business.capacity,
          stars: business.stars,
          latitude: business.latitude,
          longitude: business.longitude,
          bingUrl: business.bingUrl,
          osmUrl: business.osmUrl,
          googleMapsUrl: business.googleMapsUrl,
          rating: business.rating,
          reviewsCount: business.reviewsCount,
          source: business.source,
          extraTags: business.extraTags,
        },
      };
      const res = await fetch("/api/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.prospect) {
        throw new Error(data.error || "Erreur");
      }
      router.push(`/prospects/${data.prospect.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={convert}
      disabled={loading}
      title={error || "Convertir en prospect et générer le workflow WhatsApp"}
      className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-1 text-[10px] font-bold text-white shadow-sm transition hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 whitespace-nowrap"
    >
      {loading ? (
        <span className="flex items-center gap-1">
          <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
            <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
          <span>Génération...</span>
        </span>
      ) : (
        <>🎯 Prospecter</>
      )}
    </button>
  );
}
