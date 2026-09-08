import { useEffect, useState } from 'react'
import { fetchSummary } from '../api/fees'
import ComparisonChart from '../components/ComparisonChart'

function toYearMonth(inputValue) {
  return inputValue.replace('-', '') + '01'
}

function toInputValue(yearMonth) {
  return `${yearMonth.slice(0, 4)}-${yearMonth.slice(4, 6)}`
}

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
        <div className="chart-grid">
          <ComparisonChart
            title="전월 비교"
            comparisonLabel={toInputValue(summary.전월.청구년월 ?? yearMonth)}
            thisMonth={summary.이번달}
            comparison={summary.전월}
          />
          <ComparisonChart
            title="작년 동월 비교"
            comparisonLabel="작년 동월"
            thisMonth={summary.이번달}
            comparison={summary.작년동월}
          />
          <ComparisonChart
            title="같은 평수 비교"
            comparisonLabel="같은 평수 평균"
            thisMonth={summary.이번달}
            comparison={summary.같은평수평균}
          />
          <ComparisonChart
            title={`같은 평수(${summary.같은평수_가구원수평균.기준?.평수}평)+가구원수(${summary.같은평수_가구원수평균.기준?.가구원수}명) 비교`}
            comparisonLabel="같은 조건 평균"
            thisMonth={summary.이번달}
            comparison={summary.같은평수_가구원수평균}
          />
        </div>
      )}
    </div>
  )
}
