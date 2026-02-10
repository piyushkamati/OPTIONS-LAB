from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
import numpy as np
import pandas as pd

from .market_data import get_spot, get_expiries, get_chain
from .iv import implied_vol
from .bs import bs_price, bs_greeks
from .svi import fit_svi, svi_iv_at_k

app = FastAPI(title="Options Vol Surface API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def yearfrac(expiry_yyyy_mm_dd: str) -> float:
    exp = datetime.strptime(expiry_yyyy_mm_dd, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    dt = (exp - now).total_seconds()
    return max(dt, 0.0) / (365.0 * 24.0 * 3600.0)

@app.get("/health")
def health():
    return {"ok": True}

@app.get("/tickers/default")
def default_ticker():
    return {"ticker": "SPY"}

@app.get("/tickers/{ticker}/expiries")
def expiries(ticker: str):
    return {"ticker": ticker.upper(), "expiries": get_expiries(ticker.upper())}

@app.get("/tickers/{ticker}/chain")
def chain(ticker: str, expiry: str = Query(...)):
    ticker = ticker.upper()
    S = get_spot(ticker)
    df = get_chain(ticker, expiry)
    return {"ticker": ticker, "expiry": expiry, "spot": S, "chain": df.to_dict(orient="records")}

@app.get("/tickers/{ticker}/smile")
def smile(ticker: str, expiry: str = Query(...), r: float = 0.04, q: float = 0.0):
    ticker = ticker.upper()
    S = get_spot(ticker)
    T = yearfrac(expiry)

    df = get_chain(ticker, expiry)
    # Compute IV from mid, prefer our IV
    ivs = []
    for row in df.itertuples(index=False):
        ivs.append(implied_vol(row.cp, float(row.mid), S, float(row.strike), T, r, q))
    df["iv_calc"] = ivs

    # log-moneyness k = ln(K/F) approx ln(K/S*e^{(q-r)T}) => use ln(K/S) for now
    df["k"] = np.log(df["strike"].astype(float) / float(S))

    out = df[["cp","strike","k","mid","iv_calc","impliedVolatility","volume","openInterest"]].replace({np.nan: None})
    return {"ticker": ticker, "expiry": expiry, "spot": S, "T": T, "rows": out.to_dict(orient="records")}

@app.get("/tickers/{ticker}/svi")
def svi(ticker: str, expiry: str = Query(...), cp: str = "C", r: float = 0.04, q: float = 0.0):
    ticker = ticker.upper()
    S = get_spot(ticker)
    T = yearfrac(expiry)

    df = get_chain(ticker, expiry)
    df = df[df["cp"] == cp].copy()
    df["iv_calc"] = df.apply(lambda x: implied_vol(cp, float(x["mid"]), S, float(x["strike"]), T, r, q), axis=1)
    df = df.replace([np.inf, -np.inf], np.nan).dropna(subset=["iv_calc"])
    df["k"] = np.log(df["strike"].astype(float) / float(S))

    # Use OTM-ish region: calls with K>=S, puts with K<=S
    if cp == "C":
        df = df[df["strike"] >= S * 0.9]
    else:
        df = df[df["strike"] <= S * 1.1]

    k = df["k"].to_numpy(dtype=float)
    iv = df["iv_calc"].to_numpy(dtype=float)

    if len(k) < 10:
        return {"error": "Not enough valid IV points for calibration", "n": int(len(k))}

    fit = fit_svi(k, iv, T)
    # return fitted curve on a grid
    k_grid = np.linspace(float(np.min(k)), float(np.max(k)), 60)
    iv_fit = svi_iv_at_k(fit["params"], k_grid, T)
    K_grid = (S * np.exp(k_grid)).tolist()

    return {
        "ticker": ticker, "expiry": expiry, "cp": cp, "spot": S, "T": T,
        "fit": fit,
        "curve": [{"strike": float(kg), "K": float(Kg), "iv": float(v)}
                  for kg, Kg, v in zip(k_grid, K_grid, iv_fit)]
    }

@app.get("/price")
def price(cp: str, S: float, K: float, T: float, r: float, q: float, vol: float):
    p = bs_price(cp, S, K, T, r, q, vol)
    g = bs_greeks(cp, S, K, T, r, q, vol)
    return {"price": p, "greeks": g}

@app.get("/tickers/{ticker}/term_structure")
def term_structure(ticker: str, cp: str = "C", r: float = 0.04, q: float = 0.0):
    ticker = ticker.upper()
    S = get_spot(ticker)
    exps = get_expiries(ticker)[:10]  # first 10 expiries for speed

    out = []
    for expiry in exps:
        T = yearfrac(expiry)
        if T <= 0:
            continue

        df = get_chain(ticker, expiry)
        df = df[df["cp"] == cp].copy()
        if df.empty:
            continue

        df["dist"] = (df["strike"].astype(float) - S).abs()
        row = df.sort_values("dist").iloc[0]

        iv = implied_vol(cp, float(row["mid"]), S, float(row["strike"]), T, r, q)
        if not np.isfinite(iv):
            continue

        out.append({
            "expiry": expiry,
            "days": float(T * 365.0),
            "atm_strike": float(row["strike"]),
            "atm_iv": float(iv),
        })

    return {"ticker": ticker, "cp": cp, "spot": S, "rows": out}

