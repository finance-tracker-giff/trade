# AI Stock Analyzer Website

A lightweight full-stack dashboard with:

- **Frontend Dashboard**: stock input, analyze button, result card, market scanner lists.
- **Backend APIs**:
  - `GET /api/analyze?symbol=RELIANCE`
  - `POST /api/analyze` with `{ "symbol": "RELIANCE" }`
  - `GET /api/scanner`
- **AI Decision Engine (basic + advanced stubs)**:
  - Trend, probability, entry, target, stoploss, confidence
  - Multi-timeframe trend engine
  - Liquidity/stop-loss map
  - Smart money footprint detection
  - Volume intelligence
  - Options market intelligence
  - Order flow analysis
  - Volatility compression detection
  - Sector strength analysis
  - News sentiment AI
  - ML probability output surrogate
  - Market regime + correlation + risk-reward checks

## Run

```bash
node server.js
```

Open `http://localhost:3000`.
