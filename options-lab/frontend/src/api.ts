const API = "https://option-analytics.onrender.com";

export async function getExpiries(ticker: string) {
  const r = await fetch(`${API}/tickers/${ticker}/expiries`);
  return r.json();
}

export async function getSmile(ticker: string, expiry: string) {
  const r = await fetch(`${API}/tickers/${ticker}/smile?expiry=${encodeURIComponent(expiry)}`);
  return r.json();
}

export async function getSVI(ticker: string, expiry: string, cp: "C" | "P") {
  const r = await fetch(`${API}/tickers/${ticker}/svi?expiry=${encodeURIComponent(expiry)}&cp=${cp}`);
  return r.json();
}


export async function priceGreeks(params: {
  cp: "C" | "P";
  S: number;
  K: number;
  T: number;
  r: number;
  q: number;
  vol: number;
}) {
  const qs = new URLSearchParams({
    cp: params.cp,
    S: String(params.S),
    K: String(params.K),
    T: String(params.T),
    r: String(params.r),
    q: String(params.q),
    vol: String(params.vol),
  });

  const r = await fetch(`${API}/price?${qs.toString()}`);
  return r.json();
}

export async function getTermStructure(ticker: string, cp: "C" | "P") {
  const r = await fetch(`${API}/tickers/${ticker}/term_structure?cp=${cp}`);
  return r.json();
}