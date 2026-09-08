import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from 'recharts'
import NoDataNotice from './NoDataNotice'
import { buildStepTicks, computeStepDomain } from '../utils/chart'

const Y_AXIS_STEP = 500

function getValue(period, field) {
  return field === '합계금액' ? period.합계금액 : period.세대별?.[field]
}

export default function ComparisonChart({ title, comparisonLabel, thisMonth, comparison, field = '합계금액' }) {
  if (!comparison || comparison.데이터없음) {
    return (
      <div className="card chart-card">
        <h3>{title}</h3>
        <NoDataNotice message={comparison?.메시지 ?? '비교 데이터 없음'} />
      </div>
    )
  }

  const thisMonthValue = getValue(thisMonth, field)
  const comparisonValue = getValue(comparison, field)

  const data = [
    { name: '이번달', value: thisMonthValue },
    { name: comparisonLabel, value: comparisonValue },
  ]

  const diff = thisMonthValue - comparisonValue
  const diffText =
    diff === 0
      ? '동일'
      : `${diff > 0 ? '+' : ''}${diff.toLocaleString()}원 (${diff > 0 ? '증가' : '감소'})`

  const domain = computeStepDomain([thisMonthValue, comparisonValue], Y_AXIS_STEP)
  const ticks = buildStepTicks(domain, Y_AXIS_STEP)

  return (
    <div className="card chart-card">
      <h3>{title}</h3>
      <BarChart width={280} height={320} data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis
          domain={domain}
          ticks={ticks}
          interval={0}
          tick={{ fontSize: 10 }}
          tickFormatter={(v) => v.toLocaleString()}
        />
        <Tooltip formatter={(v) => `${v.toLocaleString()}원`} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          <Cell fill="var(--chart-bar-color, #4f7cff)" />
          <Cell fill="var(--chart-bar-secondary, #f59e0b)" />
        </Bar>
      </BarChart>
      <p className="diff-text">{diffText}</p>
    </div>
  )
}
