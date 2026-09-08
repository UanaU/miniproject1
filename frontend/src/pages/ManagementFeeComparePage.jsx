import { useEffect, useState } from 'react'
import { fetchSummary } from '../api/fees'
import ComparisonChart from '../components/ComparisonChart'
import AnalysisCard from '../components/AnalysisCard'

function toYearMonth(inputValue) {
  return inputValue.replace('-', '') + '01'
}

const CATEGORIES = [
  { key: 'mine', label: '내관리비에서 비교' },
  { key: 'others', label: '다른세대와 비교' },
]

const FIELD_OPTIONS = [
  { key: '합계금액', label: '총관리비' },
  { key: '전기세', label: '전기세' },
  { key: '수도세', label: '수도세' },
  { key: '가스비', label: '가스비' },
]

export default function ManagementFeeComparePage() {
  const [monthInput, setMonthInput] = useState('2026-09')
  const [category, setCategory] = useState(CATEGORIES[0].key)
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

  function getComparisons() {
    if (category === 'mine') {
      return [
        { label: '전월', period: summary.전월 },
        { label: '작년 동월', period: summary.작년동월 },
      ]
    }
    return [
      { label: '같은 평수', period: summary.같은평수평균 },
      { label: '같은 평수+가구원수', period: summary.같은평수_가구원수평균 },
    ]
  }

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

      <div className="compare-tabs">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            className={'compare-tab' + (category === c.key ? ' active' : '')}
            onClick={() => setCategory(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading && <p>불러오는 중...</p>}
      {error && !loading && <div className="no-data-notice">{error}</div>}

      {summary && !loading && !error && (
        <>
          {category === 'others' && (
            <p className="compare-note">
              같은 평수 {summary.같은평수_가구원수평균.기준?.평수}평 · 가구원수{' '}
              {summary.같은평수_가구원수평균.기준?.가구원수}명 기준
            </p>
          )}
          <div className="chart-grid">
            {FIELD_OPTIONS.map((option) => (
              <ComparisonChart
                key={option.key}
                title={`${option.label} 비교`}
                thisMonth={summary.이번달}
                comparisons={getComparisons()}
                field={option.key}
              />
            ))}
          </div>

          <AnalysisCard summary={summary} />
        </>
      )}
    </div>
  )
}
