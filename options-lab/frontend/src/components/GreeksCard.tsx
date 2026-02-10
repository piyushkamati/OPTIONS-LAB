export function GreeksCard({
  selected,
  spot,
  T,
  pricing,
}: {
  selected: any | null;
  spot: number | null;
  T: number | null;
  pricing: any | null;
}) {
  if (!selected) {
    return (
      <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Selected Contract</div>
        <div style={{ color: "#666" }}>Click a point on the smile to see details.</div>
      </div>
    );
  }

  const vol =
    selected.iv_calc ?? selected.impliedVolatility ?? null;

  return (
    <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>Selected Contract</div>

      <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", rowGap: 6, columnGap: 10 }}>
        <div>Type</div>
        <div>{selected.cp === "C" ? "Call" : "Put"}</div>

        <div>Strike</div>
        <div>{Number(selected.strike).toFixed(2)}</div>

        <div>Mid</div>
        <div>{selected.mid != null ? Number(selected.mid).toFixed(4) : "—"}</div>

        <div>IV (calc)</div>
        <div>{selected.iv_calc != null ? Number(selected.iv_calc).toFixed(4) : "—"}</div>

        <div>Spot (S)</div>
        <div>{spot != null ? spot.toFixed(2) : "—"}</div>

        <div>T (years)</div>
        <div>{T != null ? T.toFixed(6) : "—"}</div>

        <div>Vol used</div>
        <div>{vol != null ? Number(vol).toFixed(4) : "—"}</div>
      </div>

      <hr style={{ margin: "12px 0" }} />

      <div style={{ fontWeight: 700, marginBottom: 8 }}>BS Price & Greeks</div>

      {!pricing ? (
        <div style={{ color: "#666" }}>Calculating…</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", rowGap: 6, columnGap: 10 }}>
          <div>BS Price</div>
          <div>{Number(pricing.price).toFixed(4)}</div>

          <div>Delta</div>
          <div>{Number(pricing.greeks?.delta).toFixed(6)}</div>

          <div>Gamma</div>
          <div>{Number(pricing.greeks?.gamma).toFixed(8)}</div>

          <div>Vega</div>
          <div>{Number(pricing.greeks?.vega).toFixed(6)}</div>

          <div>Theta</div>
          <div>{Number(pricing.greeks?.theta).toFixed(6)}</div>
        </div>
      )}
    </div>
  );
}
