import {
  ResponsiveContainer,
  ComposedChart,
  Scatter,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid
} from "recharts";

function fmtPct(x: number) {
  if (!Number.isFinite(x)) return "—";
  return `${(x * 100).toFixed(1)}%`;
}

export function SmileChart({
  points,
  fitLine,
  spot,
  onSelect
}: {
  points: any[];
  fitLine?: any[] | null;
  spot?: number | null;
  onSelect?: (row: any) => void;
}) {
  return (
    <div style={{ width: "100%", height: 340 }}>
      <ResponsiveContainer>
        <ComposedChart margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="strike"
            type="number"
            domain={["dataMin", "dataMax"]}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            domain={[0, "auto"]}
            tickFormatter={(v) => fmtPct(v)}
          />
          <Tooltip
            formatter={(value: any, name: any) => {
              if (name === "iv_calc" || name === "iv") return [fmtPct(Number(value)), "IV"];
              return [value, name];
            }}
            labelFormatter={(label) => `Strike: ${Number(label).toFixed(2)}`}
          />

          {spot != null && (
            <ReferenceLine x={spot} strokeDasharray="4 4" />
          )}

          {/* Market points */}
          <Scatter
            data={points}
            dataKey="iv_calc"
            onClick={(p: any) => onSelect?.(p)}
          />

          {/* SVI smooth line */}
          {fitLine && (
            <Line
              data={fitLine}
              type="monotone"
              dataKey="iv"
              dot={false}
              strokeWidth={2}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
