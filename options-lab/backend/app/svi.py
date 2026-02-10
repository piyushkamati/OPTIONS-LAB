import numpy as np
from scipy.optimize import least_squares

# raw SVI total variance:
# w(k) = a + b*( rho*(k-m) + sqrt((k-m)^2 + sigma^2) )
def svi_total_var(params, k: np.ndarray) -> np.ndarray:
    a, b, rho, m, sigma = params
    return a + b * (rho * (k - m) + np.sqrt((k - m) ** 2 + sigma ** 2))

def fit_svi(k: np.ndarray, iv: np.ndarray, T: float) -> dict:
    # iv -> total variance w = iv^2 * T
    w_mkt = (iv ** 2) * T

    # initial guess
    a0 = float(np.nanmin(w_mkt))
    b0 = 0.1
    rho0 = 0.0
    m0 = float(np.nanmean(k))
    sigma0 = 0.2
    x0 = np.array([a0, b0, rho0, m0, sigma0], dtype=float)

    # bounds: b>0, sigma>0, |rho|<1
    lb = np.array([-10.0, 1e-6, -0.999, -10.0, 1e-6])
    ub = np.array([ 10.0, 10.0,  0.999,  10.0,  10.0])

    def resid(x):
        return svi_total_var(x, k) - w_mkt

    res = least_squares(resid, x0, bounds=(lb, ub), max_nfev=5000)
    a, b, rho, m, sigma = res.x
    return {
        "params": {"a": float(a), "b": float(b), "rho": float(rho), "m": float(m), "sigma": float(sigma)},
        "rmse": float(np.sqrt(np.mean(res.fun ** 2))),
        "success": bool(res.success),
    }

def svi_iv_at_k(params: dict, k: np.ndarray, T: float) -> np.ndarray:
    p = np.array([params["a"], params["b"], params["rho"], params["m"], params["sigma"]], dtype=float)
    w = svi_total_var(p, k)
    w = np.maximum(w, 1e-12)
    return np.sqrt(w / T)
