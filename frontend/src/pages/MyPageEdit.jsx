import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const UNIT_SIZES = [18, 24, 32, 38, 45, 52]
const BUILDINGS = Array.from({ length: 15 }, (_, i) => 101 + i)

export default function MyPageEdit() {
  const { member, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    이름: member.이름,
    연락처: member.연락처,
    아파트동: member.아파트동,
    아파트호수: member.아파트호수,
    아파트평수: member.아파트평수,
    가구원수: member.가구원수,
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleChange(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await updateProfile(form)
      navigate('/mypage')
    } catch {
      setError('수정에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>마이페이지 수정</h1>
      </header>

      <div className="card">
        <form onSubmit={handleSubmit} className="edit-form">
          <label>
            이름
            <input value={form.이름} onChange={handleChange('이름')} required />
          </label>
          <label>
            연락처
            <input value={form.연락처} onChange={handleChange('연락처')} required />
          </label>
          <div className="form-row">
            <label>
              아파트동
              <select value={form.아파트동} onChange={handleChange('아파트동')} required>
                <option value="" disabled>선택</option>
                {BUILDINGS.map((building) => (
                  <option key={building} value={building}>{building}동</option>
                ))}
              </select>
            </label>
            <label>
              호수
              <input type="number" value={form.아파트호수} onChange={handleChange('아파트호수')} required />
            </label>
          </div>
          <div className="form-row">
            <label>
              평수
              <select value={form.아파트평수} onChange={handleChange('아파트평수')} required>
                <option value="" disabled>선택</option>
                {UNIT_SIZES.map((size) => (
                  <option key={size} value={size}>{size}평</option>
                ))}
              </select>
            </label>
            <label>
              가구원수
              <input type="number" value={form.가구원수} onChange={handleChange('가구원수')} required />
            </label>
          </div>
          {error && <p className="error-text">{error}</p>}
          <div className="form-actions">
            <button type="submit" disabled={submitting}>
              {submitting ? '저장 중...' : '저장'}
            </button>
            <button type="button" className="secondary" onClick={() => navigate('/mypage')}>
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
