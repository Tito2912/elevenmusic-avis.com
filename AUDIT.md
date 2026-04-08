# Audit complet (contenu / technique / SEO / i18n)

Repo: `elevenmusic-avis.com`  
Date audit: 2026-04-08

## Resume executif

- Le site est maintenant structure en 4 langues (FR/EN/ES/DE) avec `hreflang` + `canonical` coherents sur les 24 pages HTML.
- Les pages principales sont indexables (home + 2 articles + pages legales). Les hubs `/blog` restent en `noindex` (et sont retires du sitemap).
- Headers Netlify: securite (CSP, HSTS, etc.) + cache court par defaut pour les pages (utile avec URLs sans extension), et cache long pour les assets.

## i18n (vraie internationalisation)

OK
- `lang` HTML par page (`fr`, `en`, `es`, `de`).
- `hreflang` (fr/en/es/de + `x-default`) sur toutes les pages.
- Selecteur de langue present et fonctionnel (mapping propre entre pages equivalentes).
- Redirection automatique limitee (uniquement 1ere visite sur la home, pas bots, pas referrer moteurs) pour eviter les soucis SEO.

A verifier / a ameliorer
- Uniformiser les chemins d'assets (preferer `/images/...`, `/main.min.js`, `/style.min.css` partout) pour eviter les erreurs relatives.

## SEO technique

OK
- Balises `title`, `meta description`, `meta robots`, `canonical`, `hreflang` presentes et coherentes.
- `sitemap.xml` contient uniquement des URLs indexables et les alternates hreflang.
- OpenGraph + Twitter Cards en place avec image 1200x630.

Points a surveiller
- `main.min.js` / `style.min.css` ne sont pas fingerprintes: OK avec cache court, mais eviter de les mettre en cache 1 an.
- RGPD/GA4: chargement GA4 centralise dans `main.js` (plus de script inline duplique).

## SEO contenu

Forces
- Intent clair: avis / prompts / affiliation.
- Structure Hn globalement propre (1 seul H1 par page).

Risques (a traiter)
- Formulations trop absolues: "zero copyright strike", "aucune violation de droits", "Merlin/Kobalt couvrent la legalite".
  - Recommandation: reformuler en promesses conditionnelles + citer la source officielle + ajouter une phrase de prudence (pas une garantie).
- Cohesion multi-langue: s'assurer que les traductions ES/DE sont naturelles (pas uniquement litterales).

## Performance (qualitatif)

OK
- Favicon PNG optimisee.
- `loading=\"lazy\"` present sur la plupart des images non critiques.
- Preload LCP (poster hero / hero blog).

Opportunites
- Externaliser/heberger localement certaines icones (actuellement via `cdn-icons-png.flaticon.com`) pour reduire DNS/TLS et stabiliser le rendu.
- Verifier que les preconnects correspondent a des ressources vraiment utilisees.

## Accessibilite (qualitatif)

OK
- Menu mobile, FAQ, toasts: bases a11y presentes (aria-label, aria-expanded, aria-live).
- `prefers-reduced-motion` respecte dans le JS.

Opportunites
- Revoir quelques textes d'ALT pour qu'ils soient descriptifs (sans sur-optimiser SEO).

## Securite / RGPD

OK
- Headers de securite (HSTS, COOP/CORP, CSP, frame-ancestors none).
- Consent Mode v2: consent par defaut refuse, GA charge apres acceptation.

Points a valider
- Robots IA: si tu souhaites vraiment interdire certains crawlers IA, s'assurer que `robots.txt` refletera bien cette politique (sinon, ajuster `llms.txt`).

## Build / deploy (Netlify)

Critique (P0)
- Fichiers references mais non suivis git a ajouter avant deploy:
  - `scripts/ping-indexnow.cjs` (commande Netlify)
  - `images/hero-poster.jpg`
  - `images/og-elevenmusic.jpg`

## Actions recommandees (priorites)

- P0: Ajouter/committer les fichiers non suivis indispensables (`scripts/` + images).
- P0: Valider la strategie sur les promesses "copyright" et reformuler si besoin.
- P2: Envisager de minifier reellement `main.min.js` et `style.min.css` (ou renommer sans `.min`).
- P2: Decider si les hubs `/blog` doivent etre indexables (si oui: enlever `noindex` et remettre dans le sitemap).
