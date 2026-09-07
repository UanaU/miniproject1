import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts'
import NoDataNotice from './NoDataNotice'

export default function ComparisonChart({ title, comparisonLabel, thisMonth, comparison }) {
  if (!comparison || comparison.데이터없음) {
    return (
      <div className="card chart-card">
        <h3>{title}</h3>
        <NoDataNotice message={comparison?.메시지 ?? '비교 데이터 없음'} />
      </div>
    )
  }

  const data = [
    { name: '이번달', 합계금액: thisMonth.합계금액 },
    { name: comparisonLabel, 합계금액: comparison.합계금액 },
  ]

  const diff = thisMonth.합계금액 - comparison.합계금액
  const diffText =
    diff === 0
      ? '동일'
      : `${diff > 0 ? '+' : ''}${diff.toLocaleString()}원 (${diff > 0 ? '증가' : '감소'})`

  return (
    <div className="card chart-card">
      <h3>{title}</h3>
      <BarChart width={280} height={220} data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}천`} />
        <Tooltip formatter={(v) => `${v.toLocaleString()}원`} />
        <Bar dataKey="합계금액" fill="var(--chart-bar-color, #4f7cff)" radius={[4, 4, 0, 0]} />
      </BarChart>
      <p className="diff-text">{diffText}</p>
    </div>
  )
}
