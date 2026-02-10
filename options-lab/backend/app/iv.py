from scipy.optimize import brentq
from .bs import bs_price

def implied_vol(cp: str, price: float, S: float, K: float, T: float, r: float, q: float) -> float:
    # Basic sanity
    if price <= 0 or S <= 0 or K <= 0 or T <= 0:
        return float("nan")

    def f(sig: float) -> float:
        return bs_price(cp, S, K, T, r, q, sig) - price

    # Vol bounds: 0.0001 to 5.0 (500% vol)
    try:
        return float(brentq(f, 1e-4, 5.0, maxiter=200))
    except Exception:
        return float("nan")
