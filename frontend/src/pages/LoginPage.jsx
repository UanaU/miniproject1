import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchHistory } from '../api/fees'

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
    } catch {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.')
      setSubmitting(false)
      return
    }

    try {
      const history = await fetchHistory()
      navigate(history.data.length === 0 ? '/fees/register' : '/mypage')
    } catch {
      navigate('/mypage')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page login-page">
      <div className="login-card">
        <h1>아파트 관리비 조회</h1>
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
        <p className="hint">테스트 계정: user0001~user1000 / pw10001~pw11000</p>
      </div>
    </div>
  )
}
