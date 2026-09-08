import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts'
import { computeTightDomain, formatAxisTick } from '../utils/chart'

// 내부 필드 키('합계금액')와 화면 표기('총 관리비')를 분리한다.
const FIELD_LABELS = { 합계금액: '총 관리비' }

function toMonthLabel(yearMonth) {
  return `${parseInt(yearMonth.slice(4, 6), 10)}월`
}

export default function FeeHistoryChart({ title, year, history, field }) {
  const label = FIELD_LABELS[title] ?? title
  const data = history.map((row) => ({ name: toMonthLabel(row.청구년월), value: row[field] }))
  const domain = computeTightDomain(data.map((d) => d.value))

  return (
    <div className="card chart-card history-chart-card">
      <h3>{label} 추이 ({year}년)</h3>
      {data.length <= 1 ? (
        <div className="no-data-notice">{year}년에는 추이를 표시할 데이터가 부족합니다.</div>
      ) : (
        <LineChart width={400} height={280} data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
          <XAxis dataKey="name" tick={{ fontSize: 13 }} />
          <YAxis
            domain={domain}
            tickCount={8}
            tickFormatter={(v) => formatAxisTick(v, domain)}
            tick={{ fontSize: 12 }}
          />
          <Tooltip formatter={(v) => [`${v.toLocaleString()}원`, label]} />
          <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      )}
    </div>
  )
}
