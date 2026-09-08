import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchHistory } from '../api/fees'

export default function AppHeader() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isFeesActive = location.pathname.startsWith('/fees')

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  async function handleMyFeesClick() {
    try {
      const res = await fetchHistory()
      navigate(res.data.length === 0 ? '/fees/register' : '/fees')
    } catch {
      navigate('/fees')
    }
  }

  return (
    <header className="app-header">
      <span className="app-title">우리집 관리비 스마트 분석기</span>
      <nav className="app-nav">
        <NavLink
          to="/mypage"
          className={({ isActive }) => 'app-nav-link' + (isActive ? ' active' : '')}
        >
          마이페이지
        </NavLink>
        <div className="app-nav-dropdown">
          <button
            type="button"
            className={'app-nav-link app-nav-link-button' + (isFeesActive ? ' active' : '')}
            onClick={handleMyFeesClick}
          >
            내관리비
          </button>
          <div className="app-nav-dropdown-menu">
            <NavLink to="/fees" className="app-nav-dropdown-item">관리비 조회</NavLink>
            <NavLink to="/fees/register" className="app-nav-dropdown-item">관리비 등록</NavLink>
            <NavLink to="/fees/compare" className="app-nav-dropdown-item">관리비 비교</NavLink>
          </div>
        </div>
        <button className="secondary" onClick={handleLogout}>로그아웃</button>
      </nav>
    </header>
  )
}
