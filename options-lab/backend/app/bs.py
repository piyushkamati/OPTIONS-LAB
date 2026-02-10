import math

SQRT_2PI = math.sqrt(2.0 * math.pi)

def _norm_pdf(x: float) -> float:
    return math.exp(-0.5 * x * x) / SQRT_2PI

def _norm_cdf(x: float) -> float:
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))

def bs_price(cp: str, S: float, K: float, T: float, r: float, q: float, vol: float) -> float:
    # cp: "C" or "P"
    if T <= 0 or vol <= 0 or S <= 0 or K <= 0:
        return max(0.0, S - K) if cp == "C" else max(0.0, K - S)

    vsqrt = vol * math.sqrt(T)
    d1 = (math.log(S / K) + (r - q + 0.5 * vol * vol) * T) / vsqrt
    d2 = d1 - vsqrt

    disc_r = math.exp(-r * T)
    disc_q = math.exp(-q * T)

    if cp == "C":
        return disc_q * S * _norm_cdf(d1) - disc_r * K * _norm_cdf(d2)
    else:
        return disc_r * K * _norm_cdf(-d2) - disc_q * S * _norm_cdf(-d1)

def bs_greeks(cp: str, S: float, K: float, T: float, r: float, q: float, vol: float) -> dict:
    if T <= 0 or vol <= 0 or S <= 0 or K <= 0:
        return {"delta": 0.0, "gamma": 0.0, "vega": 0.0, "theta": 0.0}

    vsqrt = vol * math.sqrt(T)
    d1 = (math.log(S / K) + (r - q + 0.5 * vol * vol) * T) / vsqrt
    d2 = d1 - vsqrt

    disc_q = math.exp(-q * T)
    disc_r = math.exp(-r * T)

    pdf_d1 = _norm_pdf(d1)
    cdf_d1 = _norm_cdf(d1)
    cdf_d2 = _norm_cdf(d2)

    if cp == "C":
        delta = disc_q * cdf_d1
        theta = (-disc_q * S * pdf_d1 * vol / (2.0 * math.sqrt(T))
                 - r * disc_r * K * cdf_d2
                 + q * disc_q * S * cdf_d1)
    else:
        delta = disc_q * (cdf_d1 - 1.0)
        theta = (-disc_q * S * pdf_d1 * vol / (2.0 * math.sqrt(T))
                 + r * disc_r * K * _norm_cdf(-d2)
                 - q * disc_q * S * _norm_cdf(-d1))

    gamma = disc_q * pdf_d1 / (S * vsqrt)
    vega  = disc_q * S * pdf_d1 * math.sqrt(T) / 100.0
    theta_per_day = theta / 365.0


    return {"delta": delta, "gamma": gamma, "vega": vega, "theta": theta_per_day}
