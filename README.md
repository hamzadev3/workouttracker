# BTC / 15 — Kalshi Bitcoin prediction desk

A runnable local prediction and paper-research bot for **KXBTC15M**, Kalshi's 15-minute Bitcoin up/down contracts. Includes a browser dashboard, continuously updated probabilities, two flip-risk measures, entry filters, prospective outcome tracking, historical learning, and empirical timing selection.

**Status:** working research software; predictive accuracy and profitability have not been established. There is no honest way to guarantee an extremely accurate Bitcoin predictor, or declare one algorithm universally best, without out-of-sample evidence. This package makes that evidence measurable. It sends **no real-money orders** and has no order-placement code.

## 1. Install and run

Use a computer with **Python 3.11 or 3.12** installed and an internet connection. Extract the ZIP, open a terminal, and change into the extracted `btc15_bot` folder containing `pyproject.toml`.

### macOS / Linux

```bash
cd /path/to/btc15_bot
python3 -m venv .venv
.venv/bin/python -m pip install .
.venv/bin/python -m btc15 run --demo
```

### Windows PowerShell

```powershell
cd C:\path\to\btc15_bot
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install .
.\.venv\Scripts\python.exe -m btc15 run --demo
```

If `py` is not installed but `python --version` reports Python 3.11 or newer, substitute `python` for `py -3`. If Python is missing, install it from https://www.python.org/downloads/ and reopen the terminal.

Open **http://127.0.0.1:8765** in your browser. The demo works offline after installation; every price and market in it is synthetic. Stop with **Ctrl+C** in the terminal. Closing the browser does not stop the collector.

For the remaining examples, `python` means the virtual environment's Python executable shown above. You can either substitute that full path in every command, or activate the environment:

```bash
# macOS / Linux
source .venv/bin/activate
```

```powershell
# Windows; using the full executable path also avoids activation-policy issues
.\.venv\Scripts\Activate.ps1
```

## 2. Start live predictions without a key

```bash
python -m btc15 doctor
python -m btc15 run --bell
```

Open the same dashboard URL. It discovers the currently active KXBTC15M market and rolls to the next window automatically. Allow roughly 15–30 seconds for initial HTTP requests and minute-price history. The model needs at least 30 recent completed one-minute candles. It normally loads several hours from Kraken immediately.

Without a Kalshi key, this uses public Kalshi order books plus Kraken/Coinbase price streams and REST fallbacks. **These exchange prices are proxies, not the official settlement index.** The dashboard makes that distinction visible and adds a basis-uncertainty buffer. REST fallback quotes have receipt timestamps only; these do not prove when the upstream price last changed.

It can make forecasts without a key. By default it will not log hypothetical proxy trades. If you explicitly want exploratory paper entries in proxy mode:

```bash
python -m btc15 run --paper --allow-proxy-paper --bell
```

Even with this option, proxy entries are blocked inside the final minute. Paper trades never use your Kalshi account or funds.

## 3. Use the official settlement index

For this particular market, getting the settlement reference right matters more than adding a long list of technical indicators. The contract compares **the final 60-second BRTI average** with its official opening target. This package reads the published `floor_strike`; it does not invent the target from a Coinbase candle. It uses `close_time`, not a later administrative expiration timestamp.

1. Visit https://kalshi.com/account/profile and create an API key. Use read-only permissions if your account offers them. Save the downloaded private key outside this project. Do not paste it into ChatGPT or commit it to git.
2. Set the key ID and the path to the private-key file in your terminal. RSA and Ed25519 keys are supported.

macOS / Linux:

```bash
export KALSHI_API_KEY_ID='your-key-id'
export KALSHI_PRIVATE_KEY_PATH='/absolute/path/to/kalshi-private-key.pem'
python -m btc15 run --paper --bell
```

Windows PowerShell:

```powershell
$env:KALSHI_API_KEY_ID = 'your-key-id'
$env:KALSHI_PRIVATE_KEY_PATH = 'C:\Users\you\keys\kalshi-private-key.pem'
python -m btc15 run --paper --bell
```

3. Verify that the dashboard says **OFFICIAL INDEX / BRTI**, with a recent source timestamp. A configured key alone does not establish access. Kalshi feed access can depend on account permissions/availability. If BRTI is rejected or stale, the bot visibly falls back to proxy forecasts, keeps the BRTI error in diagnostics, and blocks paper entries by default.

The private key is read locally and used only to sign the Kalshi WebSocket handshake. No credentials are written to the database or sent to Coinbase/Kraken. Requests to Kalshi's market and order-book endpoints are public GETs.

## 4. What to watch and when to act

The dashboard refreshes every 1.5 seconds; the prediction collector defaults to every 3 seconds. WebSocket prices update independently. It is a research monitor, not a low-latency execution system.

| Display | Meaning | How to use it |
|---|---|---|
| UP / YES probability | Estimated chance the final reference average meets the target | A 70% reading is a model probability, not a measured 70% win rate |
| Direction lean | More likely settlement outcome under the current model | A lean alone is not a trade signal |
| Cross target before close | Chance the reference price touches the target under a neutral diffusion model | It can cross and come back; this is not a contract-loss probability |
| Finish on opposite side | Chance the final average settles opposite the current reference-price side | This is the more relevant reversal risk if you are following the current side |
| Model sensitivity range | Results under different drift, volatility, and proxy-basis assumptions | Wide range means the conclusion is fragile; this is not a confidence interval |
| Conservative paper edge | Worst-side probability in that sensitivity range minus quoted ask, estimated fee, and slippage | Only sufficiently positive values pass the entry filter |
| Required remaining average | Price needed across the remaining final-minute samples to reach the target | Useful when the running final-minute average and spot price disagree |
| Spread / depth imbalance | Price friction and near-best displayed bid depth | Thin/wide books can make a seemingly correct forecast untradeable |
| Momentum / volatility | 1m and 5m movement, current fluctuation scale, shock ratio | Context; none is treated as an independently proven trading signal |
| Feed / quote age | Freshness of the data used | WAIT when stale, missing, or disconnected |

The default **primary call** is:

- **Official BRTI:** 30 seconds before close, or 14 minutes 30 seconds into the window.
- **Proxy prices:** 120 seconds before close, or 13 minutes into the window.

These are **provisional engineering defaults, not backtested optimal times**. The official default lets the model use approximately half of the final-minute samples while retaining some time to inspect the signal. A call at 15 seconds may show higher directional accuracy; it also leaves less time and often has a much worse payout. The bot measures both 30s and 15s rather than assuming either is best.

The main call is recorded once per contract and printed in the terminal. `--bell` also rings the terminal bell if your terminal supports it. The dashboard retains that recorded call even as the live estimate changes.

**Decision sequence:**

1. Check the source: BRTI is the intended settlement reference. Proxy output is exploratory.
2. At the primary checkpoint, read the recorded direction and probabilities.
3. Read the entry filter. **WAIT** means the bot does not consider the entry adequate, even if the direction probability is high. **PAPER YES / NO candidate** means an entry passes the configured experimental filters.
4. Compare actual current Kalshi quotes before making any manual decision. The bot cannot reserve a quote, guarantee a fill, or account for price movement while you click.

Example: a contract can have a 90% chance of winning and cost 95¢. That is a bad expectation before fees. Optimizing win rate and optimizing return are different objectives.

## 5. How the predictions are calculated

### Settlement-aware baseline

- Completed Kraken 1-minute prices supply a warm-start return distribution; the latest incomplete candle is excluded.
- Volatility combines an exponentially weighted recent estimate, a longer baseline floor, and observed live 5-second price changes once enough real-time observations exist. Returns are normalized by elapsed time. Prices use USD; movement uses basis points; volatility is scaled by the square root of time remaining.
- A short-horizon arithmetic diffusion model computes the **conditional mean and variance of the 60 one-second prices averaged at settlement**. It uses the covariance between samples; treating those 60 prices as independent would badly understate risk.
- In the final minute, already observed seconds enter the average as fixed data. Missing official seconds cause abstention rather than invented history. Proxies may carry the preceding observation for at most 5 seconds and remain explicitly approximate.
- A mixture combines neutral drift, heavily shrunk momentum drift, and higher-volatility scenarios. The coefficients are conservative modeling choices, not pre-established profitable parameters.
- Probabilities are capped away from certainty. Separate stress scenarios widen the entry guard band. Near-target rounding is approximated using the documented two-decimal settlement precision.
- Crossing probability uses the zero-drift Brownian first-passage formula. It is an analytical scenario estimate, not a learned or independently validated flip forecast.

This is a local approximation, not a full model of Bitcoin. Jumps, changing volatility, market manipulation, source latency and index/exchange basis can defeat it. Even with BRTI active, warm-start volatility initially comes from Kraken; live BRTI returns supplement it after enough observations accumulate.

### Historical model comparison

After collecting enough **actual settled windows**, the `train` command compares:

1. The transparent diffusion baseline.
2. Regularized logistic regression on standardized predictors.
3. Shallow gradient-boosted trees that learn residual corrections to the baseline log odds.

Features include volatility-normalized target distance, normalized 1m/5m momentum, volatility regime, proxy-basis uncertainty, baseline log odds, and book imbalance. Kalshi's implied probability is held out as a benchmark rather than being used directly as a predictive input.

Training uses the earliest 60% of windows, model selection uses the next 20%, and the last 20% is the test period. One boundary window is purged between blocks. There is no random shuffle of nearly identical ticks from the same contract. A candidate is activated only if held-out Brier score **and** log loss improve over the diffusion baseline. This does not prove it will beat the market or earn money; the report separately shows the market benchmark.

Models are saved as inspectable JSON, not executable pickle files. Learned models apply only to the matching source family and the matching checkpoint (within 8 seconds). All other live updates retain the baseline. An optional logistic probability calibrator has similar restrictions and never stacks on top of the learned model. Learned models and timing selections expire after 7 days; explicitly rerun evaluation with new data to refresh them.

## 6. Collect evidence, choose timing, and train

Leave live mode running continuously with the computer awake. The SQLite database records forecasts, current market rules, selected reference observations, primary calls, and hypothetical entries. It labels forecasts only with Kalshi's **finalized** YES/NO result. It never treats a proxy-price move as an actual settlement. Resolution can lag close; unresolved contracts stay pending.

Run these commands from a second terminal in the same project folder, using the same Python environment and data directory:

```bash
python -m btc15 report --source brti
python -m btc15 report --source proxy
python -m btc15 report --output data/performance.json
```

Reports include accuracy and its Wilson interval, Brier score, log loss, calibration bins, market-midpoint and 50/50 benchmarks, eligible-signal coverage, and paper P&L. Lower Brier/log-loss values are better. Wilson intervals assume independent outcomes and may be too narrow when markets are serially correlated. Empty reports are normal before actual settlements arrive.

**Select an empirically supported primary-call time:**

```bash
python -m btc15 timing --source brti
# Or, if collecting only public proxies:
python -m btc15 timing --source proxy
```

- Official-index timing compares 600, 300, 180, 120, 60, 30, and 15 seconds before close.
- Proxy timing compares 600, 300, 180, and 120 seconds; late proxy timing is excluded deliberately.
- It requires at least **300 settled windows containing every compared checkpoint**. This is at least 3.125 days at 96 windows/day, and usually longer after gaps or restarts.
- The same set of markets is used at every horizon. Selection maximizes the earlier 70% sample's Wilson lower bound of baseline direction accuracy. The selected horizon is then evaluated on the later 30%.
- It saves the selected time and the holdout results. Live mode loads it automatically; no restart needed. The command can select a time whose later holdout is disappointing: read the report rather than assuming selection proves superiority. Delete `data/timing-brti.json` or `data/timing-proxy.json` to restore defaults.
- Timing compares the consistent diffusion baseline, not a changing mixture of subsequently trained models. Its objective is **direction accuracy**, not profitability. Training a learned model at the selected horizon comes next.

**Train a challenger after at least 600 settled observations at your chosen horizon:**

```bash
# Replace 30 with the selected number of seconds before close
python -m btc15 train --source brti --horizon 30
# Proxy example:
python -m btc15 train --source proxy --horizon 120
```

600 fully observed windows take at least 6.25 days continuously; more data across different conditions is preferable. Training does not require a GPU. Results go to `data/training-review.json`; only a passing candidate replaces `data/learned.json`. Live mode reloads it automatically. The model is not automatically retrained in the background, so holdout reuse and model changes remain explicit.

An alternative, simpler probability recalibration needs at least 400 settled windows:

```bash
python -m btc15 calibrate --source brti --horizon 30
```

This fits only a log-odds calibration map using an earlier 70% block, screens on the later 30%, and saves a passing candidate. The learned model takes precedence when both match. Remove `data/learned.json` and/or `data/calibration.json` to restore the raw model. Repeatedly optimizing against the same test block will overfit; use fresh subsequent live results to judge a change.

Historical price candles alone cannot reconstruct historical live order books, index receipt times, source gaps, and executable edges. This package does **not** manufacture a historical win-rate claim from candles. It starts with current history for volatility, then builds the correctly aligned prospective dataset required to evaluate this exact task.

## 7. Paper trading and settings

```bash
python -m btc15 run --paper --bell
```

Paper mode allows at most one simulated contract per market, only at the primary-call checkpoint. Entry is the observed ask plus a configurable adverse-slippage allowance and a conservative taker-fee estimate. It requires at least one displayed contract at that ask and holds the hypothetical position until final settlement. It does not simulate queues, guaranteed fills, early exits or an actual brokerage portfolio. Its P&L is an assumption-based estimate.

Default filters:

| Setting | Default |
|---|---:|
| Minimum direction probability | 65% |
| Minimum conservative net edge | 3¢ per contract |
| Maximum spread | 6¢ |
| Assumed adverse slippage | 0.5¢ per contract |
| Maximum source age | 5 seconds |
| Maximum quote age | 10 seconds |
| No-entry cutoff | Final 10 seconds |
| Cross-exchange disagreement limit | 5 basis points |
| Shock cutoff: recent / baseline volatility | 2.5× |
| Paper loss stop | $10 net settled loss over the preceding 24h |

The series fee multiplier is fetched from Kalshi and refreshed hourly. The estimate uses the quadratic taker formula and conservatively rounds a one-fill debit up to cents. Account-specific precision, rebates, scheduled fee changes and actual execution can differ. Fees here are an estimate, not a broker quote.

Example of stricter filters:

```bash
python -m btc15 run --paper --min-probability 0.75 --min-edge 0.05 --max-spread 0.04 --slippage 0.01
```

Higher thresholds reduce coverage and do not establish better performance. Avoid choosing settings just because they look best on the same data used to evaluate them.

## 8. Run continuously / restart / export

- Keep the terminal running and prevent computer sleep. The browser can be closed.
- Restart with the same command from the same folder to reuse your database. Existing primary calls and paper entries will not be duplicated.
- Use `--data-dir /absolute/path/to/data` consistently if starting from another directory. `--db` can override the database path. Demo/live modes are isolated and cannot share a mode-tagged database.
- On Linux, after installation, an example background launch is:

```bash
nohup .venv/bin/python -m btc15 run --paper > btc15.log 2>&1 &
```

Use your usual service manager for automatic restarts if desired. Logs and raw snapshots accumulate; monitor disk space and back up the SQLite database along with its WAL/SHM files while running, or stop the bot before copying the database alone. No automatic deletion is performed.

The dashboard listens only on `127.0.0.1`. To run on a server and view locally, use an SSH tunnel rather than exposing the development HTTP server:

```bash
ssh -L 8765:127.0.0.1:8765 your-user@your-server
```

Then open http://127.0.0.1:8765 on your own computer.

```bash
python -m btc15 settle
python -m btc15 export --output data/settled-checkpoints.json
python -m unittest discover -s tests -v
```

`settle` retries up to 50 unresolved windows per invocation. The live collector also checks unresolved outcomes once a minute. Very old markets may have moved to a historical API tier; this version leaves unavailable results unresolved rather than guessing them.

## 9. Troubleshooting

| Symptom | What to do |
|---|---|
| No module named numpy / websockets / cryptography | Run the install command using the same Python executable used to launch the bot |
| Dashboard cannot connect | Keep the terminal running; use the printed URL; try `--port 8766` if the port is occupied |
| WAIT: missing final-minute samples | Leave it running into the next window; it will not fabricate already elapsed index values |
| WAIT: no active market | Wait for rollover; verify Kalshi is available and your system clock is synchronized |
| Proxy instead of BRTI | Check key ID, private-key path, feed diagnostics and Kalshi access; `doctor` validates local key loading, not entitlement |
| Streams blocked | Public REST fallbacks may still work; `doctor` reports endpoint failures; your network must allow outbound HTTPS/WSS |
| No paper trades | Often expected: no conservative edge, proxy entries disabled, insufficient liquidity, low probability, or missed primary checkpoint |
| Not enough data to train / select timing | Continue recording actual settled windows; changing the minimum to force a result undermines validation |
| API schema or rule changed | The bot rejects unrecognized settlement semantics; inspect the official rules and update the parser before using it |

## 10. Verification and sources

Implementation checks cover covariance-based settlement math against a numerical simulation, rule/strike handling, sub-cent order books and complementary asks, conservative fee rounding, stale/missing data, duplicate/out-of-order prices, RSA/Ed25519 signatures, actual-outcome-only labeling, idempotent paper entries, mode isolation, timing-selection lookahead, and historical-learner JSON round trips.

At build time, public Kalshi, Kraken and Coinbase endpoints were reachable, and an end-to-end live proxy forecast was obtained. Official BRTI message parsing and signature generation were tested against documented schemas; **an authenticated BRTI session was not tested because no user key was provided**. No long-running live accuracy or profit result is claimed. The demo is not a performance backtest.

Official references checked October 27, 2026:

- Kalshi crypto settlement: https://help.kalshi.com/en/articles/13823838-crypto-markets
- Public market API: https://docs.kalshi.com/getting_started/quick_start_market_data
- Market order book: https://docs.kalshi.com/api-reference/market/get-market-orderbook
- BRTI WebSocket schema: https://docs.kalshi.com/websockets/cfbenchmarks-value
- API authentication: https://docs.kalshi.com/getting_started/api_keys
- WebSocket connection: https://docs.kalshi.com/getting_started/quick_start_websockets
- Fee formula: https://kalshi.com/docs/kalshi-fee-schedule.pdf
- Fee precision: https://docs.kalshi.com/getting_started/fee_rounding
- Kraken completed/incomplete candles: https://docs.kraken.com/api-reference/market-data/get-ohlc-data
- Kraken ticker stream: https://docs.kraken.com/exchange/api-reference/spot-websocket-v2/ticker
- Coinbase stream: https://docs.cdp.coinbase.com/exchange/websocket-feed/channels

The code was written for this project. No third-party bot's claimed win rate or proprietary model is used as evidence.
