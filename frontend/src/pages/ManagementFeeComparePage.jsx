import { useEffect, useState } from 'react'
import { fetchSummary } from '../api/fees'
import ComparisonChart from '../components/ComparisonChart'
import AnalysisCard from '../components/AnalysisCard'

function toYearMonth(inputValue) {
  return inputValue.replace('-', '') + '01'
}

function toInputValue(yearMonth) {
  return `${yearMonth.slice(0, 4)}-${yearMonth.slice(4, 6)}`
}

const COMPARE_TYPES = [
  { key: 'prev', label: '전월 비교' },
  { key: 'lastYear', label: '작년 동월 비교' },
  { key: 'sameSize', label: '같은 평수 비교' },
  { key: 'sameSizeHousehold', label: '같은 평수+가구원수 비교' },
]

const FIELD_OPTIONS = [
  { key: '합계금액', label: '총관리비' },
  { key: '전기세', label: '전기세' },
  { key: '수도세', label: '수도세' },
  { key: '가스비', label: '가스비' },
]

export default function ManagementFeeComparePage() {
  const [monthInput, setMonthInput] = useState('2026-09')
  const [compareType, setCompareType] = useState(COMPARE_TYPES[0].key)
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

  function getComparisonConfig() {
    switch (compareType) {
      case 'prev':
        return {
          title: '전월 비교',
          comparisonLabel: toInputValue(summary.전월.청구년월 ?? yearMonth),
          comparison: summary.전월,
        }
      case 'lastYear':
        return { title: '작년 동월 비교', comparisonLabel: '작년 동월', comparison: summary.작년동월 }
      case 'sameSize':
        return { title: '같은 평수 비교', comparisonLabel: '같은 평수 평균', comparison: summary.같은평수평균 }
      case 'sameSizeHousehold':
        return {
          title: `같은 평수(${summary.같은평수_가구원수평균.기준?.평수}평)+가구원수(${summary.같은평수_가구원수평균.기준?.가구원수}명) 비교`,
          comparisonLabel: '같은 조건 평균',
          comparison: summary.같은평수_가구원수평균,
        }
      default:
        return null
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>관리비 비교</h1>
      </header>

      <div className="compare-controls">
        <label className="month-picker">
          청구년월
          <input
            type="month"
            value={monthInput}
            onChange={(e) => setMonthInput(e.target.value)}
          />
        </label>
        <label className="month-picker">
          비교 항목
          <select value={compareType} onChange={(e) => setCompareType(e.target.value)}>
            {COMPARE_TYPES.map((option) => (
              <option key={option.key} value={option.key}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

      {loading && <p>불러오는 중...</p>}
      {error && !loading && <div className="no-data-notice">{error}</div>}

      {summary && !loading && !error && (() => {
        const cfg = getComparisonConfig()
        return (
          <div className="chart-grid">
            {FIELD_OPTIONS.map((option) => (
              <ComparisonChart
                key={option.key}
                title={`${cfg.title} · ${option.label}`}
                comparisonLabel={cfg.comparisonLabel}
                thisMonth={summary.이번달}
                comparison={cfg.comparison}
                field={option.key}
              />
            ))}
          </div>
        )
      })()}

      {summary && !loading && !error && <AnalysisCard summary={summary} />}
    </div>
  )
}
