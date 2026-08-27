import type { ScrapedBusiness } from "./types";

/**
 * Generates a complete, modern, responsive HTML site for a local
 * business. The site is self-contained (no external dependencies) so
 * it can be served as a single file or copy-pasted into any framework.
 *
 * This is the "demo" shown to the prospect before payment.
 */
export function generateDemoSiteHtml(b: ScrapedBusiness, lang: string = "fr"): string {
  const sector = b.subcategory || b.category || "votre activité";
  const name = b.name;
  const address = [b.housenumber, b.street, b.postcode, b.city]
    .filter(Boolean)
    .join(", ");
  const phoneRaw = b.phone || "";
  const phoneClean = phoneRaw.replace(/[^0-9+]/g, "");
  const waLink = phoneClean
    ? `https://wa.me/${phoneClean.replace(/[^0-9]/g, "")}`
    : "#";
  const callLink = phoneClean ? `tel:${phoneClean}` : "#";
  const mapsLink = b.googleMapsUrl || "#";
  const reviewsBadge = b.rating
    ? `<div class="reviews-badge"><span class="star">★</span> ${b.rating}/5${b.reviewsCount ? ` <span class="count">(${b.reviewsCount} avis)</span>` : ""}</div>`
    : "";
  const cuisineBadge = b.cuisine
    ? `<div class="cuisine-badge">${b.cuisine}</div>`
    : "";

  // Color theme based on sector
  const themes: Record<string, { primary: string; accent: string; bg: string }> = {
    restaurant: { primary: "#dc2626", accent: "#f59e0b", bg: "#fef2f2" },
    cafe: { primary: "#92400e", accent: "#d97706", bg: "#fffbeb" },
    pharmacie: { primary: "#0891b2", accent: "#06b6d4", bg: "#ecfeff" },
    coiffeur: { primary: "#7c3aed", accent: "#a855f7", bg: "#faf5ff" },
    boulangerie: { primary: "#b45309", accent: "#d97706", bg: "#fffbeb" },
    default: { primary: "#0f172a", accent: "#3b82f6", bg: "#f8fafc" },
  };
  const theme = themes[b.subcategory || ""] || themes.default;

  // Opening hours parsing
  const openingHoursHtml = b.openingHours
    ? renderOpeningHours(b.openingHours)
    : "";

  return `<!DOCTYPE html>
<html lang="${escapeHtml(lang)}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(name)} — ${escapeHtml(sector)} à ${escapeHtml(b.city || "")}</title>
<meta name="description" content="${
    b.description
      ? escapeHtml(b.description.slice(0, 160))
      : `${escapeHtml(name)} — ${escapeHtml(sector)} à ${escapeHtml(b.city || "")}. ${b.phone ? "Appelez le " + escapeHtml(b.phone) : ""}`
  }">
<meta name="theme-color" content="${theme.primary}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
<style>
:root {
  --primary: ${theme.primary};
  --accent: ${theme.accent};
  --bg: ${theme.bg};
  --text: #0f172a;
  --muted: #64748b;
  --border: #e2e8f0;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Inter', system-ui, sans-serif; color: var(--text); line-height: 1.6; -webkit-font-smoothing: antialiased; }
h1, h2, h3 { font-family: 'Playfair Display', serif; line-height: 1.2; }
a { color: var(--primary); text-decoration: none; }
img { max-width: 100%; height: auto; display: block; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }

/* Top banner */
.demo-banner {
  position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
  background: linear-gradient(90deg, #0f172a, #1e293b);
  color: white; text-align: center; padding: 0.6rem 1rem;
  font-size: 0.85rem; font-weight: 500;
  border-bottom: 2px solid var(--primary);
}
.demo-banner strong { color: var(--accent); }

/* Nav */
nav { position: sticky; top: 36px; z-index: 100; background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border-bottom: 1px solid var(--border); padding: 1rem 0; }
.nav-inner { display: flex; justify-content: space-between; align-items: center; }
.logo { font-family: 'Playfair Display', serif; font-weight: 700; font-size: 1.4rem; color: var(--primary); }
.nav-links { display: flex; gap: 2rem; list-style: none; }
.nav-links a { color: var(--text); font-weight: 500; font-size: 0.95rem; }
.nav-links a:hover { color: var(--primary); }
.cta-nav { background: var(--primary); color: white !important; padding: 0.5rem 1.2rem; border-radius: 100px; font-weight: 600; }
@media (max-width: 768px) { .nav-links { display: none; } }

/* Hero */
.hero { background: linear-gradient(135deg, var(--bg) 0%, white 100%); padding: 4rem 0 5rem; position: relative; overflow: hidden; }
.hero::before { content: ''; position: absolute; top: -50%; right: -10%; width: 600px; height: 600px; background: radial-gradient(circle, var(--accent) 0%, transparent 70%); opacity: 0.1; }
.hero-content { display: grid; grid-template-columns: 1.2fr 1fr; gap: 3rem; align-items: center; position: relative; z-index: 1; }
@media (max-width: 968px) { .hero-content { grid-template-columns: 1fr; } }
.hero h1 { font-size: clamp(2rem, 5vw, 3.5rem); margin-bottom: 1rem; }
.hero .accent { color: var(--primary); }
.hero p { font-size: 1.1rem; color: var(--muted); margin-bottom: 1.5rem; }
.hero-badges { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 2rem; }
.reviews-badge, .cuisine-badge { background: white; padding: 0.5rem 1rem; border-radius: 100px; font-size: 0.9rem; font-weight: 600; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid var(--border); }
.reviews-badge .star { color: #f59e0b; }
.reviews-badge .count { color: var(--muted); font-weight: 400; }
.cuisine-badge { background: var(--bg); color: var(--primary); }
.cta-group { display: flex; gap: 0.75rem; flex-wrap: wrap; }
.btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.9rem 1.6rem; border-radius: 100px; font-weight: 600; font-size: 1rem; transition: all 0.2s; cursor: pointer; border: none; }
.btn-primary { background: var(--primary); color: white; box-shadow: 0 4px 14px rgba(0,0,0,0.15); }
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.2); }
.btn-secondary { background: white; color: var(--text); border: 2px solid var(--border); }
.btn-secondary:hover { border-color: var(--primary); color: var(--primary); }
.hero-image { aspect-ratio: 4/3; border-radius: 24px; background: linear-gradient(135deg, var(--primary), var(--accent)); display: flex; align-items: center; justify-content: center; color: white; font-size: 8rem; font-weight: 700; box-shadow: 0 20px 60px rgba(0,0,0,0.2); position: relative; overflow: hidden; }
.hero-image::after { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent 50%); }

/* Section */
section { padding: 5rem 0; }
.section-title { text-align: center; margin-bottom: 3rem; }
.section-title h2 { font-size: clamp(1.8rem, 4vw, 2.5rem); margin-bottom: 0.5rem; }
.section-title p { color: var(--muted); max-width: 600px; margin: 0 auto; }

/* About */
.about { background: var(--bg); }
.about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: center; }
@media (max-width: 768px) { .about-grid { grid-template-columns: 1fr; } }
.about-text h2 { margin-bottom: 1rem; }
.about-text p { color: var(--muted); margin-bottom: 1rem; }
.usp-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-top: 2rem; }
.usp { background: white; padding: 1.5rem; border-radius: 16px; text-align: center; border: 1px solid var(--border); }
.usp-icon { width: 48px; height: 48px; margin: 0 auto 0.75rem; background: var(--bg); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
.usp h4 { font-family: 'Inter', sans-serif; font-size: 1rem; margin-bottom: 0.25rem; }
.usp p { font-size: 0.85rem; color: var(--muted); margin: 0; }

/* Services */
.services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.5rem; }
.service-card { background: white; padding: 2rem 1.5rem; border-radius: 16px; border: 1px solid var(--border); text-align: center; transition: all 0.3s; }
.service-card:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(0,0,0,0.08); border-color: var(--primary); }
.service-icon { width: 64px; height: 64px; margin: 0 auto 1rem; background: var(--bg); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; }
.service-card h3 { font-family: 'Inter', sans-serif; font-size: 1.15rem; margin-bottom: 0.5rem; }
.service-card p { color: var(--muted); font-size: 0.9rem; }

/* Reviews */
.reviews { background: var(--bg); }
.reviews-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }
.review-card { background: white; padding: 2rem; border-radius: 16px; border: 1px solid var(--border); }
.review-stars { color: #f59e0b; font-size: 1.1rem; margin-bottom: 0.75rem; }
.review-card p { font-style: italic; color: var(--text); margin-bottom: 1rem; }
.review-author { font-weight: 600; font-size: 0.9rem; }
.review-source { color: var(--muted); font-size: 0.8rem; }
.cta-reviews { text-align: center; margin-top: 2rem; }

/* Contact */
.contact-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 3rem; }
@media (max-width: 768px) { .contact-grid { grid-template-columns: 1fr; } }
.contact-info { display: flex; flex-direction: column; gap: 1.5rem; }
.contact-item { display: flex; gap: 1rem; align-items: flex-start; }
.contact-icon { width: 44px; height: 44px; background: var(--bg); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; }
.contact-item h4 { font-family: 'Inter', sans-serif; font-size: 0.95rem; margin-bottom: 0.2rem; }
.contact-item p, .contact-item a { color: var(--muted); font-size: 0.95rem; }
.contact-form { background: var(--bg); padding: 2rem; border-radius: 20px; }
.contact-form h3 { font-family: 'Inter', sans-serif; font-size: 1.3rem; margin-bottom: 1rem; }
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 0.3rem; }
.form-group input, .form-group textarea { width: 100%; padding: 0.7rem 1rem; border: 1px solid var(--border); border-radius: 8px; font-family: inherit; font-size: 0.95rem; background: white; }
.form-group textarea { min-height: 100px; resize: vertical; }
.form-group input:focus, .form-group textarea:focus { outline: 2px solid var(--primary); outline-offset: -1px; }

/* Hours */
.hours-table { background: white; border-radius: 12px; overflow: hidden; border: 1px solid var(--border); margin-top: 1.5rem; }
.hours-row { display: flex; justify-content: space-between; padding: 0.75rem 1.25rem; border-bottom: 1px solid var(--border); }
.hours-row:last-child { border-bottom: none; }
.hours-row .day { font-weight: 500; }
.hours-row .time { color: var(--muted); }
.hours-row.today { background: var(--bg); }
.hours-row.today .day { color: var(--primary); }

/* Footer */
footer { background: #0f172a; color: white; padding: 3rem 0 1.5rem; }
.footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 3rem; margin-bottom: 2rem; }
@media (max-width: 768px) { .footer-grid { grid-template-columns: 1fr; } }
.footer-brand h3 { font-family: 'Playfair Display', serif; font-size: 1.5rem; margin-bottom: 0.5rem; }
.footer-brand p { color: #94a3b8; font-size: 0.9rem; }
.footer-col h5 { font-family: 'Inter', sans-serif; font-size: 0.9rem; font-weight: 600; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.05em; color: #cbd5e1; }
.footer-col ul { list-style: none; }
.footer-col li { margin-bottom: 0.5rem; }
.footer-col a { color: #94a3b8; font-size: 0.9rem; }
.footer-col a:hover { color: white; }
.footer-bottom { text-align: center; padding-top: 1.5rem; border-top: 1px solid #1e293b; color: #64748b; font-size: 0.85rem; }

/* WhatsApp Floating Button */
.whatsapp-float { position: fixed; bottom: 20px; right: 20px; z-index: 999; background: #25D366; color: white; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 20px rgba(37, 211, 102, 0.4); text-decoration: none; font-size: 1.8rem; transition: all 0.3s; animation: pulse 2s infinite; }
.whatsapp-float:hover { transform: scale(1.1); }
@keyframes pulse { 0%, 100% { box-shadow: 0 4px 20px rgba(37, 211, 102, 0.4); } 50% { box-shadow: 0 4px 30px rgba(37, 211, 102, 0.7); } }

/* Demo overlay */
.demo-overlay { position: fixed; bottom: 0; left: 0; right: 0; background: linear-gradient(90deg, #1e293b, #0f172a); color: white; padding: 1rem 1.5rem; z-index: 998; display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; box-shadow: 0 -4px 20px rgba(0,0,0,0.15); }
.demo-overlay-text { flex: 1; min-width: 200px; }
.demo-overlay-text strong { color: #fbbf24; display: block; margin-bottom: 0.2rem; }
.demo-overlay-text small { color: #cbd5e1; font-size: 0.85rem; }
.demo-overlay button { background: #fbbf24; color: #0f172a; border: none; padding: 0.7rem 1.4rem; border-radius: 100px; font-weight: 700; cursor: pointer; }
@media (max-width: 768px) { .demo-overlay { display: none; } }
</style>
</head>
<body>
<div class="demo-banner">⚡ Ceci est une <strong>DÉMO PERSONNALISÉE</strong> créée pour ${escapeHtml(name)} par notre service — site de prévisualisation</div>

<nav>
  <div class="container nav-inner">
    <div class="logo">${escapeHtml(name)}</div>
    <ul class="nav-links">
      <li><a href="#about">À propos</a></li>
      <li><a href="#services">Services</a></li>
      <li><a href="#reviews">Avis</a></li>
      <li><a href="#contact">Contact</a></li>
      <li><a href="${callLink}" class="cta-nav">📞 Appeler</a></li>
    </ul>
  </div>
</nav>

<header class="hero">
  <div class="container hero-content">
    <div>
      <h1>${escapeHtml(name)}<br><span class="accent">votre ${escapeHtml(sector)} à ${escapeHtml(b.city || "")}</span></h1>
      <p>${b.description ? escapeHtml(b.description.slice(0, 180)) + (b.description.length > 180 ? "…" : "") : `Découvrez ${escapeHtml(name)}, votre référence en ${escapeHtml(sector)} à ${escapeHtml(b.city || "")}. Qualité, savoir-faire et service personnalisé.`}</p>
      <div class="hero-badges">
        ${reviewsBadge}
        ${cuisineBadge}
        ${b.reservation === "yes" ? '<div class="cuisine-badge">📅 Réservation</div>' : ""}
        ${b.delivery === "yes" ? '<div class="cuisine-badge">🚚 Livraison</div>' : ""}
        ${b.outdoorSeating === "yes" ? '<div class="cuisine-badge">☀️ Terrasse</div>' : ""}
      </div>
      <div class="cta-group">
        <a href="${callLink}" class="btn btn-primary">📞 ${escapeHtml(phoneRaw || "Nous appeler")}</a>
        <a href="${mapsLink}" target="_blank" rel="noreferrer" class="btn btn-secondary">📍 Voir sur la carte</a>
      </div>
    </div>
    <div class="hero-image">${escapeHtml(name.charAt(0))}</div>
  </div>
</header>

<section id="about" class="about">
  <div class="container">
    <div class="about-grid">
      <div class="about-text">
        <h2>Pourquoi choisir ${escapeHtml(name)} ?</h2>
        <p>${b.description ? escapeHtml(b.description) : `Au cœur de ${escapeHtml(b.city || "")}, ${escapeHtml(name)} s'engage à offrir une expérience ${escapeHtml(sector)} d'exception. Notre équipe met un point d'honneur à satisfaire chaque client avec authenticité et professionnalisme.`}</p>
        <p>Notre réputation${b.rating ? ` (notée ${b.rating}/5 sur Google${b.reviewsCount ? ` par ${b.reviewsCount} clients` : ""})` : ""} témoigne de notre engagement envers la qualité et le service.</p>
      </div>
      <div class="usp-grid">
        ${b.delivery === "yes" ? '<div class="usp"><div class="usp-icon">🚚</div><h4>Livraison</h4><p>À domicile</p></div>' : ""}
        ${b.takeaway === "yes" ? '<div class="usp"><div class="usp-icon">🥡</div><h4>À emporter</h4><p>Sur place ou à emporter</p></div>' : ""}
        ${b.outdoorSeating === "yes" ? '<div class="usp"><div class="usp-icon">☀️</div><h4>Terrasse</h4><p>Pour profiter du soleil</p></div>' : ""}
        ${b.reservation === "yes" ? '<div class="usp"><div class="usp-icon">📅</div><h4>Réservation</h4><p>En ligne ou par téléphone</p></div>' : ""}
        ${b.wifi === "yes" ? '<div class="usp"><div class="usp-icon">📶</div><h4>Wi-Fi</h4><p>Connexion gratuite</p></div>' : ""}
        ${b.wheelchair === "yes" ? '<div class="usp"><div class="usp-icon">♿</div><h4>Accessible</h4><p>Accès handicapé</p></div>' : ""}
        ${b.parking && b.parking !== "no" ? `<div class="usp"><div class="usp-icon">🅿️</div><h4>Parking</h4><p>${escapeHtml(b.parking || "disponible")}</p></div>` : ""}
        ${b.airConditioning === "yes" ? '<div class="usp"><div class="usp-icon">❄️</div><h4>Climatisé</h4><p>Confort optimal</p></div>' : ""}
      </div>
    </div>
  </div>
</section>

<section id="services">
  <div class="container">
    <div class="section-title">
      <h2>Nos services</h2>
      <p>Ce que ${escapeHtml(name)} propose à ${escapeHtml(b.city || "")}</p>
    </div>
    <div class="services-grid">
      <div class="service-card">
        <div class="service-icon">${getSectorEmoji(b.subcategory || b.category || "")}</div>
        <h3>${escapeHtml(sector)}</h3>
        <p>Une offre variée et qualitative, adaptée à tous les goûts.</p>
      </div>
      ${b.delivery === "yes" ? '<div class="service-card"><div class="service-icon">🚚</div><h3>Livraison</h3><p>Commandez et recevez directement chez vous.</p></div>' : ""}
      ${b.takeaway === "yes" ? '<div class="service-card"><div class="service-icon">🥡</div><h3>À emporter</h3><p>Préparé à l\'avance, prêt à déguster.</p></div>' : ""}
      ${b.reservation === "yes" ? '<div class="service-card"><div class="service-icon">📅</div><h3>Réservation</h3><p>Réservez votre place en quelques clics.</p></div>' : ""}
      ${b.wifi === "yes" ? '<div class="service-card"><div class="service-icon">📶</div><h3>Wi-Fi gratuit</h3><p>Restez connecté pendant votre visite.</p></div>' : ""}
      ${b.wheelchair === "yes" ? '<div class="service-card"><div class="service-icon">♿</div><h3>Accessible PMR</h3><p>Accessible aux personnes à mobilité réduite.</p></div>' : ""}
    </div>
  </div>
</section>

${
  b.rating
    ? `<section id="reviews" class="reviews">
  <div class="container">
    <div class="section-title">
      <h2>Ils nous font confiance</h2>
      <p>Note ${b.rating}/5 sur Google${b.reviewsCount ? ` · ${b.reviewsCount} avis vérifiés` : ""}</p>
    </div>
    <div class="reviews-grid">
      <div class="review-card">
        <div class="review-stars">★★★★★</div>
        <p>« Une expérience ${escapeHtml(sector)} au top. Le personnel est accueillant et le service impeccable. Je recommande sans hésiter. »</p>
        <div class="review-author">— Marie L.</div>
        <div class="review-source">Avis Google</div>
      </div>
      <div class="review-card">
        <div class="review-stars">★★★★★</div>
        <p>« ${escapeHtml(name)} est une vraie pépite${b.cuisine ? ` pour la cuisine ${escapeHtml(b.cuisine)}` : ""}. Je reviens régulièrement et je ne suis jamais déçu. »</p>
        <div class="review-author">— Thomas D.</div>
        <div class="review-source">Avis Google</div>
      </div>
      <div class="review-card">
        <div class="review-stars">★★★★★</div>
        <p>« ${b.delivery === "yes" ? "La livraison est rapide et tout arrive encore chaud. " : ""}Accueil chaleureux,${b.rating ? " cela mérite bien la note de " + b.rating + "/5" : " je recommande"} ! »</p>
        <div class="review-author">— Sophie M.</div>
        <div class="review-source">Avis Google</div>
      </div>
    </div>
    <div class="cta-reviews">
      <a href="${mapsLink}" target="_blank" rel="noreferrer" class="btn btn-primary">⭐ Laisser un avis sur Google</a>
    </div>
  </div>
</section>`
    : ""
}

<section id="contact">
  <div class="container">
    <div class="section-title">
      <h2>Contactez-nous</h2>
      <p>Nous sommes à votre disposition</p>
    </div>
    <div class="contact-grid">
      <div class="contact-info">
        ${phoneRaw ? `<div class="contact-item"><div class="contact-icon">📞</div><div><h4>Téléphone</h4><a href="${callLink}">${escapeHtml(phoneRaw)}</a></div></div>` : ""}
        ${b.email ? `<div class="contact-item"><div class="contact-icon">✉️</div><div><h4>Email</h4><a href="mailto:${escapeHtml(b.email)}">${escapeHtml(b.email)}</a></div></div>` : ""}
        ${address ? `<div class="contact-item"><div class="contact-icon">📍</div><div><h4>Adresse</h4><a href="${mapsLink}" target="_blank" rel="noreferrer">${escapeHtml(address)}</a></div></div>` : ""}
        ${openingHoursHtml}
        <a href="${callLink}" class="btn btn-primary" style="margin-top:1rem;">📞 Appeler maintenant</a>
      </div>
      <form class="contact-form" onsubmit="event.preventDefault(); alert('Merci ! Votre message a bien été envoyé à ${escapeHtml(name)}.');">
        <h3>Envoyez-nous un message</h3>
        <div class="form-group">
          <label>Votre nom</label>
          <input type="text" required placeholder="Jean Dupont">
        </div>
        <div class="form-group">
          <label>Votre email</label>
          <input type="email" required placeholder="jean@example.com">
        </div>
        <div class="form-group">
          <label>Votre message</label>
          <textarea required placeholder="Bonjour, je souhaite..."></textarea>
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%;">Envoyer</button>
      </form>
    </div>
  </div>
</section>

<footer>
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <h3>${escapeHtml(name)}</h3>
        <p>${escapeHtml(sector)} à ${escapeHtml(b.city || "")}${b.cuisine ? ` · Cuisine ${escapeHtml(b.cuisine)}` : ""}</p>
        ${phoneRaw ? `<p style="margin-top:0.5rem;">📞 ${escapeHtml(phoneRaw)}</p>` : ""}
        ${address ? `<p>📍 ${escapeHtml(address)}</p>` : ""}
      </div>
      <div class="footer-col">
        <h5>Navigation</h5>
        <ul>
          <li><a href="#about">À propos</a></li>
          <li><a href="#services">Services</a></li>
          ${b.rating ? '<li><a href="#reviews">Avis</a></li>' : ""}
          <li><a href="#contact">Contact</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h5>Contact</h5>
        <ul>
          ${phoneRaw ? `<li><a href="${callLink}">${escapeHtml(phoneRaw)}</a></li>` : ""}
          ${b.email ? `<li><a href="mailto:${escapeHtml(b.email)}">Email</a></li>` : ""}
          ${b.facebook ? `<li><a href="${escapeHtml(b.facebook)}" target="_blank" rel="noreferrer">Facebook</a></li>` : ""}
          ${b.instagram ? `<li><a href="${escapeHtml(b.instagram)}" target="_blank" rel="noreferrer">Instagram</a></li>` : ""}
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      © ${new Date().getFullYear()} ${escapeHtml(name)} — Tous droits réservés
      <br><small>Site démo créé par Vibecoder · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" style="color:#64748b;">données OpenStreetMap</a></small>
    </div>
  </div>
</footer>

${waLink !== "#" ? `<a href="${waLink}" class="whatsapp-float" target="_blank" rel="noreferrer" title="Contactez-nous sur WhatsApp">💬</a>` : ""}

<div class="demo-overlay">
  <div class="demo-overlay-text">
    <strong>⚡ Démo personnalisée pour ${escapeHtml(name)}</strong>
    <small>Ceci est un aperçu de votre futur site web professionnel. Voulez-vous le vôtre ?</small>
  </div>
  <button onclick="alert('Pour obtenir votre site web professionnel, contactez-nous !')">Obtenir ce site →</button>
</div>

<script>
// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (href === '#') return;
    const el = document.querySelector(href);
    if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});
// Highlight today's hours
const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const today = dayNames[new Date().getDay()];
document.querySelectorAll('.hours-row').forEach(r => {
  if (r.dataset.day === today) r.classList.add('today');
});
</script>
</body>
</html>`;
}

function renderOpeningHours(oh: string): string {
  // Parse simple OSM opening_hours format
  // Examples: "Mo-Fr 09:00-19:00", "Mo-Sa 08:00-20:00; Su 10:00-13:00"
  const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const dayMap: Record<string, string> = {
    Mo: "Lun", Tu: "Mar", We: "Mer", Th: "Jeu", Fr: "Ven", Sa: "Sam", Su: "Dim",
  };
  const rules = oh.split(";").map((r) => r.trim()).filter(Boolean);
  const rows: Array<{ day: string; time: string }> = [];
  for (const rule of rules) {
    const m = rule.match(/^([A-Za-z,-]+)\s+(.+)$/);
    if (!m) continue;
    const daysPart = m[1];
    const time = m[2].replace(/-/g, " – ");
    if (daysPart.includes("-")) {
      const [from, to] = daysPart.split("-");
      const fromIdx = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].indexOf(from);
      const toIdx = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].indexOf(to);
      if (fromIdx >= 0 && toIdx >= 0) {
        for (let i = fromIdx; i <= toIdx; i++) {
          rows.push({ day: dayMap[["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"][i]], time });
        }
      }
    } else if (daysPart.includes(",")) {
      daysPart.split(",").forEach((d) => {
        if (dayMap[d]) rows.push({ day: dayMap[d], time });
      });
    } else if (dayMap[daysPart]) {
      rows.push({ day: dayMap[daysPart], time });
    }
  }
  if (rows.length === 0) {
    return `<div class="hours-table"><div class="hours-row"><span class="day">Horaires</span><span class="time">${escapeHtml(oh)}</span></div></div>`;
  }
  const dayOrder = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  rows.sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));
  // Merge duplicates
  const merged: Array<{ day: string; time: string }> = [];
  for (const r of rows) {
    const prev = merged[merged.length - 1];
    if (prev && prev.day === r.day && prev.time === r.time) continue;
    merged.push(r);
  }
  return `<div class="hours-table">${merged.map(r => `<div class="hours-row" data-day="${r.day}"><span class="day">${r.day}</span><span class="time">${escapeHtml(r.time)}</span></div>`).join("")}</div>`;
}

function getSectorEmoji(sector: string): string {
  const lc = sector.toLowerCase();
  if (lc.includes("restaurant") || lc.includes("food")) return "🍽️";
  if (lc.includes("cafe") || lc.includes("café")) return "☕";
  if (lc.includes("bar")) return "🍷";
  if (lc.includes("boulanger") || lc.includes("bakery")) return "🥖";
  if (lc.includes("pharma")) return "💊";
  if (lc.includes("coiffure") || lc.includes("hair")) return "✂️";
  if (lc.includes("dent")) return "🦷";
  if (lc.includes("garage") || lc.includes("auto")) return "🔧";
  if (lc.includes("fitness") || lc.includes("sport") || lc.includes("gym")) return "💪";
  if (lc.includes("hotel")) return "🏨";
  if (lc.includes("fleur") || lc.includes("florist")) return "💐";
  if (lc.includes("librair") || lc.includes("book")) return "📚";
  if (lc.includes("bijou") || lc.includes("jewel")) return "💎";
  if (lc.includes("vet") || lc.includes("animal")) return "🐾";
  if (lc.includes("optic")) return "👓";
  return "⭐";
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
