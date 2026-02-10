import { useEffect, useMemo, useState } from "react";
import { priceGreeks } from "../api";

export function ScenarioCard({
  cp,
  selected,
  spot,
  T,
  r,
  q,
}: {
  cp: "C" | "P";
  selected: any | null;
  spot: number | null;
  T: number | null;
  r: number;
  q: number;
}) {
  const [spotShockPct, setSpotShockPct] = useState(0); // -10..+10
  const [volShockPts, setVolShockPts] = useState(0);   // -10..+10 (vol points)
  const [daysForward, setDaysForward] = useState(0);   // 0..30

  const [scenarioPrice, setScenarioPrice] = useState<number | null>(null);

  const baseVol = useMemo(() => {
    if (!selected) return null;
    const v = Number(selected.iv_calc ?? selected.impliedVolatility);
    return Number.isFinite(v) ? v : null;
  }, [selected]);

  const K = useMemo(() => (selected ? Number(selected.strike) : null), [selected]);

  const basePrice = useMemo(() => {
    if (!selected) return null;
    const p = Number(selected.mid);
    return Number.isFinite(p) ? p : null;
  }, [selected]);

  const shocked = useMemo(() => {
    if (!selected || spot == null || T == null || baseVol == null || K == null) return null;

    const S2 = spot * (1 + spotShockPct / 100);
    const vol2 = Math.max(baseVol + volShockPts / 100, 0.0001); // vol points -> decimal
    const T2 = Math.max(T - daysForward / 365, 0);
    
    return { S2, vol2, T2, K };
  }, [selected, spot, T, baseVol, K, spotShockPct, volShockPts, daysForward]);

  const expired = shocked ? shocked.T2 <= 0 : false;

  useEffect(() => {
    (async () => {
      if (!shocked) {
        setScenarioPrice(null);
        return;
      }
      // If T2 is 0, price is intrinsic; backend handles that fine too.
      const res = await priceGreeks({
        cp,
        S: shocked.S2,
        K: shocked.K,
        T: shocked.T2,
        r,
        q,
        vol: shocked.vol2,
      });
      setScenarioPrice(res?.price ?? null);
    })();
  }, [shocked, cp, r, q]);

  const pnl1 = scenarioPrice != null && basePrice != null ? scenarioPrice - basePrice : null;
  const pnl100 = pnl1 != null ? pnl1 * 100 : null;
  const maxDays = T != null ? Math.max(0, Math.floor(T * 365)) : 30;


  return (
    <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8, marginTop: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>Scenario</div>

      {!selected ? (
        <div style={{ color: "#666" }}>Select a contract first.</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", rowGap: 10, columnGap: 10 }}>
            <label>Spot shock (%)</label>
            <div>
              <input
                type="range"
                min={-10}
                max={10}
                step={0.5}
                value={spotShockPct}
                onChange={(e) => setSpotShockPct(Number(e.target.value))}
                style={{ width: "100%" }}
              />
              <div style={{ fontSize: 12, color: "#444" }}>{spotShockPct.toFixed(1)}%</div>
            </div>

            <label>Vol shock (points)</label>
            <div>
              <input
                type="range"
                min={-10}
                max={10}
                step={0.5}
                value={volShockPts}
                onChange={(e) => setVolShockPts(Number(e.target.value))}
                style={{ width: "100%" }}
              />
              <div style={{ fontSize: 12, color: "#444" }}>{volShockPts.toFixed(1)} vol pts</div>
            </div>

            <label>Days forward</label>
            <div>
              <input
                type="range"
                min={0}
                max={maxDays}
                step={1}
                value={daysForward}
                onChange={(e) => setDaysForward(Number(e.target.value))}
                style={{ width: "100%" }}
              />
              <div style={{ fontSize: 12, color: "#444" }}>{daysForward} days (max {maxDays})</div>
            </div>
          </div>

          <hr style={{ margin: "12px 0" }} />

          <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", rowGap: 6, columnGap: 10 }}>
            <div>Base mid</div>
            <div>{basePrice != null ? basePrice.toFixed(4) : "—"}</div>

            <div>Scenario price</div>
            <div>{expired ? "Expired (intrinsic)" : scenarioPrice != null ? scenarioPrice.toFixed(4) : "—"}</div>


            <div>P&L (1 contract)</div>
            <div>{pnl1 != null ? pnl1.toFixed(4) : "—"}</div>

            <div>P&L (x100 shares)</div>
            <div>{pnl100 != null ? pnl100.toFixed(2) : "—"}</div>
          </div>

          {shocked && (
            <div style={{ marginTop: 10, fontSize: 12, color: "#666" }}>
              Scenario inputs: S={shocked.S2.toFixed(2)}, vol={shocked.vol2.toFixed(4)}, T={shocked.T2.toFixed(6)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
