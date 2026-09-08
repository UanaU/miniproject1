import { useEffect, useMemo, useState } from 'react'
import { fetchHistory, fetchSummary, updateRecord } from '../api/fees'
import FeeBreakdownTable from '../components/FeeBreakdownTable'
import FeeHistoryChart from '../components/FeeHistoryChart'

function toYearMonth(inputValue) {
  return inputValue.replace('-', '') + '01'
}

export default function FeeInquiryPage() {
  const [monthInput, setMonthInput] = useState('2026-09')
  const [summary, setSummary] = useState(null)
  const [history, setHistory] = useState([])
  const [selectedField, setSelectedField] = useState('합계금액')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const yearMonth = toYearMonth(monthInput)
  const currentYear = monthInput.slice(0, 4)
  const yearHistory = useMemo(
    () => history.filter((row) => row.청구년월.slice(0, 4) === currentYear),
    [history, currentYear]
  )

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

  useEffect(() => {
    let cancelled = false
    fetchHistory()
      .then((res) => {
        if (!cancelled) setHistory(res.data)
      })
      .catch(() => {
        if (!cancelled) setHistory([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleUpdateField(field, value) {
    const res = await updateRecord(yearMonth, { [field]: value })
    setSummary((prev) => ({ ...prev, 이번달: res.data }))
    setHistory((prev) =>
      prev.map((row) =>
        row.청구년월 === yearMonth
          ? { ...row, 전기세: res.data.세대별.전기세, 수도세: res.data.세대별.수도세, 가스비: res.data.세대별.가스비, 합계금액: res.data.합계금액 }
          : row
      )
    )
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>관리비 조회</h1>
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
        <div className="fee-layout">
          <FeeBreakdownTable
            thisMonth={summary.이번달}
            selectedField={selectedField}
            onSelectField={setSelectedField}
            onUpdateField={handleUpdateField}
          />
          <FeeHistoryChart
            title={selectedField}
            year={currentYear}
            history={yearHistory}
            field={selectedField}
          />
        </div>
      )}
    </div>
  )
}
