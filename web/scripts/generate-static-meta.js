/* eslint-disable */
/**
 * Post-build SSG step.
 *
 * Reads frontend/build/index.html and writes one variant per static route
 * (12 zodiac landings, /pricing) with route-specific <title>, <meta
 * description>, og:*, twitter:*, canonical and JSON-LD baked into the HTML
 * head. Vercel's filesystem handler picks these up before the SPA
 * fallback, so non-JS crawlers (facebookexternalhit, linkedinbot,
 * slackbot, older twitterbot) see proper meta instead of the generic
 * site card.
 *
 * The React SPA still mounts on top and overwrites these tags with
 * the dated/live versions for users — only crawlers see the static stub.
 */

const fs = require('fs');
const path = require('path');

const buildDir = path.resolve(__dirname, '..', 'build');
const indexPath = path.join(buildDir, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('[generate-static-meta] build/index.html not found — run craco build first');
  process.exit(1);
}

const baseHtml = fs.readFileSync(indexPath, 'utf8');

const SITE = 'https://nataltruth.com';
const DEFAULT_OG_IMAGE = `${SITE}/favicon.svg`;

const ZODIAC = {
  aries:       { name: 'Aries',       glyph: '♈', element: 'Fire',  ruler: 'Mars',     dates: 'March 21 - April 19' },
  taurus:      { name: 'Taurus',      glyph: '♉', element: 'Earth', ruler: 'Venus',    dates: 'April 20 - May 20' },
  gemini:      { name: 'Gemini',      glyph: '♊', element: 'Air',   ruler: 'Mercury',  dates: 'May 21 - June 20' },
  cancer:      { name: 'Cancer',      glyph: '♋', element: 'Water', ruler: 'Moon',     dates: 'June 21 - July 22' },
  leo:         { name: 'Leo',         glyph: '♌', element: 'Fire',  ruler: 'Sun',      dates: 'July 23 - August 22' },
  virgo:       { name: 'Virgo',       glyph: '♍', element: 'Earth', ruler: 'Mercury',  dates: 'August 23 - September 22' },
  libra:       { name: 'Libra',       glyph: '♎', element: 'Air',   ruler: 'Venus',    dates: 'September 23 - October 22' },
  scorpio:     { name: 'Scorpio',     glyph: '♏', element: 'Water', ruler: 'Pluto',    dates: 'October 23 - November 21' },
  sagittarius: { name: 'Sagittarius', glyph: '♐', element: 'Fire',  ruler: 'Jupiter',  dates: 'November 22 - December 21' },
  capricorn:   { name: 'Capricorn',   glyph: '♑', element: 'Earth', ruler: 'Saturn',   dates: 'December 22 - January 19' },
  aquarius:    { name: 'Aquarius',    glyph: '♒', element: 'Air',   ruler: 'Uranus',   dates: 'January 20 - February 18' },
  pisces:      { name: 'Pisces',      glyph: '♓', element: 'Water', ruler: 'Neptune',  dates: 'February 19 - March 20' },
};

function htmlEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderHead({ title, description, url, ogType = 'website', jsonLd }) {
  const t = htmlEscape(title);
  const d = htmlEscape(description);
  const u = htmlEscape(url);
  const lines = [
    `<title>${t}</title>`,
    `<meta name="description" content="${d}" />`,
    `<link rel="canonical" href="${u}" />`,
    `<meta property="og:type" content="${ogType}" />`,
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${d}" />`,
    `<meta property="og:url" content="${u}" />`,
    `<meta property="og:image" content="${DEFAULT_OG_IMAGE}" />`,
    `<meta property="og:site_name" content="Gab44" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${t}" />`,
    `<meta name="twitter:description" content="${d}" />`,
    `<meta name="twitter:image" content="${DEFAULT_OG_IMAGE}" />`,
  ];
  if (jsonLd) {
    lines.push(
      `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`
    );
  }
  return lines.join('\n        ');
}

/**
 * Replace the default head meta block (description, og:*, twitter:*, title)
 * with the route-specific block. Other head content (favicon, fonts,
 * preload, OneSignal init) is preserved untouched.
 */
function rewriteHead(html, headBlock) {
  let out = html;
  // Strip the default tags we're going to override
  const stripPatterns = [
    /\s*<meta\s+name="description"[^>]*>/i,
    /\s*<meta\s+property="og:type"[^>]*>/i,
    /\s*<meta\s+property="og:title"[^>]*>/i,
    /\s*<meta\s+property="og:description"[^>]*>/i,
    /\s*<meta\s+property="og:url"[^>]*>/i,
    /\s*<meta\s+name="twitter:card"[^>]*>/i,
    /\s*<meta\s+name="twitter:title"[^>]*>/i,
    /\s*<meta\s+name="twitter:description"[^>]*>/i,
    /\s*<title>[^<]*<\/title>/i,
  ];
  for (const re of stripPatterns) out = out.replace(re, '');
  // Inject just before </head>
  out = out.replace(/<\/head>/i, `        ${headBlock}\n    </head>`);
  return out;
}

function writeRoute(relPath, html) {
  // Write both forms so Vercel's filesystem handler picks one up regardless
  // of trailing-slash behavior:
  //   /zodiac/leo       -> build/zodiac/leo.html
  //   /zodiac/leo/      -> build/zodiac/leo/index.html
  const folderTarget = path.join(buildDir, relPath, 'index.html');
  const flatTarget = path.join(buildDir, `${relPath}.html`);
  fs.mkdirSync(path.dirname(folderTarget), { recursive: true });
  fs.writeFileSync(folderTarget, html, 'utf8');
  fs.writeFileSync(flatTarget, html, 'utf8');
  console.log(
    `[generate-static-meta] wrote ${path.relative(buildDir, folderTarget)} + ${path.relative(buildDir, flatTarget)}`
  );
}

// ---- /zodiac/{slug} ----
for (const [slug, m] of Object.entries(ZODIAC)) {
  const url = `${SITE}/zodiac/${slug}`;
  const title = `${m.name} Daily Horoscope - Free Reading from Gab44`;
  const description = `${m.name} (${m.dates}) daily horoscope - love, career, wellness, lucky number and color. ${m.element} sign ruled by ${m.ruler}. Free reading refreshed every morning by AI astrologers.`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    author: { '@type': 'Organization', name: 'Gab44' },
    publisher: {
      '@type': 'Organization',
      name: 'Gab44',
      logo: { '@type': 'ImageObject', url: DEFAULT_OG_IMAGE },
    },
    mainEntityOfPage: url,
    about: { '@type': 'Thing', name: `${m.name} zodiac sign` },
  };
  const head = renderHead({ title, description, url, ogType: 'article', jsonLd });
  writeRoute(`zodiac/${slug}`, rewriteHead(baseHtml, head));
}

// ---- /pricing ----
{
  const url = `${SITE}/pricing`;
  const title = 'Pricing - Gab44 AI Astrology Coaching';
  const description = 'Choose your Gab44 plan: free Seeker access, $9.99/mo Enthusiast with 7-day free trial, $29.99/mo Advanced, or $99/mo Professional. Plus $19 personalized written readings.';
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Gab44 Astrology AI Coaching',
    description:
      'AI-powered birth-chart readings, daily horoscope coaching, transit forecasts, and one-time personalized readings from real astrologers.',
    brand: { '@type': 'Brand', name: 'Gab44' },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: '0',
      highPrice: '99',
      offerCount: 4,
      offers: [
        { '@type': 'Offer', name: 'Personal Astrology Reading (one-time)', price: '19.00', priceCurrency: 'USD', url, availability: 'https://schema.org/InStock' },
        { '@type': 'Offer', name: 'Enthusiast subscription',  price: '9.99',  priceCurrency: 'USD', url, availability: 'https://schema.org/InStock' },
        { '@type': 'Offer', name: 'Advanced subscription',     price: '29.99', priceCurrency: 'USD', url, availability: 'https://schema.org/InStock' },
        { '@type': 'Offer', name: 'Professional subscription', price: '99.00', priceCurrency: 'USD', url, availability: 'https://schema.org/InStock' },
      ],
    },
  };
  const head = renderHead({ title, description, url, ogType: 'website', jsonLd: productSchema });
  writeRoute('pricing', rewriteHead(baseHtml, head));
}

// ---- /horoscope/today ----
{
  const url = `${SITE}/horoscope/today`;
  const title = "Today's Horoscope for All 12 Zodiac Signs - Gab44";
  const description = 'Daily horoscopes for every zodiac sign - love, career, wellness, lucky number for Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces. Refreshed every morning by Gab44.';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    author: { '@type': 'Organization', name: 'Gab44' },
    publisher: {
      '@type': 'Organization',
      name: 'Gab44',
      logo: { '@type': 'ImageObject', url: DEFAULT_OG_IMAGE },
    },
    mainEntityOfPage: url,
  };
  const head = renderHead({ title, description, url, ogType: 'article', jsonLd });
  writeRoute('horoscope/today', rewriteHead(baseHtml, head));
}

// ---- sitemap.xml ----
// Regenerate the sitemap so <lastmod> reflects this build date. The 12
// zodiac landings render daily-refreshed horoscope content, so we want
// the sitemap to advertise today's date as lastmod for each of them
// (and for the homepage). Operator should redeploy daily for max
// crawl freshness; this also lets ad-hoc deploys move the lastmod
// without an out-of-band cron.
{
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC
  const entries = [
    { loc: `${SITE}/`,                 changefreq: 'daily',   priority: '1.0', lastmod: today },
    { loc: `${SITE}/horoscope/today`,  changefreq: 'daily',   priority: '0.95', lastmod: today },
    { loc: `${SITE}/pricing`,          changefreq: 'monthly', priority: '0.8', lastmod: today },
    { loc: `${SITE}/auth`,             changefreq: 'monthly', priority: '0.4' },
    ...Object.keys(ZODIAC).map((slug) => ({
      loc: `${SITE}/zodiac/${slug}`,
      changefreq: 'daily',
      priority: '0.9',
      lastmod: today,
    })),
  ];
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries
      .map((e) => {
        const lines = [
          `  <url>`,
          `    <loc>${e.loc}</loc>`,
          e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
          `    <changefreq>${e.changefreq}</changefreq>`,
          `    <priority>${e.priority}</priority>`,
          `  </url>`,
        ].filter(Boolean);
        return lines.join('\n');
      })
      .join('\n') +
    `\n</urlset>\n`;
  fs.writeFileSync(path.join(buildDir, 'sitemap.xml'), xml, 'utf8');
  console.log('[generate-static-meta] wrote sitemap.xml');
}

console.log('[generate-static-meta] done');
