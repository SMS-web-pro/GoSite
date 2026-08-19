"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type Item = {
  id: number;
  sector: string;
  location: string;
  status: string;
  resultsCount: number;
  createdAt: Date | string;
};

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  running: "bg-amber-50 text-amber-700 border-amber-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  pending: "bg-slate-50 text-slate-600 border-slate-200",
};

const STATUS_LABELS: Record<string, string> = {
  completed: "Terminé",
  running: "En cours",
  failed: "Échec",
  pending: "En attente",
};

function timeAgo(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const days = Math.floor(h / 24);
  return `il y a ${days} j`;
}

export default function RecentSearches({ items }: { items: Item[] }) {
  const router = useRouter();

  const relaunch = (it: Item) => {
    const params = new URLSearchParams({
      sector: it.sector,
      location: it.location,
    });
    router.push(`/search?${params.toString()}`);
  };

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((it) => (
        <li
          key={it.id}
          className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-md"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-slate-900">
                {it.sector}
              </h3>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                  STATUS_STYLES[it.status] ?? STATUS_STYLES.pending
                }`}
              >
                {STATUS_LABELS[it.status] ?? it.status}
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              📍 {it.location} · {it.resultsCount} résultat
              {it.resultsCount > 1 ? "s" : ""} · {timeAgo(it.createdAt)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => relaunch(it)}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-600"
              title="Relancer cette recherche"
            >
              Relancer
            </button>
            {it.status === "completed" ? (
              <Link
                href={`/search/${it.id}`}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
              >
                Voir
              </Link>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
