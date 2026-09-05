/* ------------------------------------------------------------------ */
/*  Orchestrateur d'audit — moteur de prospection multi-zones.         */
/*                                                                     */
/*  Phase 1 — Découverte : rotation sur toutes les zones du plan       */
/*            (villes puis régions en mode national).                  */
/*            Sources par zone : /maps → /maps near → /places.         */
/*  Phase 2 — Avis : /reviews, datation de l'activité récente.         */
/*  Phase 3 — Web : /search, confirme l'absence de site officiel,      */
/*            récupère e-mails et réseaux sociaux.                     */
/*  Garde-fou budgétaire : arrêt net au plafond de crédits.            */
/* ------------------------------------------------------------------ */

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AuditState,
  Brief,
  Business,
  Evaluation,
  Lang,
  LogKind,
  LogLine,
  RejectedItem,
  ReviewItem,
  WaStatus,
} from "../lib/types";
import {
  COUNTRIES,
  countryLabel,
  CREDIT_COST,
  fetchPlaceReviews,
  mapPlace,
  searchMaps,
  searchPlaces,
  SerperError,
  sleep,
  webSearchBusiness,
} from "../lib/api";
import { validateProspectWhatsApp } from "../lib/whatsappValidator";
import { baremeString, evaluateBusiness, reasonLabelFor } from "../lib/evaluate";

const WA_STORAGE = "prospectradar_wa_v1";

interface Source {
  kind: "maps" | "places";
  q: string;
  location?: string;
  maxPages: number;
  label: string;
}

const initialAudit: AuditState = {
  status: "idle",
  logs: [],
  scanned: 0,
  found: 0,
  pages: 0,
  credits: 0,
  tally: {},
  qualified: [],
  evaluations: {},
  rejected: [],
  error: null,
};

let logId = 0;
function makeLog(kind: LogKind, text: string): LogLine {
  return {
    id: ++logId,
    kind,
    text,
    time: new Date().toLocaleTimeString("fr-FR", { hour12: false }),
  };
}

function loadWaMap(): Record<string, WaStatus> {
  try {
    return JSON.parse(localStorage.getItem(WA_STORAGE) ?? "{}");
  } catch {
    return {};
  }
}

function toRejected(b: Business, ev: Evaluation): RejectedItem {
  return {
    id: b.id,
    name: b.name,
    rating: b.rating,
    reviewCount: b.reviewCount,
    reasons: ev.reasons,
    keys: ev.keys,
    mapsUrl: b.mapsUrl,
    zone: b.zone,
    business: b,
  };
}

export function useProspection() {
  const [audit, setAudit] = useState<AuditState>(initialAudit);
  const [waMap, setWaMap] = useState<Record<string, WaStatus>>(loadWaMap);
  const cancelRef = useRef(false);

  useEffect(() => {
    try {
      localStorage.setItem(WA_STORAGE, JSON.stringify(waMap));
    } catch {
      /* stockage indisponible — non bloquant */
    }
  }, [waMap]);

  const setWa = useCallback((placeId: string, status: WaStatus) => {
    setWaMap((m) => ({ ...m, [placeId]: status }));
  }, []);

  const reset = useCallback(() => {
    cancelRef.current = true;
    setAudit(initialAudit);
  }, []);

  const stop = useCallback(() => {
    cancelRef.current = true;
    setAudit((a) => ({
      ...a,
      status: "done",
      logs: [...a.logs, makeLog("warn", "Balayage interrompu — résultats partiels conservés")],
    }));
  }, []);

  /* ---------------- Repêchage manuel ---------------- */
  const promoteRejected = useCallback((ids: string[]) => {
    if (!ids.length) return;
    const idSet = new Set(ids);
    setAudit((a) => {
      const promotedItems = a.rejected.filter((r) => idSet.has(r.id));
      if (!promotedItems.length) return a;
      const already = new Set(a.qualified.map((b) => b.id));
      const additions = promotedItems
        .filter((r) => !already.has(r.id))
        .map((r) => ({ ...r.business, promoted: true }));
      return {
        ...a,
        qualified: [...a.qualified, ...additions],
        rejected: a.rejected.filter((r) => !idSet.has(r.id)),
        logs: [
          ...a.logs,
          makeLog(
            "ok",
            `Repêchage manuel — ${additions.length} fiche(s) validée(s) : ${additions.map((b) => b.name).join(", ")}`
          ),
        ],
      };
    });
  }, []);

  const demoteQualified = useCallback((id: string) => {
    setAudit((a) => {
      const biz = a.qualified.find((b) => b.id === id);
      if (!biz) return a;
      const ev = a.evaluations[id];
      const item: RejectedItem = {
        id: biz.id,
        name: biz.name,
        rating: biz.rating,
        reviewCount: biz.reviewCount,
        reasons: ev?.reasons ?? ["Retirée manuellement"],
        keys: ev?.keys ?? [],
        mapsUrl: biz.mapsUrl,
        zone: biz.zone,
        business: { ...biz, promoted: false },
      };
      return {
        ...a,
        qualified: a.qualified.filter((b) => b.id !== id),
        rejected: [item, ...a.rejected],
      };
    });
  }, []);

  /* ---------------- Audit ---------------- */
  const start = useCallback(async (brief: Brief, apiKey: string, proxy?: string) => {
    cancelRef.current = false;
    const isCancelled = () => cancelRef.current;

    const log = (kind: LogKind, text: string) =>
      setAudit((a) => ({ ...a, logs: [...a.logs, makeLog(kind, text)] }));

    const cfg = brief.criteria;
    let credits = 0;
    const budget = brief.maxCredits > 0 ? brief.maxCredits : Infinity;
    const spend = (n: number) => {
      credits += n;
      setAudit((a) => ({ ...a, credits: a.credits + n }));
    };
    const budgetLeft = () => budget - credits;
    const canSpend = (n: number) => budgetLeft() >= n;

    const tally = (ev: Evaluation) =>
      setAudit((a) => {
        const next = { ...a.tally };
        for (const k of ev.keys) {
          const label = reasonLabelFor(k, cfg);
          next[label] = (next[label] ?? 0) + 1;
        }
        return { ...a, tally: next };
      });

    setAudit({ ...initialAudit, status: "running" });

    /* garde-fou : un gl absent ou inconnu ne doit JAMAIS retomber sur le
       défaut US de Serper */
    const requestedGl = (brief.gl || "").toLowerCase();
    const gl = COUNTRIES.some((c) => c.code === requestedGl) ? requestedGl : "fr";
    const hl = brief.lang || "fr";
    if (gl !== requestedGl) {
      logSafe(
        "warn",
        `Code pays « ${brief.gl ?? "absent"} » non reconnu — repli explicite sur fr (France)`
      );
    }

    function logSafe(kind: LogKind, text: string) {
      setAudit((a) => ({ ...a, logs: [...a.logs, makeLog(kind, text)] }));
    }

    const zones = brief.zones.length ? brief.zones : [brief.ville];
    const country = countryLabel(gl);
    const perZoneTarget =
      brief.perZone > 0
        ? brief.perZone
        : Math.max(1, Math.ceil(brief.volume / Math.max(1, zones.length)));

    log("cmd", `Mission : "${brief.type.trim()}" · ${zones.length} zone(s) · objectif ${brief.volume} fiches`);
    log(
      "cmd",
      `PAYS CIBLÉ : ${gl.toUpperCase()}${country ? ` (${country})` : ""} · langue=${hl} · coordonnées & requêtes géocodées "${country}"`
    );
    log(
      "info",
      `Plan de balayage — ${zones.slice(0, 8).join(" · ")}${zones.length > 8 ? ` … +${zones.length - 8}` : ""}`
    );
    log(
      "info",
      `~${perZoneTarget} fiche(s)/zone · plafond ${budget === Infinity ? "illimité" : `${budget} crédits`}${brief.webEnrich ? " · approfondissement web ACTIF" : ""}`
    );
    log("info", `Barème — ${baremeString(cfg)}`);

    const seen = new Set<string>();
    const preQualified: Business[] = [];
    let firstPayloadLogged = false;
    let anyData = false;
    let lastErr: unknown = null;
    let budgetHit = false;

    try {
      /* ============ Phase 1 — Découverte multi-zones ============ */
      for (let z = 0; z < zones.length; z++) {
        if (isCancelled()) return;
        if (preQualified.length >= brief.volume) {
          log("ok", `Objectif de collecte atteint — zones restantes non explorées (crédits économisés)`);
          break;
        }
        if (!canSpend(CREDIT_COST.places)) {
          budgetHit = true;
          break;
        }

        const zone = zones[z];
        const location = [zone, country].filter(Boolean).join(", ");
        /* Requêtes explicites avec ancrage géographique complet pour éviter tout défaut US */
        const geoQuery1 = `${brief.type.trim()} ${zone}, ${country}`.trim().replace(/, $/, "");
        const geoQuery2 = gl === "fr"
          ? `${brief.type.trim()} à ${zone}`
          : `${brief.type.trim()} in ${zone}`;
        const geoQueryNear = `${brief.type.trim()} near ${zone}, ${country}`.trim().replace(/, $/, "");
        const zoneStart = preQualified.length;

        log(
          "cmd",
          `━━ Zone ${z + 1}/${zones.length} : ${zone} (${country}) ━━ (${preQualified.length}/${brief.volume} collectées · ${budget === Infinity ? "∞" : budgetLeft()} crédits restants)`
        );

        const sources: Source[] = [
          {
            kind: "maps",
            q: geoQuery1,
            location,
            maxPages: 3,
            label: `/maps {q:"${geoQuery1}", location:"${location}"}`,
          },
          {
            kind: "maps",
            q: geoQuery2,
            location,
            maxPages: 2,
            label: `/maps {q:"${geoQuery2}", location:"${location}"}`,
          },
          {
            kind: "places",
            q: geoQuery1,
            location,
            maxPages: 2,
            label: `/places {q:"${geoQuery1}", location:"${location}"} — repli`,
          },
          {
            kind: "maps",
            q: geoQueryNear,
            location,
            maxPages: 1,
            label: `/maps {q:"${geoQueryNear}"}`,
          },
        ];

        for (const src of sources) {
          if (isCancelled()) return;
          if (preQualified.length - zoneStart >= perZoneTarget) break;
          if (preQualified.length >= brief.volume) break;

          for (let page = 1; page <= src.maxPages; page++) {
            if (isCancelled()) return;
            if (preQualified.length - zoneStart >= perZoneTarget) break;

            const cost = src.kind === "maps" ? CREDIT_COST.maps : CREDIT_COST.places;
            if (!canSpend(cost)) {
              budgetHit = true;
              break;
            }

            log("cmd", `[${zone}] p${page} — ${src.label} (−${cost})`);

            let result;
            try {
              result =
                src.kind === "maps"
                  ? await searchMaps({
                      query: src.q, apiKey, gl, hl: hl as Lang,
                      page, location: src.location, proxy,
                    })
                  : await searchPlaces({
                      query: src.q, apiKey, gl, hl: hl as Lang,
                      page, location: src.location, proxy,
                    });
              spend(cost);
            } catch (e: unknown) {
              spend(cost);
              lastErr = e;
              log("warn", `Source inutilisable (${e instanceof SerperError ? e.message : "erreur"}) — suivante`);
              break;
            }
            if (isCancelled()) return;

            setAudit((a) => ({ ...a, pages: a.pages + 1, found: a.found + result.count }));
            if (result.count === 0) break;
            anyData = true;

            if (!firstPayloadLogged) {
              firstPayloadLogged = true;
              const first = result.places[0] as Record<string, unknown>;
              log(
                "raw",
                `Diagnostic — champs reçus : ${Object.keys(first).join(", ")}\n${JSON.stringify(first, null, 1).slice(0, 600)}`
              );
            }

            const seenBefore = seen.size;

            for (const raw of result.places) {
              if (isCancelled()) return;
              const business = mapPlace(raw, gl, zone);
              const key = business.cid ?? business.placeId ?? business.id;
              if (seen.has(key)) continue;
              seen.add(key);

              const ev = evaluateBusiness(business, cfg);
              if (!ev.qualified) tally(ev);

              setAudit((a) => ({
                ...a,
                scanned: a.scanned + 1,
                evaluations: { ...a.evaluations, [business.id]: ev },
                rejected: !ev.qualified ? [...a.rejected, toRejected(business, ev)] : a.rejected,
              }));

              if (ev.qualified) {
                preQualified.push(business);
                log(
                  "ok",
                  `~ [${zone}] ${business.name} — ${business.rating?.toFixed(1) ?? "?"}★ · ${business.reviewCount} avis`
                );
                if (preQualified.length - zoneStart >= perZoneTarget) break;
              } else {
                log("warn", `✗ [${zone}] ${business.name} — ${ev.reasons.join(" · ")}`);
              }
              await sleep(25);
            }

            if (seen.size === seenBefore) break;
            await sleep(300);
          }
          if (budgetHit) break;
        }

        const got = preQualified.length - zoneStart;
        log(got > 0 ? "ok" : "info", `━━ ${zone} : ${got} pré-qualifiée(s)`);
        if (budgetHit) {
          log("warn", `Plafond de ${budget} crédits atteint — arrêt de la découverte`);
          break;
        }
      }

      if (isCancelled()) return;
      if (!anyData && lastErr) {
        const msg =
          lastErr instanceof SerperError ? lastErr.message
          : lastErr instanceof Error ? lastErr.message
          : "Erreur inconnue.";
        setAudit((a) => ({ ...a, status: "error", error: msg, logs: [...a.logs, makeLog("err", msg)] }));
        return;
      }

      /* ============ Phase 2 — Avis ============ */
      const qualifiedLocal: Business[] = [];

      if (preQualified.length === 0) {
        log("cmd", "Aucune fiche pré-qualifiée — audit terminé");
      } else {
        log("cmd", `Phase 2 — avis /reviews pour ${preQualified.length} fiche(s) (1 crédit/fiche)`);

        for (const p of preQualified) {
          if (isCancelled()) return;
          if (qualifiedLocal.length >= brief.volume) break;

        let enriched = p;
          /* Repli en cascade pour les avis : cid → placeId → requête nommée.
             (Serper /reviews accepte placeId et q — cid est tenté en premier.) */
          let reviews: ReviewItem[] = [];
          let via = "";
          const attempts: Array<{ cid?: string; placeId?: string; q?: string; via: string }> = [];
          if (p.cid) attempts.push({ cid: p.cid, via: "cid" });
          if (p.placeId) attempts.push({ placeId: p.placeId, via: "placeId" });
          attempts.push({ q: `${p.name} ${p.zone || brief.ville}`.trim(), via: "q" });

          for (const at of attempts) {
            if (isCancelled()) return;
            if (reviews.length || !canSpend(CREDIT_COST.reviews)) break;
            try {
              reviews = await fetchPlaceReviews({
                cid: at.cid ?? null,
                placeId: at.placeId ?? null,
                q: at.q ?? null,
                apiKey,
                gl,
                hl: hl as Lang,
                proxy,
              });
              spend(CREDIT_COST.reviews);
              via = at.via;
            } catch {
              spend(CREDIT_COST.reviews);
              /* identifiant non accepté → essai suivant */
            }
          }

          if (reviews.length) {
            const lastIso =
              reviews.map((r) => r.publishTime).filter((d): d is string => !!d).sort().pop() ?? null;
            enriched = { ...p, reviews: reviews.slice(0, 6), lastReviewIso: lastIso };
            log("info", `↳ ${p.name} — ${reviews.length} avis récupérés (via ${via})`);
          } else {
            log("warn", `↳ ${p.name} — avis indisponibles (${attempts.length} essais) — conservée sans avis`);
          }
          if (isCancelled()) return;

          const ev = evaluateBusiness(enriched, cfg);
          if (ev.qualified) qualifiedLocal.push(enriched);
          else tally(ev);

          setAudit((a) => ({
            ...a,
            evaluations: { ...a.evaluations, [enriched.id]: ev },
            qualified: ev.qualified ? [...a.qualified, enriched] : a.qualified,
            rejected: !ev.qualified ? [...a.rejected, toRejected(enriched, ev)] : a.rejected,
          }));

          log(
            ev.qualified ? "ok" : "warn",
            ev.qualified
              ? `✓ [${enriched.zone}] ${enriched.name} — QUALIFIÉE`
              : `✗ ${enriched.name} — ${ev.reasons.join(" · ")}`
          );
          await sleep(150);
        }
      }

      /* ============ Phase 3 — Approfondissement web ============ */
      if (brief.webEnrich && qualifiedLocal.length > 0) {
        if (isCancelled()) return;
        log(
          "cmd",
          `Phase 3 — approfondissement web /search pour ${qualifiedLocal.length} fiche(s) (1 crédit/fiche)`
        );

        for (const b of qualifiedLocal) {
          if (isCancelled()) return;
          if (!canSpend(CREDIT_COST.search)) {
            log("warn", "Plafond de crédits atteint — approfondissement web interrompu");
            break;
          }

          try {
            const intel = await webSearchBusiness({
              name: b.name, zone: b.zone || brief.ville, apiKey,
              gl, hl: hl as Lang, proxy,
            });
            spend(CREDIT_COST.search);

            const web = { checked: true, ...intel };
            const enriched: Business = { ...b, web };

            /* Éjection UNIQUEMENT en cas de certitude forte (slug complet du
               nom dans le domaine). Un site « probable » est signalé sur la
               fiche et laissé à l'appréciation de l'opérateur. */
            const certain =
              cfg.requireNoWebsite &&
              !!intel.officialSite &&
              intel.officialConfidence === "high";

            if (certain) {
              const ev = evaluateBusiness({ ...enriched, websiteUri: intel.officialSite }, cfg);
              tally(ev);
              setAudit((a) => ({
                ...a,
                qualified: a.qualified.filter((q) => q.id !== b.id),
                evaluations: { ...a.evaluations, [b.id]: ev },
                rejected: [...a.rejected, toRejected({ ...enriched, websiteUri: intel.officialSite }, ev)],
              }));
              log("warn", `✗ ${b.name} — site officiel CONFIRMÉ (${intel.officialSite}) → écartée`);
            } else {
              setAudit((a) => ({
                ...a,
                qualified: a.qualified.map((q) => (q.id === b.id ? enriched : q)),
              }));
              const bits: string[] = [];
              if (intel.emails.length) bits.push(`${intel.emails.length} e-mail(s)`);
              if (intel.socials.length) bits.push(`${intel.socials.length} réseau(x)`);
              if (intel.directories.length) bits.push(`${intel.directories.length} annuaire(s)`);
              if (intel.officialSite) {
                bits.unshift(`site probable à vérifier : ${intel.officialSite}`);
              }
              log(
                intel.officialSite ? "warn" : "ok",
                `🌐 ${b.name} — ${
                  intel.officialSite
                    ? `site PROBABLE conservé (à vérifier): ${intel.officialSite}`
                    : "aucun site officiel confirmé"
                }${bits.length ? ` · ${bits.join(" · ")}` : ""}`
              );
            }
          } catch (e: unknown) {
            spend(CREDIT_COST.search);
            log("warn", `🌐 ${b.name} — recherche web échouée (${e instanceof SerperError ? e.message : "erreur"})`);
          }
          await sleep(140);
        }
      }

      if (isCancelled()) return;

      /* ============ Phase 4 — Validation WhatsApp 100 % automatique en direct ============ */
      const targetBiz = qualifiedLocal;
      if (targetBiz.length > 0) {
        log("cmd", `Phase 4 — validation WhatsApp 100 % en direct pour ${targetBiz.length} prospect(s)`);

        for (const b of targetBiz) {
          if (isCancelled()) return;

          const waResult = await validateProspectWhatsApp({
            rawPhone: b.phone ?? b.phoneDigits,
            businessName: b.name,
            countryCode: gl,
            serperApiKey: apiKey,
            proxy,
          });

          setWaMap((m) => ({ ...m, [b.id]: waResult.status }));
          setAudit((a) => ({
            ...a,
            qualified: a.qualified.map((q) =>
              q.id === b.id
                ? {
                    ...q,
                    phone: waResult.e164 ?? q.phone,
                    phoneDigits: waResult.e164?.replace(/\D/g, "") ?? q.phoneDigits,
                    waValidation: waResult,
                  }
                : q
            ),
          }));

          log(
            waResult.status === "oui" ? "ok" : "warn",
            `📱 [WhatsApp] ${b.name} → ${waResult.status === "oui" ? "✅ WHATSAPP ACTIF (OUI)" : "❌ NON DISPONIBLE"} · ${waResult.reason}`
          );

          await sleep(35);
        }
      }

      if (isCancelled()) return;

      setAudit((a) => {
        const perZone = new Map<string, number>();
        for (const b of a.qualified) perZone.set(b.zone, (perZone.get(b.zone) ?? 0) + 1);
        const zoneSummary = [...perZone.entries()]
          .sort((x, y) => y[1] - x[1])
          .slice(0, 10)
          .map(([z, n]) => `${z} : ${n}`)
          .join(" · ");
        const top = Object.entries(a.tally)
          .sort((x, y) => y[1] - x[1]).slice(0, 5)
          .map(([k, v]) => `${k} ×${v}`).join(" · ");
        return {
          ...a,
          status: "done",
          logs: [
            ...a.logs,
            makeLog(
              "cmd",
              `Audit terminé — ${a.scanned} analysées · ${a.qualified.length} qualifiées · ${a.rejected.length} rejetées · ~${a.credits} crédits`
            ),
            ...(zoneSummary ? [makeLog("info", `Meilleures zones — ${zoneSummary}`)] : []),
            ...(top ? [makeLog("info", `Causes dominantes de rejet — ${top}`)] : []),
            makeLog(
              "info",
              a.qualified.length > 0
                ? "Validez les numéros sur WhatsApp puis exportez le CSV. Vous pouvez repêcher des fiches écartées ci-dessous."
                : "Aucune fiche qualifiée — assouplissez les filtres, élargissez la portée (villes/national), ou repêchez manuellement."
            ),
          ],
        };
      });
    } catch (e: unknown) {
      if (isCancelled()) return;
      const msg =
        e instanceof SerperError ? e.message
        : e instanceof Error ? e.message
        : "Erreur inconnue pendant la recherche.";
      log("err", msg);
      setAudit((a) => ({ ...a, status: "error", error: msg }));
    }
  }, []);

  return { audit, start, reset, stop, waMap, setWa, promoteRejected, demoteQualified };
}
