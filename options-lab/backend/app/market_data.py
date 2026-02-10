import pandas as pd
import yfinance as yf

def get_spot(ticker: str) -> float:
    t = yf.Ticker(ticker)
    hist = t.history(period="5d")
    if hist.empty:
        raise ValueError("No price history")
    return float(hist["Close"].iloc[-1])

def get_expiries(ticker: str) -> list[str]:
    return list(yf.Ticker(ticker).options)

def get_chain(ticker: str, expiry: str) -> pd.DataFrame:
    t = yf.Ticker(ticker)
    oc = t.option_chain(expiry)
    calls = oc.calls.copy()
    puts = oc.puts.copy()
    calls["cp"] = "C"
    puts["cp"] = "P"
    df = pd.concat([calls, puts], ignore_index=True)

    # mid price fallback logic
    df["mid"] = (df["bid"].fillna(0) + df["ask"].fillna(0)) / 2.0
    df.loc[df["mid"] <= 0, "mid"] = df["lastPrice"].where(df["lastPrice"] > 0, df["mid"])

    # Keep useful columns
    keep = ["contractSymbol","cp","strike","lastPrice","bid","ask","mid","volume","openInterest","impliedVolatility"]
    return df[keep].sort_values(["cp","strike"]).reset_index(drop=True)
