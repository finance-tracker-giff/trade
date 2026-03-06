const symbolInput = document.getElementById('symbolInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const analyzeResult = document.getElementById('analyzeResult');
const scanBtn = document.getElementById('scanBtn');
const bullishList = document.getElementById('bullishList');
const bearishList = document.getElementById('bearishList');

function formatAnalysis(data) {
  const lines = [
    `Stock: ${data.stock}`,
    `Trend: ${data.trend}`,
    `Probability Up: ${data.probabilityUp}`,
    `Probability Down: ${data.probabilityDown}`,
    `Entry: ${data.entry}`,
    `Target: ${data.target}`,
    `Stoploss: ${data.stoploss}`,
    `Confidence: ${data.confidence}`,
    '',
    'Signals:',
    ...data.signals.map((signal) => `• ${signal}`),
    '',
    `Multi-Timeframe: Daily ${data.multiTimeframe.daily} | 1H ${data.multiTimeframe.hour1} | 5M ${data.multiTimeframe.min5}`,
    `Liquidity Map: Prev High ${data.liquidityStopLossMap.previousHigh}, Prev Low ${data.liquidityStopLossMap.previousLow}`,
    `Options: Support ${data.optionsIntelligence.support}, Resistance ${data.optionsIntelligence.resistance}, PCR ${data.optionsIntelligence.pcr}`,
    `Volume: ${data.volumeIntelligence.volumeMultiple}, ${data.volumeIntelligence.breakoutConfirmation}`,
    `Sentiment: ${data.sentiment.sentiment} (${data.sentiment.impact})`,
    `Risk/Reward: ${data.riskReward} (${data.tradeAccepted ? 'Trade accepted' : 'Trade rejected'})`,
  ];

  return lines.join('\n');
}

function scannerRow(item) {
  const arrow = item.trend === 'Bullish' ? '↑' : '↓';
  const cls = item.trend === 'Bullish' ? 'trend-up' : 'trend-down';
  return `<li><span class="${cls}">${item.stock} ${arrow} ${item.probability}%</span> · Confidence: ${item.confidence}</li>`;
}

async function analyze() {
  const symbol = symbolInput.value.trim();
  analyzeResult.textContent = 'Analyzing...';

  try {
    const response = await fetch(`/api/analyze?symbol=${encodeURIComponent(symbol)}`);
    const data = await response.json();
    if (!response.ok) {
      analyzeResult.textContent = data.error || 'Analysis failed.';
      return;
    }
    analyzeResult.textContent = formatAnalysis(data);
  } catch (error) {
    analyzeResult.textContent = 'Network error. Please retry.';
  }
}

async function runScanner() {
  bullishList.innerHTML = '<li>Scanning...</li>';
  bearishList.innerHTML = '<li>Scanning...</li>';

  try {
    const response = await fetch('/api/scanner');
    const data = await response.json();

    bullishList.innerHTML = data.topBullishStocks.map(scannerRow).join('') || '<li>No bullish candidates</li>';
    bearishList.innerHTML = data.topBearishStocks.map(scannerRow).join('') || '<li>No bearish candidates</li>';
  } catch (error) {
    bullishList.innerHTML = '<li>Scanner unavailable</li>';
    bearishList.innerHTML = '<li>Scanner unavailable</li>';
  }
}

analyzeBtn.addEventListener('click', analyze);
scanBtn.addEventListener('click', runScanner);

analyze();
runScanner();
