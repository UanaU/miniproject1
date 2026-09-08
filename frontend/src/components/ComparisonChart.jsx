import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from 'recharts'
import NoDataNotice from './NoDataNotice'
import { formatAxisTick } from '../utils/chart'

// 막대그래프용 Y축 범위: 값의 최소~최대 근처로 좁히되(아래 여백 > 위 여백) 막대 간
// 차이를 뚜렷하게 보여준다. YAxis에 allowDataOverflow와 함께 넘겨 정확히 이 범위로 그린다.
function computeBarDomain(values) {
  const nums = values.filter((v) => typeof v === 'number' && !Number.isNaN(v))
  if (nums.length === 0) return [0, 1]

  const min = Math.min(...nums)
  const max = Math.max(...nums)
  const span = max - min || Math.max(max * 0.1, 1000)

  // 눈금이 깔끔하게 떨어지도록 경계를 1·2·2.5·5·10 배수 간격으로 스냅
  const rough = Math.max((span * 1.5) / 5, 1)
  const mag = 10 ** Math.floor(Math.log10(rough))
  const step = ([1, 2, 2.5, 5, 10].find((m) => m * mag >= rough) ?? 10) * mag

  const lower = Math.max(0, Math.floor((min - span * 0.35) / step) * step)
  const upper = Math.ceil((max + span * 0.12) / step) * step
  return [lower, upper > lower ? upper : lower + step]
}

// 당월 + 4개 비교 기준(전월 / 전년 동월 / 동일 평수 평균 / 동일 평수+가구원수 평균)을
// 하나의 막대그래프에 함께 표시한다. 비교 데이터가 없는 기준의 막대는 자동으로 빠진다.
// 색 규칙: 내 관리비(당월·전월·전년 동월)는 네이비 계열, 이웃 평균은 골드 계열.
const BAR_COLORS = {
  당월: '#1e3a8a',
  전월: '#6b7fb8',
  '전년 동월': '#a1b2d6',
  '동일 평수 평균': '#b48a5a',
  '동일 평수+가구원수 평균': '#8a6a3d',
}
const FALLBACK_COLORS = ['#1e3a8a', '#6b7fb8', '#a1b2d6', '#b48a5a', '#8a6a3d']

// X축 눈금은 짧게, 아래 증감 목록에는 전체 라벨을 쓴다.
const SHORT_LABELS = {
  당월: '당월',
  전월: '전월',
  '전년 동월': '전년동월',
  '동일 평수 평균': '평수평균',
  '동일 평수+가구원수 평균': '평수+인원',
}

function getValue(period, field) {
  if (!period) return undefined
  return field === '합계금액' ? period.합계금액 : period.세대별?.[field]
}

export default function ComparisonChart({ title, thisMonth, comparisons, field = '합계금액' }) {
  const metric = title.replace(/\s*비교$/, '')
  const thisMonthValue = getValue(thisMonth, field)

  const validComparisons = comparisons.filter(
    (c) => c.period && !c.period.데이터없음 && typeof getValue(c.period, field) === 'number'
  )

  if (validComparisons.length === 0) {
    return (
      <div className="card chart-card">
        <h3>{title}</h3>
        <NoDataNotice message="비교 데이터 없음" />
      </div>
    )
  }

  const data = [
    { name: '당월', short: SHORT_LABELS['당월'], value: thisMonthValue },
    ...validComparisons.map((c) => ({
      name: c.label,
      short: SHORT_LABELS[c.label] || c.label,
      value: getValue(c.period, field),
    })),
  ]

  const domain = computeBarDomain(data.map((d) => d.value))

  return (
    <div className="card chart-card">
      <h3>{title}</h3>
      <div className="chart-canvas">
        <BarChart width={320} height={244} data={data} margin={{ top: 12, right: 8, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
          <XAxis dataKey="short" tick={{ fontSize: 12 }} interval={0} tickLine={false} height={22} />
          <YAxis
            domain={domain}
            allowDataOverflow
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => formatAxisTick(v, domain)}
            width={46}
          />
          <Tooltip
            cursor={false}
            isAnimationActive={false}
            formatter={(v) => [`${v.toLocaleString()}원`, metric]}
            labelFormatter={(_, p) => p?.[0]?.payload?.name ?? ''}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={46}>
            {data.map((d, i) => (
              <Cell key={d.name} fill={BAR_COLORS[d.name] || FALLBACK_COLORS[i % FALLBACK_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </div>
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
