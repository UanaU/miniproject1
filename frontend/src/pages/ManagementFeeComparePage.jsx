import { useEffect, useState } from 'react'
import { fetchSummary } from '../api/fees'
import ComparisonChart from '../components/ComparisonChart'
import AnalysisCard from '../components/AnalysisCard'

function toYearMonth(inputValue) {
  return inputValue.replace('-', '') + '01'
}

const FIELD_OPTIONS = [
  { key: '합계금액', label: '총관리비' },
  { key: '전기세', label: '전기세' },
  { key: '수도세', label: '수도세' },
  { key: '가스비', label: '가스비' },
]

// 당월과 함께 한 그래프에 표시할 4개 비교 기준 (summary 응답 키 → 막대 라벨)
// kind: 'time' = 내 과거와 비교(증가/감소), 'peer' = 이웃 평균과 비교(상회/하회)
const COMPARISON_DEFS = [
  { key: '전월', label: '전월', kind: 'time' },
  { key: '작년동월', label: '전년 동월', kind: 'time' },
  { key: '같은평수평균', label: '동일 평수 평균', kind: 'peer' },
  { key: '같은평수_가구원수평균', label: '동일 평수+동일 가구원수 평균', kind: 'peer' },
]

export default function ManagementFeeComparePage() {
  const [monthInput, setMonthInput] = useState('2026-09')
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const yearMonth = toYearMonth(monthInput)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    fetchSummary(yearMonth)
      .then((res) => {
        if (!cancelled) setSummary(res.data)
      })
      .catch((err) => {
        if (cancelled) return
        setSummary(null)
        setError(
          err.response?.status === 404
            ? '해당 월의 관리비 데이터가 없습니다.'
            : '관리비 정보를 불러오지 못했습니다.'
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [yearMonth])

  const 기준 = summary?.같은평수_가구원수평균?.기준
  const comparisons = summary
    ? COMPARISON_DEFS.map((d) => ({ label: d.label, kind: d.kind, period: summary[d.key] }))
    : []

  return (
    <div className="page">
      <header className="page-header">
        <h1>관리비 비교</h1>
      </header>

      <label className="month-picker">
        청구년월
        <input
          type="month"
          value={monthInput}
          onChange={(e) => setMonthInput(e.target.value)}
        />
      </label>

      {loading && <p>불러오는 중...</p>}
      {error && !loading && <div className="no-data-notice">{error}</div>}

      {summary && !loading && !error && (
        <>
          {기준 && (
            <p className="compare-note">
              <span className="compare-note-label">이웃 비교 기준</span>
              같은 평수 <b>{기준.평수}평</b>
              <span aria-hidden="true">·</span>
              가구원수 <b>{기준.가구원수}명</b>
              세대의 평균과 비교합니다
            </p>
          )}

          <div className="chart-grid">
            {FIELD_OPTIONS.map((option) => (
              <ComparisonChart
                key={option.key}
                title={`${option.label} 비교`}
                field={option.key}
                thisMonth={summary.이번달}
                comparisons={comparisons}
              />
            ))}
          </div>

          <AnalysisCard summary={summary} />
        </>
      )}
    </div>
  )
}
