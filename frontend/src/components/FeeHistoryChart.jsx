import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts'
import { computeTightDomain, formatAxisTick } from '../utils/chart'

function toMonthLabel(yearMonth) {
  return `${parseInt(yearMonth.slice(4, 6), 10)}월`
}

export default function FeeHistoryChart({ title, year, history, field }) {
  const data = history.map((row) => ({ name: toMonthLabel(row.청구년월), value: row[field] }))
  const domain = computeTightDomain(data.map((d) => d.value))

  return (
    <div className="card chart-card history-chart-card">
      <h3>{title} 추이 ({year}년)</h3>
      {data.length <= 1 ? (
        <div className="no-data-notice">{year}년에는 추이를 표시할 데이터가 부족합니다.</div>
      ) : (
        <LineChart width={420} height={280} data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis
            domain={domain}
            tickCount={8}
            tickFormatter={(v) => formatAxisTick(v, domain)}
            tick={{ fontSize: 11 }}
          />
          <Tooltip formatter={(v) => `${v.toLocaleString()}원`} />
          <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      )}
    </div>
  )
}
