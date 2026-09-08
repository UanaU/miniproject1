import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(id, password)
      navigate('/mypage')
    } catch {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page login-page">
      <div className="login-card">
        <p className="login-eyebrow">관리비 스마트 분석 서비스</p>
        <h1>알뜰살뜰 관리비</h1>
        <form onSubmit={handleSubmit}>
          <label>
            아이디
            <input value={id} onChange={(e) => setId(e.target.value)} placeholder="user0001" required />
          </label>
          <label>
            비밀번호
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="pw10001"
              required
            />
          </label>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? '로그인 중...' : '로그인'}
          </button>
        </form>
        <Link to="/signup" className="signup-link">회원가입</Link>
      </div>
    </div>
  )
}
