import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerFee } from '../api/fees'

function toYearMonth(inputValue) {
  return inputValue.replace('-', '') + '01'
}

export default function ManagementFeeRegisterPage() {
  const [monthInput, setMonthInput] = useState('2026-09')
  const [전기세, set전기세] = useState('')
  const [수도세, set수도세] = useState('')
  const [가스비, set가스비] = useState('')
  const [납부완료, set납부완료] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await registerFee({
        청구년월: toYearMonth(monthInput),
        전기세,
        수도세,
        가스비,
        납부상태: 납부완료,
      })
      navigate('/fees')
    } catch (err) {
      setError(err.response?.data?.detail ?? '관리비 등록에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>관리비 등록</h1>
      </header>

      <p className="page-lead register-lead">
        <span>세대별 항목(전기세/수도세/가스비)만 입력하면, 단지 공통·동 공통 항목은</span>{' '}
        <span>동일 청구년월의 다른 세대 값을 기준으로 자동 반영됩니다.</span>
      </p>

      <div className="card">
        <form onSubmit={handleSubmit} className="edit-form">
          <label>
            청구년월
            <input type="month" value={monthInput} onChange={(e) => setMonthInput(e.target.value)} required />
          </label>
          <label>
            전기세
            <input type="number" value={전기세} onChange={(e) => set전기세(e.target.value)} required />
          </label>
          <label>
            수도세
            <input type="number" value={수도세} onChange={(e) => set수도세(e.target.value)} required />
          </label>
          <label>
            가스비
            <input type="number" value={가스비} onChange={(e) => set가스비(e.target.value)} required />
          </label>
          <label className="checkbox-row">
            <input type="checkbox" checked={납부완료} onChange={(e) => set납부완료(e.target.checked)} />
            납부 완료
          </label>
          {error && <p className="error-text">{error}</p>}
          <div className="form-actions">
            <button type="submit" disabled={submitting}>
              {submitting ? '등록 중...' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
