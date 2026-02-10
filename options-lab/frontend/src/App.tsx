import { useEffect, useMemo, useState } from "react";
import { getExpiries, getSmile, getSVI, priceGreeks } from "./api";
import { SmileChart } from "./components/SmileChart";
import { GreeksCard } from "./components/GreeksCard";
import { ScenarioCard } from "./components/ScenarioCard";
import { getTermStructure } from "./api";
import { TermStructureChart } from "./components/TermStructureChart";



export default function App() {
  const [ticker, setTicker] = useState("SPY");
  const [expiries, setExpiries] = useState<string[]>([]);
  const [expiry, setExpiry] = useState<string>("");
  const [cp, setCp] = useState<"C" | "P">("C");

  const [smileRows, setSmileRows] = useState<any[]>([]);
  const [spot, setSpot] = useState<number | null>(null);
  const [T, setT] = useState<number | null>(null);

  const [selected, setSelected] = useState<any | null>(null);
  const [pricing, setPricing] = useState<any | null>(null);

  const [sviCurve, setSviCurve] = useState<any[] | null>(null);
  const [fitInfo, setFitInfo] = useState<any | null>(null);

  const r = 0.04;
  const q = 0.0;

  const [termRows, setTermRows] = useState<any[]>([]);


  useEffect(() => {
    (async () => {
      const x = await getExpiries(ticker);
      setExpiries(x.expiries || []);
      setExpiry((x.expiries || [])[0] || "");
    })();
  }, [ticker]);

  useEffect(() => {
    if (!expiry) return;
    (async () => {
      const s = await getSmile(ticker, expiry);
      setSpot(s.spot ?? null);
      setT(s.T ?? null);

      const rows = (s.rows || [])
        .filter((r: any) => r.cp === cp)
        .filter((r: any) => Number.isFinite(r.iv_calc))
        .filter((r: any) => r.iv_calc > 0.01 && r.iv_calc < 3.0)
        .filter((r: any) => (r.openInterest ?? 0) >= 20)   // change threshold if needed
        .filter((r: any) => (r.mid ?? 0) > 0.01);          // remove tiny mid quotes

      setSmileRows(rows);

      setSelected(null);
      setPricing(null);
      setSviCurve(null);
      setFitInfo(null);
    })();
  }, [ticker, expiry, cp]);

  // When a point is selected, call /price
  useEffect(() => {
    (async () => {
      if (!selected || spot == null || T == null) return;

      const K = Number(selected.strike);
      const vol = Number(selected.iv_calc ?? selected.impliedVolatility);

      if (!Number.isFinite(K) || !Number.isFinite(vol) || vol <= 0) {
        setPricing(null);
        return;
      }

      setPricing(null); // show "Calculating..."
      const res = await priceGreeks({ cp, S: spot, K, T, r, q, vol });
      setPricing(res);
    })();
  }, [selected, spot, T, cp]);

  useEffect(() => {
  (async () => {
    try {
      const t = await getTermStructure(ticker, cp);
      setTermRows(t.rows || []);
    } catch (e) {
      console.error(e);
      setTermRows([]);
    }
  })();
}, [ticker, cp]);

  
  const onFitSVI = async () => {
    const res = await getSVI(ticker, expiry, cp);
    if (res.error) {
      alert(res.error);
      return;
    }
    setSviCurve(res.curve || []);
    setFitInfo(res.fit || null);
  };

  const title = useMemo(
    () => `${ticker} • ${expiry} • ${cp === "C" ? "Calls" : "Puts"}`,
    [ticker, expiry, cp]
  );
  

  return (
    <div style={{ padding: 20, fontFamily: "system-ui, Arial" }}>
      <h2>Options IV Smile & SVI Fit</h2>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <label>
          Ticker:&nbsp;
          <input value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} style={{ width: 90 }} />
        </label>

        <label>
          Expiry:&nbsp;
          <select value={expiry} onChange={(e) => setExpiry(e.target.value)}>
            {expiries.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>

        <label>
          Type:&nbsp;
          <select value={cp} onChange={(e) => setCp(e.target.value as "C" | "P")}>
            <option value="C">Calls</option>
            <option value="P">Puts</option>
          </select>
        </label>

        <button onClick={onFitSVI}>Fit SVI</button>
      </div>

      <h3 style={{ marginTop: 16 }}>{title}</h3>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, alignItems: "start" }}>
        <div>
          <SmileChart points={smileRows} onSelect={setSelected} />
          <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
            Tip: hover a point to activate it, then click to select.
          </div>
        </div>

        <div>
            <GreeksCard selected={selected} spot={spot} T={T} pricing={pricing} />
            <ScenarioCard cp={cp} selected={selected} spot={spot} T={T} r={r} q={q} />
        </div>
        </div>
        {/* ✅ ADD THIS WHOLE SECTION */}
    <h3 style={{ marginTop: 18 }}>ATM Term Structure (IV vs Days)</h3>
        {termRows.length === 0 ? (
        <div style={{ color: "#666" }}>No term structure data.</div>
        ) : (
    <TermStructureChart data={termRows} />
        )}
    
      {sviCurve && (
        <>
          <h3 style={{ marginTop: 16 }}>SVI fitted curve (IV vs log-moneyness)</h3>
          <div style={{ fontSize: 13, marginBottom: 8 }}>
            {fitInfo ? `RMSE: ${fitInfo.rmse?.toFixed?.(6)} • success: ${String(fitInfo.success)}` : ""}
          </div>
          {/* leave this for now; we’ll fix the x-axis properly later */}
          <SmileChart points={sviCurve.map((x: any, i: number) => ({ strike: i, iv_calc: x.iv }))} />
        </>
      )}
    </div>
  );
}
