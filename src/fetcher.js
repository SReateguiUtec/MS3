/**
 * fetcher.js — Ingesta de noticias reales desde Finnhub y NewsAPI.
 *
 * Uso:
 *   node src/fetcher.js
 *   npm run fetch
 *
 * Variables de entorno requeridas (.env):
 *   FINHUB_API_KEY   — token de finnhub.io
 *   NEWS_API_KEY     — API key de newsapi.org
 *   DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Noticia  = require('./models/Noticia');

// ── Config ──────────────────────────────────────────────────────────────────
const FINNHUB_KEY = process.env.FINHUB_API_KEY;
const NEWSAPI_KEY = process.env.NEWS_API_KEY;

const SYMBOLS = [
  // Tecnología
  'AAPL', 'NVDA', 'MSFT', 'GOOGL', 'META', 'AMZN', 'AMD', 'INTC', 'CRM', 'ADBE', 'NFLX', 'TSLA',
  // Finanzas
  'JPM', 'BAC', 'GS', 'V', 'MA',
  // Salud
  'JNJ', 'PFE', 'UNH',
  // Energía
  'XOM', 'CVX',
  // Consumo
  'WMT', 'KO', 'NKE',
  // ETFs
  'SPY', 'QQQ',
];

// Términos de búsqueda para NewsAPI (más descriptivos que el ticker solo)
const NEWSAPI_QUERIES = {
  // Tecnología
  AAPL:  'Apple stock AAPL',
  NVDA:  'NVIDIA stock NVDA',
  MSFT:  'Microsoft stock MSFT',
  GOOGL: 'Google Alphabet GOOGL',
  META:  'Meta Platforms stock META',
  AMZN:  'Amazon stock AMZN',
  AMD:   'AMD Advanced Micro Devices stock',
  INTC:  'Intel stock INTC',
  CRM:   'Salesforce stock CRM',
  ADBE:  'Adobe stock ADBE',
  NFLX:  'Netflix stock NFLX',
  TSLA:  'Tesla stock TSLA',
  // Finanzas
  JPM:   'JPMorgan Chase stock JPM',
  BAC:   'Bank of America stock BAC',
  GS:    'Goldman Sachs stock GS',
  V:     'Visa stock V',
  MA:    'Mastercard stock MA',
  // Salud
  JNJ:   'Johnson Johnson stock JNJ',
  PFE:   'Pfizer stock PFE',
  UNH:   'UnitedHealth stock UNH',
  // Energía
  XOM:   'Exxon Mobil stock XOM',
  CVX:   'Chevron stock CVX',
  // Consumo
  WMT:   'Walmart stock WMT',
  KO:    'Coca-Cola stock KO',
  NKE:   'Nike stock NKE',
  // ETFs
  SPY:   'S&P 500 ETF SPY market',
  QQQ:   'QQQ Nasdaq ETF market',
};

// Fuente de cada proveedor (nombre denormalizado)
const FUENTE_FINNHUB  = 'Finnhub';
const FUENTE_NEWSAPI  = 'NewsAPI';

// Rango de fechas para Finnhub (últimos 30 días)
function finnhubDateRange() {
  const to   = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 30);
  const fmt = (d) => d.toISOString().split('T')[0];
  return { from: fmt(from), to: fmt(to) };
}

// ── Utilidades ───────────────────────────────────────────────────────────────
async function httpGet(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  return res.json();
}

/**
 * Heurística simple de sentimiento basada en palabras clave del titular.
 * No reemplaza un modelo NLP, pero funciona como señal inicial.
 */
function inferSentimiento(texto) {
  const t = texto.toLowerCase();

  const bullishWords = [
    'surges','surge','rises','rise','beats','beat','record','gains','gain',
    'rally','rallies','exceeds','exceed','growth','profit','up','high',
    'soars','soar','jumps','jump','outperforms','bullish','upgrade',
    'strong','positive','expansion','milestone','breakthrough',
  ];
  const bearishWords = [
    'falls','fall','drops','drop','misses','miss','down','loss','losses',
    'decline','cut','crash','slumps','slump','warns','warning','risk',
    'concern','struggles','struggle','weaker','weak','layoffs','lawsuit',
    'fine','penalty','downgrade','bearish','negative','deficit','probe',
  ];

  const bScore = bullishWords.filter(w => t.includes(w)).length;
  const bsScore = bearishWords.filter(w => t.includes(w)).length;

  if (bScore > bsScore)  return 'Bullish';
  if (bsScore > bScore)  return 'Bearish';
  return 'Neutral';
}

// ── Conexión a MongoDB ────────────────────────────────────────────────────────
function buildMongoUri() {
  const host     = process.env.DB_HOST     || 'localhost';
  const port     = process.env.DB_PORT     || '27017';
  // DB_NAME puede traer ?authSource=admin; separamos sólo el nombre
  const rawName  = process.env.DB_NAME     || 'noticias_db';
  const dbName   = rawName.split('?')[0];
  const authSrc  = rawName.includes('authSource') ? `?${rawName.split('?')[1]}` : '';
  const user     = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;

  if (user && password) {
    return `mongodb://${user}:${password}@${host}:${port}/${dbName}${authSrc}`;
  }
  return `mongodb://${host}:${port}/${dbName}${authSrc}`;
}

// ── Deduplicación ─────────────────────────────────────────────────────────────
async function upsert(doc) {
  if (!doc.url) return;
  await Noticia.updateOne(
    { url: doc.url },
    { $setOnInsert: doc },
    { upsert: true }
  );
}

// ── Finnhub ───────────────────────────────────────────────────────────────────
async function fetchFinnhub(symbol) {
  if (!FINNHUB_KEY) {
    console.warn('  [Finnhub] FINHUB_API_KEY no configurada, omitiendo.');
    return 0;
  }

  const { from, to } = finnhubDateRange();
  const url = `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${FINNHUB_KEY}`;

  let articulos;
  try {
    articulos = await httpGet(url);
  } catch (err) {
    console.error(`  [Finnhub] Error en ${symbol}:`, err.message);
    return 0;
  }

  if (!Array.isArray(articulos) || articulos.length === 0) {
    console.log(`  [Finnhub] Sin artículos para ${symbol}`);
    return 0;
  }

  let insertados = 0;
  for (const art of articulos) {
    const titulo = art.headline || art.summary || '';
    if (!titulo || !art.url) continue;

    const doc = {
      titulo,
      simbolo:          symbol,
      sentimiento:      inferSentimiento(titulo),
      fuente:           art.source || FUENTE_FINNHUB,
      url:              art.url,
      fechaPublicacion: art.datetime ? new Date(art.datetime * 1000) : new Date(),
      createdAt:        new Date(),
    };

    await upsert(doc);
    insertados++;
  }

  return insertados;
}

// ── NewsAPI ───────────────────────────────────────────────────────────────────
async function fetchNewsAPI(symbol) {
  if (!NEWSAPI_KEY) {
    console.warn('  [NewsAPI] NEWS_API_KEY no configurada, omitiendo.');
    return 0;
  }

  const q   = encodeURIComponent(NEWSAPI_QUERIES[symbol]);
  const url = `https://newsapi.org/v2/everything?q=${q}&language=en&sortBy=publishedAt&pageSize=20&apiKey=${NEWSAPI_KEY}`;

  let data;
  try {
    data = await httpGet(url);
  } catch (err) {
    console.error(`  [NewsAPI] Error en ${symbol}:`, err.message);
    return 0;
  }

  if (!data.articles || data.articles.length === 0) {
    console.log(`  [NewsAPI] Sin artículos para ${symbol}`);
    return 0;
  }

  let insertados = 0;
  for (const art of data.articles) {
    const titulo = art.title || '';
    if (!titulo || !art.url || titulo === '[Removed]') continue;

    const doc = {
      titulo,
      simbolo:          symbol,
      sentimiento:      inferSentimiento(titulo),
      fuente:           art.source?.name || FUENTE_NEWSAPI,
      url:              art.url,
      fechaPublicacion: art.publishedAt ? new Date(art.publishedAt) : new Date(),
      createdAt:        new Date(),
    };

    await upsert(doc);
    insertados++;
  }

  return insertados;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Conectando a MongoDB...');
  await mongoose.connect(buildMongoUri());
  console.log('Conexión establecida.\n');

  let totalFinnhub = 0;
  let totalNewsAPI = 0;

  for (const symbol of SYMBOLS) {
    console.log(`─── ${symbol} ───`);

    const fh = await fetchFinnhub(symbol);
    console.log(`  [Finnhub] ${fh} noticias procesadas`);
    totalFinnhub += fh;

    const na = await fetchNewsAPI(symbol);
    console.log(`  [NewsAPI] ${na} noticias procesadas`);
    totalNewsAPI += na;
  }

  console.log('\n─────────────────────────────────────');
  console.log(`Finnhub  total: ${totalFinnhub} artículos`);
  console.log(`NewsAPI  total: ${totalNewsAPI} artículos`);
  console.log('Ingesta completada ✓');

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error fatal en fetcher:', err);
  process.exit(1);
});
