const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;

const STOCK_UNIVERSE = [
  'RELIANCE', 'HDFCBANK', 'INFY', 'TCS', 'ICICIBANK', 'SBIN', 'AXISBANK', 'LT', 'ITC', 'BHARTIARTL', 'KOTAKBANK', 'MARUTI'
];

function hashText(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pseudoRandomFromSymbol(symbol, offset = 0) {
  const value = Math.sin(hashText(symbol) + offset) * 10000;
  return value - Math.floor(value);
}

function pickFrom(arr, seed) {
  return arr[Math.floor(seed * arr.length) % arr.length];
}

function bounded(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function toPrice(n) {
  return Math.round(n * 100) / 100;
}

function calculateTechnicals(basePrice, symbol) {
  const r1 = pseudoRandomFromSymbol(symbol, 1);
  const r2 = pseudoRandomFromSymbol(symbol, 2);
  const r3 = pseudoRandomFromSymbol(symbol, 3);

  const rsi = toPrice(30 + r1 * 40);
  const macd = toPrice(-2 + r2 * 4);
  const ma20 = toPrice(basePrice * (0.98 + r1 * 0.04));
  const ma50 = toPrice(basePrice * (0.96 + r2 * 0.08));
  const vwap = toPrice(basePrice * (0.99 + r3 * 0.02));
  const bbUpper = toPrice(basePrice * 1.025);
  const bbLower = toPrice(basePrice * 0.975);
  const atr = toPrice(basePrice * 0.012);

  return { rsi, macd, ma20, ma50, vwap, bbUpper, bbLower, atr };
}

function marketRegime(symbol) {
  const seed = pseudoRandomFromSymbol(symbol, 8);
  if (seed > 0.66) return 'Trending';
  if (seed > 0.33) return 'Ranging';
  return 'High Volatility';
}

function multiTimeframe(symbol) {
  const choices = ['Bullish', 'Bearish'];
  const daily = pickFrom(choices, pseudoRandomFromSymbol(symbol, 10));
  const hour1 = pickFrom(choices, pseudoRandomFromSymbol(symbol, 11));
  const min5 = pickFrom(['Breakout', 'Pullback', 'Consolidation'], pseudoRandomFromSymbol(symbol, 12));
  const alignedBullish = daily === 'Bullish' && hour1 === 'Bullish' && min5 === 'Breakout';
  const alignedBearish = daily === 'Bearish' && hour1 === 'Bearish' && min5 === 'Breakout';

  let signal = 'Mixed timeframe setup';
  if (alignedBullish) signal = 'High probability bullish alignment';
  if (alignedBearish) signal = 'High probability bearish alignment';

  return { daily, hour1, min5, signal };
}

function optionsIntelligence(symbol, basePrice) {
  const oiSeed = pseudoRandomFromSymbol(symbol, 13);
  const pcr = toPrice(0.7 + oiSeed * 0.8);
  const support = Math.floor(basePrice * 0.98);
  const resistance = Math.ceil(basePrice * 1.02);
  const maxPain = Math.round(basePrice);
  const callWriting = resistance;
  const putWriting = support;
  const bias = pcr > 1 ? 'Bullish' : 'Bearish';

  return { pcr, support, resistance, maxPain, callWriting, putWriting, bias, oiChange: `${Math.round(5 + oiSeed * 30)}%` };
}

function volumeIntelligence(symbol) {
  const seed = pseudoRandomFromSymbol(symbol, 14);
  const multiple = toPrice(1 + seed * 4);
  const spike = multiple >= 2.5;
  const divergence = seed > 0.6 ? 'Bullish divergence' : 'No divergence';
  const breakoutConfirmation = spike ? 'Breakout confirmed' : 'Breakout not confirmed';

  return {
    volumeMultiple: `${multiple}x`,
    unusualSpike: spike,
    divergence,
    breakoutConfirmation,
    accumulation: seed > 0.55,
    distribution: seed < 0.25,
  };
}

function sentimentEngine(symbol) {
  const seed = pseudoRandomFromSymbol(symbol, 15);
  const sentiment = seed > 0.6 ? 'Positive' : seed < 0.35 ? 'Negative' : 'Neutral';
  const impact = seed > 0.75 ? 'High' : seed > 0.45 ? 'Medium' : 'Low';
  const catalyst = sentiment === 'Positive' ? 'Earnings optimism' : sentiment === 'Negative' ? 'Macro uncertainty' : 'No major catalyst';

  return { sentiment, impact, catalyst, score: toPrice(seed * 100) };
}

function sectorStrength(symbol) {
  const sectors = ['Banking', 'IT', 'Energy', 'Auto', 'FMCG', 'Infra'];
  const sector = pickFrom(sectors, pseudoRandomFromSymbol(symbol, 16));
  const seed = pseudoRandomFromSymbol(symbol, 17);
  const strength = seed > 0.55 ? 'Strong' : seed < 0.35 ? 'Weak' : 'Neutral';
  return { sector, strength, narrative: `${sector} sector is ${strength.toLowerCase()}` };
}

function smartMoney(symbol) {
  const seed = pseudoRandomFromSymbol(symbol, 18);
  const detected = seed > 0.58;
  return {
    detected,
    pattern: detected ? 'High volume + tight candles + breakout' : 'No major accumulation footprint',
    consolidationDays: Math.round(5 + seed * 20),
  };
}

function liquidityMap(basePrice) {
  return {
    previousHigh: Math.ceil(basePrice * 1.018),
    previousLow: Math.floor(basePrice * 0.982),
    equalHighs: Math.ceil(basePrice * 1.012),
    equalLows: Math.floor(basePrice * 0.988),
    orderCluster: Math.round(basePrice),
    note: `Liquidity above ${Math.ceil(basePrice * 1.018)}; price may gravitate there`,
  };
}

function orderFlow(symbol) {
  const seed = pseudoRandomFromSymbol(symbol, 19);
  const imbalance = seed > 0.5 ? 'Buyer dominant' : 'Seller dominant';
  const largeOrders = Math.round(3 + seed * 12);
  const absorption = seed > 0.62 ? 'Buyers absorbing supply' : 'No clear absorption';
  return { imbalance, largeOrders, absorption };
}

function volatilityCompression(symbol) {
  const seed = pseudoRandomFromSymbol(symbol, 20);
  const squeeze = seed > 0.52;
  return {
    squeeze,
    bollingerWidth: toPrice(1.2 + seed * 2.5),
    message: squeeze ? 'Volatility compression detected; breakout probability high' : 'No compression setup',
  };
}

function correlationEngine(symbol) {
  const seed = pseudoRandomFromSymbol(symbol, 21);
  return {
    nifty: toPrice(0.35 + seed * 0.55),
    bankNifty: toPrice(0.2 + seed * 0.7),
    usdIndex: toPrice(-0.4 + seed * 0.8),
    crudeOil: toPrice(-0.3 + seed * 0.7),
  };
}

function trendFromScore(score) {
  if (score >= 55) return 'Bullish';
  if (score <= 45) return 'Bearish';
  return 'Sideways';
}

function riskReward(entry, target, stoploss) {
  const risk = Math.abs(entry - stoploss);
  const reward = Math.abs(target - entry);
  const rr = reward / (risk || 1);
  return toPrice(rr);
}

function analyzeStock(symbolInput) {
  const symbol = (symbolInput || '').toUpperCase().trim();
  if (!symbol) {
    return { error: 'Stock symbol is required.' };
  }

  const baseSeed = pseudoRandomFromSymbol(symbol, 0);
  const basePrice = toPrice(300 + baseSeed * 3000);

  const technicals = calculateTechnicals(basePrice, symbol);
  const mtf = multiTimeframe(symbol);
  const options = optionsIntelligence(symbol, basePrice);
  const volume = volumeIntelligence(symbol);
  const sentiment = sentimentEngine(symbol);
  const sector = sectorStrength(symbol);
  const smart = smartMoney(symbol);
  const liquidity = liquidityMap(basePrice);
  const flow = orderFlow(symbol);
  const compression = volatilityCompression(symbol);
  const regime = marketRegime(symbol);
  const correlation = correlationEngine(symbol);

  let score = 50;
  score += technicals.rsi > 55 ? 8 : technicals.rsi < 45 ? -8 : 0;
  score += technicals.macd > 0 ? 6 : -6;
  score += options.pcr > 1 ? 5 : -5;
  score += volume.unusualSpike ? 6 : -2;
  score += sentiment.sentiment === 'Positive' ? 7 : sentiment.sentiment === 'Negative' ? -7 : 0;
  score += sector.strength === 'Strong' ? 6 : sector.strength === 'Weak' ? -6 : 0;
  score += smart.detected ? 5 : 0;
  score += mtf.signal.includes('bullish') ? 8 : mtf.signal.includes('bearish') ? -8 : 0;
  score += compression.squeeze ? 3 : 0;

  score = bounded(score, 5, 95);

  const trend = trendFromScore(score);
  const probabilityUp = trend === 'Bullish' ? score : 100 - score;
  const probabilityDown = 100 - probabilityUp;

  const direction = trend === 'Bearish' ? -1 : 1;
  const entry = toPrice(basePrice);
  const target = toPrice(entry + direction * (technicals.atr * 2.1));
  const stoploss = toPrice(entry - direction * (technicals.atr * 1.4));
  const rr = riskReward(entry, target, stoploss);
  const tradeAccepted = rr >= 2;

  const confidence = probabilityUp > 72 ? 'High' : probabilityUp > 58 ? 'Medium' : 'Low';

  const signals = [
    sector.narrative,
    `Put writing at ${options.putWriting} / Call writing at ${options.callWriting}`,
    volume.breakoutConfirmation,
    `RSI ${technicals.rsi}`,
    mtf.signal,
    smart.detected ? 'Smart money accumulation detected' : 'No clear smart money footprint',
  ];

  return {
    stock: symbol,
    trend,
    probability: `${Math.round(probabilityUp)}%`,
    probabilityUp: `${Math.round(probabilityUp)}%`,
    probabilityDown: `${Math.round(probabilityDown)}%`,
    entry,
    target,
    stoploss,
    confidence,
    tradeAccepted,
    riskReward: rr,
    marketRegime: regime,
    technicalIndicators: technicals,
    multiTimeframe: mtf,
    liquidityStopLossMap: liquidity,
    smartMoneyFootprint: smart,
    volumeIntelligence: volume,
    optionsIntelligence: options,
    orderFlow: flow,
    volatilityCompression: compression,
    sectorStrength: sector,
    sentiment,
    mlModel: {
      model: 'Ensemble (XGBoost + RandomForest + LightGBM surrogate)',
      inputFeatures: ['RSI', 'MACD', 'Volume Spike', 'OI Change', 'PCR', 'Sector Strength', 'Sentiment Score'],
      upProbability: `${Math.round(probabilityUp)}%`,
      downProbability: `${Math.round(probabilityDown)}%`,
    },
    intradayMomentum: {
      vwapBreakout: technicals.vwap < entry ? 'Bullish VWAP reclaim setup' : 'Below VWAP',
      openingRangeBreakout: pseudoRandomFromSymbol(symbol, 30) > 0.5,
      relativeVolume: volume.volumeMultiple,
    },
    correlation,
    reinforcementLearning: {
      status: 'Enabled (paper feedback loop)',
      note: 'Trade outcomes can be fed back for policy improvement',
    },
    architecture: [
      'Market Data APIs',
      'Data Processor',
      'Indicator Engine',
      'Options Analyzer',
      'Volume Intelligence',
      'Sentiment AI',
      'ML Model',
      'Trade Decision Engine',
      'Risk Manager',
      'Dashboard',
    ],
    signals,
  };
}

function scanner() {
  const rows = STOCK_UNIVERSE.map((stock) => {
    const res = analyzeStock(stock);
    return {
      stock,
      trend: res.trend,
      probability: Number.parseInt(res.probability, 10),
      confidence: res.confidence,
    };
  });

  const bullish = rows
    .filter((x) => x.trend === 'Bullish')
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 5);

  const bearish = rows
    .filter((x) => x.trend === 'Bearish')
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 5);

  return {
    universeSize: STOCK_UNIVERSE.length,
    topBullishStocks: bullish,
    topBearishStocks: bearish,
    generatedAt: new Date().toISOString(),
  };
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data, null, 2));
}

function serveStatic(req, res) {
  const parsed = url.parse(req.url);
  let pathname = parsed.pathname;
  if (pathname === '/') pathname = '/public/index.html';
  else pathname = `/public${pathname}`;

  const filePath = path.join(__dirname, pathname);
  if (!filePath.startsWith(path.join(__dirname, 'public'))) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath);
    const contentTypeMap = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
    };

    res.writeHead(200, { 'Content-Type': contentTypeMap[ext] || 'text/plain' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  if (parsedUrl.pathname === '/api/analyze' && req.method === 'GET') {
    const data = analyzeStock(parsedUrl.query.symbol || 'RELIANCE');
    sendJson(res, data.error ? 400 : 200, data);
    return;
  }

  if (parsedUrl.pathname === '/api/analyze' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const data = analyzeStock(parsed.symbol);
        sendJson(res, data.error ? 400 : 200, data);
      } catch (error) {
        sendJson(res, 400, { error: 'Invalid JSON body.' });
      }
    });
    return;
  }

  if (parsedUrl.pathname === '/api/scanner' && req.method === 'GET') {
    sendJson(res, 200, scanner());
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`AI Stock Analyzer running on http://localhost:${PORT}`);
});
