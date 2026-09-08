import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from 'recharts'
import NoDataNotice from './NoDataNotice'
import { buildStepTicks, computeStepDomain } from '../utils/chart'

const Y_AXIS_STEP = 500
const BAR_COLORS = [
  'var(--chart-bar-color, #4f7cff)',
  'var(--chart-bar-secondary, #f59e0b)',
  'var(--chart-bar-tertiary, #10b981)',
]

function getValue(period, field) {
  return field === '합계금액' ? period.합계금액 : period.세대별?.[field]
}

// comparisons: [{ label, period }] - 이번달과 함께 최대 2개까지의 비교 대상을 하나의 막대그래프로 보여준다.
export default function ComparisonChart({ title, thisMonth, comparisons, field = '합계금액' }) {
  const validComparisons = comparisons.filter((c) => c.period && !c.period.데이터없음)

  if (validComparisons.length === 0) {
    return (
      <div className="card chart-card">
        <h3>{title}</h3>
        <NoDataNotice message="비교 데이터 없음" />
      </div>
    )
  }

  const thisMonthValue = getValue(thisMonth, field)
  const data = [
    { name: '이번달', value: thisMonthValue },
    ...validComparisons.map((c) => ({ name: c.label, value: getValue(c.period, field) })),
  ]

  const domain = computeStepDomain(data.map((d) => d.value), Y_AXIS_STEP)
  const ticks = buildStepTicks(domain, Y_AXIS_STEP)

  return (
    <div className="card chart-card">
      <h3>{title}</h3>
      <BarChart width={280} height={320} data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis
          domain={domain}
          ticks={ticks}
          interval={0}
          tick={{ fontSize: 10 }}
          tickFormatter={(v) => v.toLocaleString()}
        />
        <Tooltip formatter={(v) => `${v.toLocaleString()}원`} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
      <ul className="diff-list">
        {validComparisons.map((c) => {
          const diff = thisMonthValue - getValue(c.period, field)
          const diffText =
            diff === 0
              ? '동일'
              : `${diff > 0 ? '+' : ''}${diff.toLocaleString()}원 (${diff > 0 ? '증가' : '감소'})`
          return (
            <li key={c.label}>
              {c.label} 대비 {diffText}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
