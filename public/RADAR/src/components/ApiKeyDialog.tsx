/* ------------------------------------------------------------------ */
/*  Connexion de la clé Serper API — gateway vers les données réelles. */
/*  La clé est testée en direct (1 crédit) puis stockée localement.    */
/* ------------------------------------------------------------------ */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  ExternalLink,
  KeyRound,
  Loader2,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react";
import { SerperError, verifyKey } from "../lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (key: string, proxy?: string) => void;
  initialKey?: string;
  initialProxy?: string;
}

const STEPS = [
  {
    n: "1",
    text: "Créez un compte gratuit sur Serper — 2 500 crédits offerts à l'inscription, sans carte bancaire.",
    link: { href: "https://serper.dev/signup", label: "serper.dev/signup" },
  },
  {
    n: "2",
    text: "Sur votre dashboard, copiez votre clé dans la section « API Key ».",
    link: { href: "https://serper.dev/api-key", label: "serper.dev/api-key" },
  },
  {
    n: "3",
    text: "Collez-la ci-dessous. Coût : 3 crédits par page cartographiée (/maps, ~20 fiches) + 1 crédit par fiche pour les avis (/reviews).",
    link: { href: "https://serper.dev/dashboard", label: "Suivre ma consommation" },
  },
];

export default function ApiKeyDialog({ open, onClose, onSaved, initialKey = "", initialProxy = "" }: Props) {
  const [key, setKey] = useState(initialKey);
  const [proxy, setProxy] = useState(initialProxy);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Resynchronise les champs à chaque ouverture */
  useEffect(() => {
    if (open) {
      setKey(initialKey);
      setProxy(initialProxy);
      setError(null);
      setTesting(false);
    }
  }, [open, initialKey, initialProxy]);

  const verify = async () => {
    if (!key.trim()) {
      setError("Collez votre clé Serper pour continuer.");
      return;
    }
    setTesting(true);
    setError(null);
    try {
      await verifyKey({ apiKey: key, proxy: proxy || undefined });
      onSaved(key.trim(), proxy.trim() || undefined);
    } catch (e: unknown) {
      setError(
        e instanceof SerperError
          ? e.message
          : "Impossible de joindre Serper avec cette clé. Vérifiez-la puis réessayez."
      );
    } finally {
      setTesting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-ink/85 backdrop-blur-sm"
            onClick={() => !testing && onClose()}
          />
          <motion.div
            initial={{ opacity: 0, y: 26, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-panel"
          >
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-line-strong bg-raise text-lime">
                  <KeyRound className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="font-display text-base font-semibold text-zinc-100">
                    Connecter Serper API
                  </h2>
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-fog">
                    Google Maps en JSON — zéro invention
                  </p>
                </div>
              </div>
              <button
                onClick={() => !testing && onClose()}
                className="rounded-lg border border-line p-2 text-mist transition-colors hover:border-line-strong hover:text-zinc-100"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[62vh] space-y-5 overflow-y-auto px-6 py-5">
              <ol className="space-y-2.5">
                {STEPS.map((s) => (
                  <li key={s.n} className="flex gap-3 text-[13px] leading-relaxed text-mist">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-line-strong font-mono text-[10px] text-lime">
                      {s.n}
                    </span>
                    <span>
                      {s.text}{" "}
                      <a
                        href={s.link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 whitespace-nowrap font-medium text-radar u-sweep"
                      >
                        {s.link.label}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </span>
                  </li>
                ))}
              </ol>

              <div className="flex items-start gap-2.5 rounded-xl border border-lime/20 bg-lime/5 px-4 py-3 text-[12px] leading-relaxed text-mist">
                <Zap className="mt-0.5 h-4 w-4 shrink-0 text-lime" />
                <span>
                  Estimation de consommation : un audit de 20 fiches qualifiées coûte en moyenne{" "}
                  <strong className="text-zinc-100">35 à 60 crédits</strong> (pages /maps à 3
                  crédits + 1 crédit par lecture d'avis). Le total exact est affiché à la fin de
                  chaque audit — vos 2 500 crédits offerts couvrent ~50 audits.
                </span>
              </div>

              <div className="space-y-2">
                <label htmlFor="apikey" className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-fog">
                  Votre clé Serper
                </label>
                <input
                  id="apikey"
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="0b1d2c…"
                  spellCheck={false}
                  autoComplete="off"
                  className="w-full rounded-xl border border-line bg-ink px-4 py-3 font-mono text-[13px] text-zinc-100 placeholder:text-fog/60 focus:border-lime/60 focus:outline-none"
                />
              </div>

              <details className="group rounded-xl border border-line bg-ink/60 px-4 py-3">
                <summary className="flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.18em] text-fog transition-colors group-open:text-mist">
                  Option avancée — proxy CORS (seulement si la connexion échoue)
                </summary>
                <div className="pt-3">
                  <input
                    type="text"
                    value={proxy}
                    onChange={(e) => setProxy(e.target.value)}
                    placeholder="https://votre-proxy.example/?url="
                    spellCheck={false}
                    className="w-full rounded-lg border border-line bg-ink px-3 py-2.5 font-mono text-[12px] text-zinc-100 placeholder:text-fog/60 focus:border-lime/60 focus:outline-none"
                  />
                  <p className="pt-2 text-[11px] leading-relaxed text-fog">
                    Si votre navigateur bloque l'appel direct (extension, réseau d'entreprise),
                    renseignez l'URL d'un relais CORS. L'adresse Serper y sera ajoutée en paramètre encodé.
                  </p>
                </div>
              </details>

              {error && (
                <div className="flex gap-2.5 rounded-xl border border-red-400/25 bg-red-400/5 px-4 py-3 text-[12.5px] leading-relaxed text-red-300">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-start gap-2.5 rounded-xl border border-line bg-raise/60 px-4 py-3 text-[11.5px] leading-relaxed text-fog">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-radar" />
                <span>
                  La clé reste dans votre navigateur (localStorage). Les requêtes partent directement
                  vers google.serper.dev — aucune donnée ne transite par un serveur tiers.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-line px-6 py-4">
              <button
                onClick={() => !testing && onClose()}
                className="rounded-xl px-4 py-2.5 text-[13px] font-medium text-mist transition-colors hover:text-zinc-100"
              >
                Annuler
              </button>
              <button
                onClick={verify}
                disabled={testing}
                className="flex items-center gap-2 rounded-xl bg-lime px-5 py-2.5 font-display text-[13px] font-semibold text-ink transition-all hover:bg-radar disabled:cursor-wait disabled:opacity-70"
              >
                {testing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Test en direct (1 crédit)…
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Vérifier &amp; enregistrer
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
