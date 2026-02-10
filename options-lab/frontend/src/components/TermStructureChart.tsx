import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export function TermStructureChart({ data }: { data: any[] }) {
  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="days" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v * 100).toFixed(1)}%`} />
          <Tooltip
            formatter={(v: any) => `${(Number(v) * 100).toFixed(2)}%`}
            labelFormatter={(d) => `Days: ${d}`}
          />
          <Line type="monotone" dataKey="atm_iv" dot />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
