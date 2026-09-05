/* ------------------------------------------------------------------ */
/*  Base géographique — villes et régions réelles par pays.            */
/*  Sert à la rotation automatique du balayage national :              */
/*  villes principales d'abord (densité de fiches), puis régions       */
/*  (ratissage des zones rurales non couvertes par les villes).        */
/* ------------------------------------------------------------------ */

export interface GeoCountry {
  /** Villes classées par population décroissante */
  cities: string[];
  /** Régions / provinces / états administratifs */
  regions: string[];
}

export const GEO: Record<string, GeoCountry> = {
  fr: {
    cities: [
      "Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Montpellier",
      "Strasbourg", "Bordeaux", "Lille", "Rennes", "Reims", "Toulon", "Saint-Étienne",
      "Le Havre", "Grenoble", "Dijon", "Angers", "Nîmes", "Villeurbanne",
      "Clermont-Ferrand", "Le Mans", "Aix-en-Provence", "Brest", "Tours", "Amiens",
      "Limoges", "Annecy", "Perpignan", "Besançon", "Metz", "Orléans", "Rouen",
      "Mulhouse", "Caen", "Nancy", "Argenteuil", "Montreuil", "Roubaix", "Tourcoing",
      "Nanterre", "Avignon", "Poitiers", "Versailles", "Pau", "La Rochelle", "Calais",
      "Antibes", "Béziers", "Colmar", "Bourges", "Quimper", "Valence", "Troyes",
      "Lorient", "Chambéry", "Niort", "Saint-Nazaire", "Vannes", "Cholet",
    ],
    regions: [
      "Île-de-France", "Auvergne-Rhône-Alpes", "Nouvelle-Aquitaine", "Occitanie",
      "Hauts-de-France", "Grand Est", "Provence-Alpes-Côte d'Azur", "Pays de la Loire",
      "Normandie", "Bretagne", "Bourgogne-Franche-Comté", "Centre-Val de Loire", "Corse",
    ],
  },
  be: {
    cities: [
      "Bruxelles", "Anvers", "Gand", "Charleroi", "Liège", "Bruges", "Namur",
      "Louvain", "Mons", "Alost", "Malines", "La Louvière", "Courtrai", "Hasselt",
      "Ostende", "Tournai", "Genk", "Seraing", "Roulers", "Verviers", "Mouscron",
      "Wavre", "Arlon", "Dinant", "Ypres",
    ],
    regions: [
      "Région de Bruxelles-Capitale", "Anvers", "Flandre-Orientale", "Flandre-Occidentale",
      "Brabant flamand", "Limbourg", "Hainaut", "Liège", "Namur", "Brabant wallon",
      "Luxembourg belge",
    ],
  },
  ch: {
    cities: [
      "Zurich", "Genève", "Bâle", "Lausanne", "Berne", "Winterthour", "Lucerne",
      "Saint-Gall", "Lugano", "Bienne", "Thoune", "Fribourg", "Neuchâtel", "Sion",
      "La Chaux-de-Fonds", "Vernier", "Yverdon-les-Bains", "Montreux", "Zoug", "Coire",
    ],
    regions: [
      "Canton de Zurich", "Canton de Berne", "Canton de Vaud", "Canton de Genève",
      "Canton d'Argovie", "Canton de Saint-Gall", "Canton de Lucerne", "Tessin",
      "Valais", "Canton de Fribourg", "Bâle-Ville", "Bâle-Campagne", "Neuchâtel", "Jura",
    ],
  },
  lu: {
    cities: [
      "Luxembourg-Ville", "Esch-sur-Alzette", "Differdange", "Dudelange", "Ettelbruck",
      "Diekirch", "Wiltz", "Echternach", "Grevenmacher", "Remich", "Mersch", "Bettembourg",
    ],
    regions: ["Canton de Luxembourg", "Canton d'Esch-sur-Alzette", "Canton de Diekirch", "Canton de Grevenmacher"],
  },
  ca: {
    cities: [
      "Toronto", "Montréal", "Vancouver", "Calgary", "Edmonton", "Ottawa", "Québec",
      "Winnipeg", "Hamilton", "Kitchener", "London", "Victoria", "Halifax", "Oshawa",
      "Windsor", "Saskatoon", "Regina", "Sherbrooke", "Trois-Rivières", "Gatineau",
      "Laval", "Longueuil", "Surrey", "Burnaby", "Mississauga", "Brampton", "Lévis",
    ],
    regions: [
      "Ontario", "Québec", "Colombie-Britannique", "Alberta", "Manitoba", "Saskatchewan",
      "Nouvelle-Écosse", "Nouveau-Brunswick", "Terre-Neuve-et-Labrador",
      "Île-du-Prince-Édouard",
    ],
  },
  ma: {
    cities: [
      "Casablanca", "Rabat", "Fès", "Marrakech", "Tanger", "Meknès", "Agadir", "Oujda",
      "Kénitra", "Tétouan", "Salé", "Témara", "Safi", "Mohammédia", "Khouribga",
      "El Jadida", "Béni Mellal", "Nador", "Taza", "Settat", "Berrechid", "Khémisset",
      "Larache", "Essaouira", "Ouarzazate", "Al Hoceïma", "Errachidia", "Laâyoune",
    ],
    regions: [
      "Casablanca-Settat", "Rabat-Salé-Kénitra", "Marrakech-Safi", "Fès-Meknès",
      "Tanger-Tétouan-Al Hoceïma", "Souss-Massa", "Oriental", "Béni Mellal-Khénifra",
      "Drâa-Tafilalet", "Guelmim-Oued Noun", "Laâyoune-Sakia El Hamra",
      "Dakhla-Oued Ed-Dahab",
    ],
  },
  dz: {
    cities: [
      "Alger", "Oran", "Constantine", "Annaba", "Blida", "Batna", "Sétif", "Tlemcen",
      "Béjaïa", "Tizi Ouzou", "Djelfa", "Sidi Bel Abbès", "Biskra", "Tébessa", "Skikda",
      "Chlef", "Mostaganem", "Bordj Bou Arreridj", "Ouargla", "Béchar", "Ghardaïa",
      "Médéa", "Jijel", "Mascara", "Relizane",
    ],
    regions: [
      "Wilaya d'Alger", "Wilaya d'Oran", "Wilaya de Constantine", "Wilaya d'Annaba",
      "Wilaya de Blida", "Wilaya de Sétif", "Wilaya de Tizi Ouzou", "Wilaya de Béjaïa",
      "Wilaya de Tlemcen", "Wilaya de Batna", "Wilaya de Ouargla", "Wilaya de Ghardaïa",
    ],
  },
  tn: {
    cities: [
      "Tunis", "Sfax", "Sousse", "Ariana", "Ben Arous", "Nabeul", "Bizerte", "Gabès",
      "Kairouan", "Monastir", "Médenine", "Manouba", "Mahdia", "Gafsa", "Kasserine",
      "Tozeur", "Houmt Souk", "Hammamet", "La Marsa", "Zarzis", "Béja", "Le Kef",
    ],
    regions: [
      "Grand Tunis", "Gouvernorat de Sfax", "Gouvernorat de Sousse", "Gouvernorat de Nabeul",
      "Gouvernorat de Bizerte", "Gouvernorat de Monastir", "Gouvernorat de Kairouan",
      "Gouvernorat de Gabès", "Gouvernorat de Médenine", "Gouvernorat de Mahdia",
    ],
  },
  es: {
    cities: [
      "Madrid", "Barcelone", "Valence", "Séville", "Saragosse", "Málaga", "Murcie",
      "Palma", "Las Palmas", "Bilbao", "Alicante", "Cordoue", "Valladolid", "Vigo",
      "Gijón", "Grenade", "La Corogne", "Vitoria", "Elche", "Oviedo", "Saint-Sébastien",
      "Pampelune", "Santander", "Tolède", "Salamanque",
    ],
    regions: [
      "Communauté de Madrid", "Catalogne", "Andalousie", "Communauté valencienne",
      "Galice", "Castille-et-León", "Pays basque", "Castille-La Manche", "Canaries",
      "Région de Murcie", "Aragon", "Îles Baléares", "Estrémadure", "Asturies",
      "Navarre", "Cantabrie", "La Rioja",
    ],
  },
  pt: {
    cities: [
      "Lisbonne", "Porto", "Braga", "Coimbra", "Faro", "Aveiro", "Setúbal", "Funchal",
      "Guimarães", "Évora", "Viseu", "Leiria", "Cascais", "Sintra", "Vila Nova de Gaia",
      "Matosinhos", "Braga", "Portimão", "Albufeira",
    ],
    regions: [
      "Région de Lisbonne", "Nord", "Centre", "Alentejo", "Algarve", "Açores", "Madère",
    ],
  },
  de: {
    cities: [
      "Berlin", "Hambourg", "Munich", "Cologne", "Francfort", "Stuttgart", "Düsseldorf",
      "Leipzig", "Dortmund", "Essen", "Brême", "Dresde", "Hanovre", "Nuremberg",
      "Duisbourg", "Bochum", "Wuppertal", "Bielefeld", "Bonn", "Münster", "Karlsruhe",
      "Mannheim", "Augsbourg", "Wiesbaden", "Mönchengladbach", "Fribourg-en-Brisgau",
    ],
    regions: [
      "Rhénanie-du-Nord-Westphalie", "Bavière", "Bade-Wurtemberg", "Basse-Saxe", "Hesse",
      "Saxe", "Rhénanie-Palatinat", "Berlin", "Schleswig-Holstein", "Brandebourg",
      "Saxe-Anhalt", "Thuringe", "Hambourg", "Mecklembourg-Poméranie", "Sarre", "Brême",
    ],
  },
  it: {
    cities: [
      "Rome", "Milan", "Naples", "Turin", "Palerme", "Gênes", "Bologne", "Florence",
      "Bari", "Catane", "Venise", "Vérone", "Messine", "Padoue", "Trieste", "Brescia",
      "Parme", "Tarente", "Prato", "Modène", "Reggio de Calabre", "Pérouse", "Ravenne",
      "Livourne", "Cagliari",
    ],
    regions: [
      "Lombardie", "Latium", "Campanie", "Sicile", "Vénétie", "Piémont",
      "Émilie-Romagne", "Pouilles", "Toscane", "Calabre", "Sardaigne", "Ligurie",
      "Marches", "Abruzzes", "Frioul-Vénétie Julienne", "Trentin-Haut-Adige", "Ombrie",
      "Basilicate", "Molise", "Vallée d'Aoste",
    ],
  },
  gb: {
    cities: [
      "London", "Birmingham", "Manchester", "Glasgow", "Liverpool", "Leeds", "Sheffield",
      "Edinburgh", "Bristol", "Cardiff", "Belfast", "Leicester", "Coventry", "Nottingham",
      "Newcastle upon Tyne", "Brighton", "Southampton", "Portsmouth", "Reading", "Derby",
      "Plymouth", "Aberdeen", "Norwich", "Oxford", "Cambridge", "York",
    ],
    regions: [
      "Greater London", "South East England", "North West England", "West Midlands",
      "Yorkshire and the Humber", "East of England", "South West England",
      "East Midlands", "North East England", "Scotland", "Wales", "Northern Ireland",
    ],
  },
  us: {
    cities: [
      "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia",
      "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville",
      "Fort Worth", "Columbus", "Charlotte", "San Francisco", "Indianapolis", "Seattle",
      "Denver", "Boston", "Nashville", "Detroit", "Portland", "Las Vegas", "Miami",
      "Atlanta", "Kansas City", "Sacramento", "Tampa", "Minneapolis",
    ],
    regions: [
      "California", "Texas", "Florida", "New York State", "Pennsylvania", "Illinois",
      "Ohio", "Georgia", "North Carolina", "Michigan", "New Jersey", "Virginia",
      "Washington", "Arizona", "Massachusetts", "Tennessee", "Indiana", "Missouri",
      "Maryland", "Colorado",
    ],
  },
};

/* ------------------------------------------------------------------ */

export type ScopeMode = "manual" | "cities" | "regions" | "national";

export interface ScopePlan {
  zones: string[];
  label: string;
}

/**
 * Construit le plan de balayage.
 * - manual   : les zones saisies à la main
 * - cities   : les N plus grandes villes du pays
 * - regions  : toutes les régions administratives
 * - national : rotation villes → régions (couverture maximale)
 */
export function buildScopePlan(
  mode: ScopeMode,
  gl: string,
  manualZones: string[],
  cityCount: number
): ScopePlan {
  const geo = GEO[gl];
  if (mode === "manual" || !geo) {
    return { zones: manualZones, label: `${manualZones.length} zone(s) manuelle(s)` };
  }
  const cities = geo.cities.slice(0, Math.max(1, cityCount));

  if (mode === "cities") {
    return { zones: cities, label: `${cities.length} plus grandes villes` };
  }
  if (mode === "regions") {
    return { zones: [...geo.regions], label: `${geo.regions.length} régions` };
  }
  /* national : villes d'abord (fiches denses), puis régions (ratissage rural) */
  const zones = [...cities, ...geo.regions];
  return {
    zones,
    label: `${cities.length} villes + ${geo.regions.length} régions`,
  };
}

export function hasGeo(gl: string): boolean {
  return !!GEO[gl];
}

export function cityPool(gl: string): number {
  return GEO[gl]?.cities.length ?? 0;
}
