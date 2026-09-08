import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const UNIT_SIZES = [18, 24, 32, 38, 45, 52]

const initialForm = {
  회원id: '',
  회원비밀번호: '',
  이름: '',
  연락처: '',
  아파트동: '',
  아파트호수: '',
  아파트평수: '',
  가구원수: '',
}

export default function SignupPage() {
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { signup } = useAuth()
  const navigate = useNavigate()

  function handleChange(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await signup(form)
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.detail ?? '회원가입에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page login-page">
      <div className="login-card signup-card">
        <h1>회원가입</h1>
        <form onSubmit={handleSubmit}>
          <label>
            아이디
            <input value={form.회원id} onChange={handleChange('회원id')} required />
          </label>
          <label>
            비밀번호
            <input type="password" value={form.회원비밀번호} onChange={handleChange('회원비밀번호')} required />
          </label>
          <label>
            이름
            <input value={form.이름} onChange={handleChange('이름')} required />
          </label>
          <label>
            연락처
            <input value={form.연락처} onChange={handleChange('연락처')} placeholder="010-0000-0000" required />
          </label>
          <div className="form-row">
            <label>
              아파트동
              <input type="number" value={form.아파트동} onChange={handleChange('아파트동')} required />
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
          <button type="submit" disabled={submitting}>
            {submitting ? '가입 중...' : '회원가입'}
          </button>
        </form>
        <Link to="/login" className="signup-link">이미 계정이 있으신가요? 로그인</Link>
      </div>
    </div>
  )
}
