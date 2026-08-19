"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import {
  AnimateOnScroll,
  TextReveal,
  StaggerChildren,
} from "@/components/landing/Animations";

function useCountUp(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLParagraphElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);

  return { count, ref };
}

const SERVICES = [
  {
    num: "01",
    title: "Sites Vitrines",
    desc: "Nous concevons des sites vitrines au design soigné, pensés pour convertir vos visiteurs en clients. Chaque page est pensée pour raconter votre histoire et valoriser votre savoir-faire.",
    img: "/images/service-1.jpg",
  },
  {
    num: "02",
    title: "Référencement Local",
    desc: "Apparaître quand vos clients vous cherchent, c'est notre priorité. Nous optimisons votre présence Google, vos fiches et votre référencement pour dominer les recherches locales.",
    img: "/images/service-2.jpg",
  },
  {
    num: "03",
    title: "Réservation & Prise de RDV",
    desc: "Automatisez vos prises de rendez-vous avec un système de réservation intégré. Vos clients réservent 24h/24, sans appel téléphonique.",
    img: "/images/service-3.jpg",
  },
  {
    num: "04",
    title: "Identité Visuelle",
    desc: "Logo, charte graphique, supports de communication — nous créons une identité cohérente qui inspire confiance et vous distingue de la concurrence.",
    img: "/images/service-4.jpg",
  },
];

const CASES = [
  {
    client: "Atelier Lumières",
    sector: "Artisanat · Paris",
    desc: "Refonte complète du site vitrine avec galerie de projets, formulaire de devis et intégration de la réservation en ligne.",
    img: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=600&fit=crop",
    result: "+120% de demandes de devis",
  },
  {
    client: "Cabinet Dr. Morel",
    sector: "Médecine · Lyon",
    desc: "Site institutionnel avec prise de RDV en ligne, espace patient et optimisation SEO pour les recherches médicales locales.",
    img: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=600&fit=crop",
    result: "Complet en 10 jours",
  },
  {
    client: "Boulangerie Poissan",
    sector: "Alimentaire · Casablanca",
    desc: "Site vitrine avec menu dynamique, commande via WhatsApp et fiche Google Business optimisée.",
    img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&h=600&fit=crop",
    result: "Commandes WhatsApp x3",
  },
  {
    client: "Garage Mécanique Pro",
    sector: "Automobile · Marseille",
    desc: "Site avec formulaire de devis, galerie avant/après, intégration Google Maps et système de rappel client.",
    img: "https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=800&h=600&fit=crop",
    result: "+80% de visibilité locale",
  },
];

const TESTIMONIALS = [
  {
    name: "Jean-Pierre Lefèvre",
    role: "Gérant, Atelier Lumières",
    text: "GoSite a su comprendre nos besoins et créer un site qui nous ressemble vraiment. Nos clients nous trouvent plus facilement et les demandes de devis ont doublé.",
    initials: "JPL",
  },
  {
    name: "Dr. Sarah Morel",
    role: "Médecin, Cabinet Morel",
    text: "Le système de réservation en ligne a transformé mon activité. Plus de temps passé au téléphone, mes patients prennent RDV en quelques clics.",
    initials: "SM",
  },
  {
    name: "Mehdi Benali",
    role: "Propriétaire, Garage Mécanique Pro",
    text: "Professionnels, réactifs et créatifs. Mon site est devenu mon meilleur outil commercial. Je recommande les yeux fermés.",
    initials: "MB",
  },
];

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const c1 = useCountUp(150, 2200);
  const c2 = useCountUp(12, 1800);
  const c3 = useCountUp(98, 2000);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#fafaf9] font-[family-name:var(--font-geist-sans)] text-slate-900 antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* ── HEADER ─────────────────────────────────── */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white/90 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.06)]"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 lg:px-12 py-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#059669] text-lg font-black text-white tracking-tighter shadow-lg shadow-emerald-600/20">
              G
            </div>
            <span className="text-[22px] font-extrabold tracking-tight text-slate-900">
              GoSite
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {[
              ["#services", "Services"],
              ["#projets", "Projets"],
              ["#processus", "Processus"],
              ["#avis", "Avis"],
              ["#contact", "Contact"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="line-reveal rounded-lg px-4 py-2 text-[13px] font-semibold uppercase tracking-wider text-slate-500 transition-colors hover:text-slate-900"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            <a
              href="tel:+33612345678"
              className="text-[13px] font-semibold text-slate-500 hover:text-slate-900 transition-colors"
            >
              06 12 34 56 78
            </a>
            <a
              href="#contact"
              className="rounded-[14px] bg-slate-900 px-6 py-3 text-[13px] font-bold uppercase tracking-wider text-white transition-all hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20 hover:-translate-y-0.5"
            >
              Parlons de votre projet
            </a>
          </div>

          {/* mobile burger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden flex flex-col gap-1.5 p-2"
            aria-label="Menu"
          >
            <span className={`block h-0.5 w-6 bg-slate-900 transition-all duration-300 ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`block h-0.5 w-6 bg-slate-900 transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-6 bg-slate-900 transition-all duration-300 ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
          </button>
        </div>

        {/* mobile menu */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-500 ${
            menuOpen ? "max-h-96 border-t border-slate-100 bg-white" : "max-h-0"
          }`}
        >
          <div className="px-6 py-6 space-y-4">
            {[
              ["#services", "Services"],
              ["#projets", "Projets"],
              ["#processus", "Processus"],
              ["#avis", "Avis"],
              ["#contact", "Contact"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="block text-lg font-semibold text-slate-700"
              >
                {label}
              </a>
            ))}
            <a
              href="#contact"
              onClick={() => setMenuOpen(false)}
              className="block w-full rounded-2xl bg-slate-900 py-3.5 text-center text-sm font-bold text-white"
            >
              Parlons de votre projet
            </a>
          </div>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* decorative elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 right-[10%] h-[600px] w-[600px] rounded-full bg-emerald-50 blur-[120px] opacity-60" />
          <div className="absolute bottom-20 left-[5%] h-[400px] w-[400px] rounded-full bg-teal-50 blur-[100px] opacity-40" />
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="mx-auto max-w-[1400px] px-6 lg:px-12 w-full pt-32 pb-20 lg:pt-0 lg:pb-0">
          <div className="grid lg:grid-cols-[1fr_1fr] gap-16 lg:gap-20 items-center">
            <div>
              <TextReveal>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/60 backdrop-blur-sm px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-8">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Agence web · Paris · Lyon · Casablanca
                </div>
              </TextReveal>

              <TextReveal delay={100}>
                <h1 className="text-[3.2rem] leading-[1.05] font-extrabold tracking-[-0.03em] text-slate-900 sm:text-[4rem] lg:text-[4.5rem]">
                  Nous créons
                  <br />
                  <span className="relative inline-block">
                    <span className="relative z-10">des sites</span>
                    <span className="absolute bottom-2 left-0 -z-10 h-3 w-full bg-emerald-200/50 -rotate-1" />
                  </span>
                  <br />
                  qui convertissent.
                </h1>
              </TextReveal>

              <TextReveal delay={200}>
                <p className="mt-8 max-w-lg text-[17px] leading-relaxed text-slate-500">
                  GoSite conçoit des sites web professionnels pour les
                  commerces et artisans qui veulent attirer plus de clients
                  locaux. Design sur-mesure, référencement optimisé, résultats
                  mesurables.
                </p>
              </TextReveal>

              <TextReveal delay={300}>
                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                  <a
                    href="#contact"
                    className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-[#059669] px-8 py-4.5 text-[15px] font-bold text-white shadow-xl shadow-emerald-600/20 transition-all duration-300 hover:bg-emerald-700 hover:shadow-2xl hover:-translate-y-0.5"
                  >
                    Démarrer votre projet
                    <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </a>
                  <a
                    href="#projets"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-8 py-4.5 text-[15px] font-bold text-slate-700 transition-all duration-300 hover:border-slate-300 hover:bg-slate-50"
                  >
                    Voir nos réalisations
                  </a>
                </div>
              </TextReveal>
            </div>

            {/* Hero image */}
            <TextReveal delay={200} className="hidden lg:block">
              <div className="relative">
                <div className="relative rounded-[2rem] overflow-hidden shadow-2xl shadow-slate-200/60">
                  <img
                    src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=1000&fit=crop"
                    alt="Agence web au travail"
                    className="w-full h-[600px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent" />
                </div>

                {/* floating stat card */}
                <div className="absolute -bottom-6 -left-8 rounded-2xl bg-white p-5 shadow-xl shadow-slate-200/60 border border-slate-100 float">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
                      <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-extrabold text-slate-900">+40%</p>
                      <p className="text-xs text-slate-400 font-medium">Devis en moyenne</p>
                    </div>
                  </div>
                </div>

                {/* floating badge */}
                <div className="absolute -top-4 -right-4 rounded-2xl bg-slate-900 p-4 shadow-xl float-delay">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-1">
                      {[0,1,2].map(i => (
                        <div key={i} className="h-7 w-7 rounded-full border-2 border-slate-900 bg-gradient-to-br from-emerald-400 to-teal-500" />
                      ))}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">120+ projets</p>
                      <p className="text-[10px] text-slate-400">livrés avec succès</p>
                    </div>
                  </div>
                </div>
              </div>
            </TextReveal>
          </div>
        </div>

        {/* scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">Scroll</span>
          <div className="h-10 w-6 rounded-full border-2 border-slate-200 flex items-start justify-center pt-2">
            <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
          </div>
        </div>
      </section>

      {/* ── CLIENTS TICKER ─────────────────────────── */}
      <section className="border-y border-slate-100 bg-white py-8 overflow-hidden">
        <div className="ticker-track flex items-center gap-16 whitespace-nowrap">
          {[...Array(2)].map((_, setIdx) => (
            <div key={setIdx} className="flex items-center gap-16">
              {[
                "Atelier Lumières",
                "Cabinet Morel",
                "Boulangerie Poissan",
                "Garage Mécanique Pro",
                "Pharmacie Centrale",
                "Salon Coiff'Mod",
                "Café du Marché",
                "Fleuriste Jardin'Moi",
              ].map((name) => (
                <span
                  key={`${setIdx}-${name}`}
                  className="text-sm font-bold uppercase tracking-[0.15em] text-slate-300"
                >
                  {name}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ── ABOUT / MISSION ────────────────────────── */}
      <section className="py-24 lg:py-36">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <AnimateOnScroll>
              <div className="relative">
                <div className="img-zoom rounded-[2rem] overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=700&h=900&fit=crop"
                    alt="L'équipe GoSite"
                    className="w-full h-[550px] object-cover"
                  />
                </div>
                {/* decorative line */}
                <div className="absolute -bottom-6 -right-6 h-24 w-24 border-b-2 border-r-2 border-emerald-400 rounded-br-[2rem] -z-10" />
                <div className="absolute -top-6 -left-6 h-24 w-24 border-t-2 border-l-2 border-emerald-400 rounded-tl-[2rem] -z-10" />
              </div>
            </AnimateOnScroll>

            <div>
              <TextReveal>
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-emerald-600 mb-4">
                  Notre mission
                </p>
              </TextReveal>
              <TextReveal delay={100}>
                <h2 className="text-3xl sm:text-4xl lg:text-[2.8rem] font-extrabold tracking-[-0.02em] leading-[1.1] text-slate-900">
                  Votre métier est unique.
                  <br />
                  Votre site aussi.
                </h2>
              </TextReveal>
              <TextReveal delay={200}>
                <p className="mt-6 text-[17px] leading-relaxed text-slate-500">
                  Nous ne croyons pas aux templates génériques. Chaque projet
                  est pensé sur-mesure, en fonction de votre activité, de vos
                  clients et de vos objectifs. De la stratégie à la mise en
                  ligne, nous sommes votre partenaire digital.
                </p>
              </TextReveal>
              <TextReveal delay={300}>
                <div className="mt-10 grid grid-cols-2 gap-6">
                  {[
                    { label: "Projets livrés", value: "120+" },
                    { label: "Années d'expérience", value: "8+" },
                    { label: "Taux de satisfaction", value: "98%" },
                    { label: "Délai moyen", value: "15j" },
                  ].map((s) => (
                    <div key={s.label} className="border-l-2 border-emerald-200 pl-5">
                      <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
                      <p className="text-sm text-slate-400 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </TextReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICES ───────────────────────────────── */}
      <section id="services" className="bg-white py-24 lg:py-36">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-16">
            <div>
              <TextReveal>
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-emerald-600 mb-4">
                  Ce que nous faisons
                </p>
              </TextReveal>
              <TextReveal delay={100}>
                <h2 className="text-3xl sm:text-4xl lg:text-[2.8rem] font-extrabold tracking-[-0.02em] leading-[1.1] text-slate-900">
                  Des services pensés pour<br className="hidden sm:block" /> les professionnels locaux.
                </h2>
              </TextReveal>
            </div>
            <TextReveal delay={200}>
              <p className="max-w-md text-[15px] leading-relaxed text-slate-400">
                Chaque service est conçu pour répondre à un besoin concret de
                votre activité. Pas de fonctions superflues, que l&apos;essentiel.
              </p>
            </TextReveal>
          </div>

          <StaggerChildren className="space-y-2">
            {SERVICES.map((s) => (
              <div
                key={s.num}
                className="group grid lg:grid-cols-[auto_1fr_auto] gap-6 lg:gap-12 items-center rounded-3xl border border-slate-100 bg-[#fafaf9] p-6 lg:p-8 transition-all duration-500 hover:bg-white hover:border-slate-200 hover:shadow-xl hover:shadow-slate-200/40"
              >
                <div className="flex items-center gap-5">
                  <span className="text-[11px] font-bold text-slate-300">{s.num}</span>
                  <div className="img-zoom h-20 w-20 rounded-2xl overflow-hidden shrink-0 hidden sm:block">
                    <img
                      src={s.img}
                      alt={s.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400 max-w-xl">
                    {s.desc}
                  </p>
                </div>

                <div className="hidden lg:flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 text-slate-300 transition-all duration-300 group-hover:border-emerald-300 group-hover:text-emerald-600 group-hover:bg-emerald-50">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
                  </svg>
                </div>
              </div>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ── STATS BANNER ───────────────────────────── */}
      <section className="relative overflow-hidden bg-slate-900 py-20 lg:py-24">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 h-[300px] w-[300px] rounded-full bg-emerald-500/10 blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 h-[200px] w-[200px] rounded-full bg-teal-500/10 blur-[80px]" />
        </div>
        <div className="relative mx-auto max-w-[1400px] px-6 lg:px-12">
          <StaggerChildren className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 text-center">
            <div>
              <p ref={c1.ref} className="text-4xl lg:text-5xl font-extrabold text-white">{c1.count}+</p>
              <p className="mt-2 text-sm text-slate-400">Projets livrés</p>
            </div>
            <div>
              <p ref={c2.ref} className="text-4xl lg:text-5xl font-extrabold text-white">{c2.count}+</p>
              <p className="mt-2 text-sm text-slate-400">Années d&apos;expérience</p>
            </div>
            <div>
              <p ref={c3.ref} className="text-4xl lg:text-5xl font-extrabold text-white">{c3.count}%</p>
              <p className="mt-2 text-sm text-slate-400">Clients satisfaits</p>
            </div>
            <div>
              <p className="text-4xl lg:text-5xl font-extrabold text-white">24h</p>
              <p className="mt-2 text-sm text-slate-400">Temps de réponse</p>
            </div>
          </StaggerChildren>
        </div>
      </section>

      {/* ── CASE STUDIES ───────────────────────────── */}
      <section id="projets" className="py-24 lg:py-36">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <TextReveal>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-emerald-600 mb-4">
              Portfolio
            </p>
          </TextReveal>
          <TextReveal delay={100}>
            <h2 className="text-3xl sm:text-4xl lg:text-[2.8rem] font-extrabold tracking-[-0.02em] leading-[1.1] text-slate-900">
              Projets récents
            </h2>
          </TextReveal>

          <StaggerChildren className="mt-16 grid md:grid-cols-2 gap-6">
            {CASES.map((c) => (
              <div
                key={c.client}
                className="group magnetic-card rounded-[2rem] border border-slate-100 bg-white overflow-hidden"
              >
                <div className="img-zoom relative h-64 sm:h-72">
                  <img
                    src={c.img}
                    alt={c.client}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                    <div>
                      <p className="text-xs font-bold text-white/70 uppercase tracking-wider">{c.sector}</p>
                      <p className="text-lg font-extrabold text-white">{c.client}</p>
                    </div>
                    <span className="rounded-full bg-emerald-500/90 backdrop-blur-sm px-3 py-1 text-[11px] font-bold text-white">
                      {c.result}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-sm leading-relaxed text-slate-500">{c.desc}</p>
                  <div className="mt-5 flex items-center gap-2 text-sm font-bold text-emerald-600 group-hover:text-emerald-700 transition-colors">
                    Voir le projet
                    <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ── PROCESS ────────────────────────────────── */}
      <section id="processus" className="bg-[#fafaf9] py-24 lg:py-36">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <TextReveal>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-emerald-600 mb-4">
              Notre méthodologie
            </p>
          </TextReveal>
          <TextReveal delay={100}>
            <h2 className="text-3xl sm:text-4xl lg:text-[2.8rem] font-extrabold tracking-[-0.02em] leading-[1.1] text-slate-900">
              De l&apos;idée à la mise en ligne,<br className="hidden sm:block" /> un processus structuré.
            </h2>
          </TextReveal>

          <div className="mt-20 grid lg:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                n: "01",
                title: "Découverte & Stratégie",
                desc: "On analyse votre marché, vos concurrents et vos objectifs. On définit ensemble la meilleure approche pour votre site.",
                details: ["Audit de vos existants", "Étude de la concurrence", "Cahier des charges"],
              },
              {
                n: "02",
                title: "Design & Développement",
                desc: "Notre équipe conçoit un site unique, pense à chaque interaction et développe une solution performante et évolutive.",
                details: ["Maquettes sur-mesure", "Développement moderne", "Tests multi-appareils"],
              },
              {
                n: "03",
                title: "Lancement & Accompagnement",
                desc: "Mise en ligne, formation à la prise en main, optimisation SEO. On reste à vos côtés pour garantir votre succès.",
                details: ["Déploiement technique", "Formation utilisateur", "Suivi de performance"],
              },
            ].map((step, i) => (
              <AnimateOnScroll key={step.n} delay={i * 150}>
                <div className="relative">
                  {i < 2 && (
                    <div className="hidden lg:block absolute top-12 left-[calc(50%+40px)] h-px w-[calc(100%-80px)] bg-gradient-to-r from-slate-200 to-transparent" />
                  )}
                  <div className="flex h-[72px] w-[72px] items-center justify-center rounded-[20px] bg-white border border-slate-100 shadow-sm text-[13px] font-extrabold text-slate-900">
                    {step.n}
                  </div>
                  <h3 className="mt-6 text-xl font-extrabold text-slate-900">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">
                    {step.desc}
                  </p>
                  <ul className="mt-5 space-y-2">
                    {step.details.map((d) => (
                      <li key={d} className="flex items-center gap-2 text-xs text-slate-400">
                        <svg className="h-3.5 w-3.5 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ── FULL-WIDTH IMAGE BREAK ─────────────────── */}
      <section className="relative h-[50vh] lg:h-[60vh] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&h=800&fit=crop"
          alt="Espace de travail GoSite"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <TextReveal>
            <p className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white text-center tracking-tight max-w-3xl px-6 leading-tight">
              &ldquo;Un site web, ce n&apos;est pas une dépense.
              <br />
              C&apos;est votre meilleur commercial.&rdquo;
            </p>
          </TextReveal>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────── */}
      <section id="avis" className="bg-white py-24 lg:py-36">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <TextReveal>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-emerald-600 mb-4">
              Témoignages
            </p>
          </TextReveal>
          <TextReveal delay={100}>
            <h2 className="text-3xl sm:text-4xl lg:text-[2.8rem] font-extrabold tracking-[-0.02em] leading-[1.1] text-slate-900">
              Ils nous font confiance.
            </h2>
          </TextReveal>

          <StaggerChildren className="mt-16 grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="rounded-[2rem] border border-slate-100 bg-[#fafaf9] p-8 transition-all duration-500 hover:bg-white hover:border-slate-200 hover:shadow-lg hover:shadow-slate-100"
              >
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="mt-6 text-[15px] leading-relaxed text-slate-600 italic">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="mt-8 flex items-center gap-4 border-t border-slate-100 pt-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────── */}
      <section id="contact" className="relative py-24 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 gradient-animate" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        </div>

        <div className="mx-auto max-w-4xl px-6 text-center lg:px-8">
          <TextReveal>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Prêt à transformer votre<br /> présence en ligne ?
            </h2>
          </TextReveal>
          <TextReveal delay={100}>
            <p className="mt-6 text-lg text-emerald-100/80 max-w-xl mx-auto">
              Contactez-nous pour un premier échange gratuit. On vous
              accompagne de la première idée à la mise en ligne.
            </p>
          </TextReveal>
          <TextReveal delay={200}>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:contact@gosite.fr"
                className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-white px-9 py-4.5 text-[15px] font-bold text-emerald-700 shadow-xl transition-all duration-300 hover:bg-emerald-50 hover:shadow-2xl hover:-translate-y-0.5"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                contact@gosite.fr
              </a>
              <a
                href="tel:+33612345678"
                className="group inline-flex items-center justify-center gap-3 rounded-2xl border-2 border-white/25 px-9 py-4.5 text-[15px] font-bold text-white transition-all duration-300 hover:border-white/50 hover:bg-white/10 hover:-translate-y-0.5"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                06 12 34 56 78
              </a>
            </div>
          </TextReveal>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────── */}
      <footer className="bg-slate-950 text-white">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <div className="grid gap-12 py-16 lg:py-20 sm:grid-cols-2 lg:grid-cols-4 border-b border-white/10">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#059669] text-sm font-black">
                  G
                </div>
                <span className="text-xl font-extrabold">GoSite</span>
              </div>
              <p className="max-w-sm text-[14px] leading-relaxed text-slate-400">
                Agence web spécialisée dans la création de sites
                professionnels pour les commerces, artisans et PME locales.
                Nous transformons votre présence digitale en vrai outil de
                croissance.
              </p>
              <div className="mt-6 flex gap-3">
                {[
                  "M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z",
                  "M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z",
                  "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z",
                ].map((d, i) => (
                  <a key={i} href="#" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d={d} /></svg>
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-5">Services</h3>
              <ul className="space-y-3 text-sm text-slate-400">
                {["Sites Vitrines", "Référencement Local", "Réservation en ligne", "Identité Visuelle"].map((l) => (
                  <li key={l}><a href="#services" className="transition hover:text-white">{l}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-5">Contact</h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-center gap-2.5">
                  <svg className="h-4 w-4 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  06 12 34 56 78
                </li>
                <li className="flex items-center gap-2.5">
                  <svg className="h-4 w-4 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  contact@gosite.fr
                </li>
                <li className="flex items-start gap-2.5">
                  <svg className="h-4 w-4 shrink-0 mt-0.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Paris · Lyon · Casablanca
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 py-8 text-xs text-slate-500 sm:flex-row">
            <p>&copy; 2026 GoSite. Tous droits réservés.</p>
            <div className="flex gap-6">
              <a href="#" className="transition hover:text-white">Mentions légales</a>
              <a href="#" className="transition hover:text-white">Politique de confidentialité</a>
              <a href="#" className="transition hover:text-white">CGV</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
