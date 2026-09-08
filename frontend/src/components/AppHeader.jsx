import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AppHeader() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <header className="app-header">
      <span className="app-title">아파트 관리비 조회</span>
      <nav className="app-nav">
        <NavLink
          to="/mypage"
          className={({ isActive }) => 'app-nav-link' + (isActive ? ' active' : '')}
        >
          마이페이지
        </NavLink>
        <div className="app-nav-dropdown">
          <NavLink
            to="/fees"
            className={({ isActive }) => 'app-nav-link' + (isActive ? ' active' : '')}
          >
            관리비
          </NavLink>
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
