import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function MyPage() {
  const { member, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  if (!member) return null

  return (
    <div className="page">
      <header className="page-header">
        <h1>마이페이지</h1>
        <button className="secondary" onClick={handleLogout}>로그아웃</button>
      </header>

      <div className="card">
        <dl className="info-grid">
          <dt>이름</dt>
          <dd>{member.이름}</dd>
          <dt>아이디</dt>
          <dd>{member.회원id}</dd>
          <dt>연락처</dt>
          <dd>{member.연락처}</dd>
          <dt>동/호수</dt>
          <dd>{member.아파트동}동 {member.아파트호수}호</dd>
          <dt>평수</dt>
          <dd>{member.아파트평수}평</dd>
          <dt>가구원수</dt>
          <dd>{member.가구원수}명</dd>
        </dl>
      </div>

      <Link className="primary-link" to="/fees">관리비 조회하러 가기 →</Link>
    </div>
  )
}
