import Link from "next/link";
import { getSettings } from "@/lib/settings";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
      <div className="mx-auto max-w-[1380px] px-6 py-10 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={2}>
                <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
              </svg>
              Accueil
            </Link>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">⚙️ Paramètres de l'agence</h1>
            <p className="text-sm text-slate-600">
              Configurez votre identité, vos tarifs et le lien de paiement envoyé aux prospects
            </p>
          </div>
        </div>
        <SettingsClient initialSettings={settings} />
      </div>
  );
}
