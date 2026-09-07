import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import MyPage from './pages/MyPage'
import FeeInquiryPage from './pages/FeeInquiryPage'
import './App.css'

function ProtectedRoute({ children }) {
  const { member, loading } = useAuth()
  if (loading) return <div className="page">불러오는 중...</div>
  if (!member) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { member, loading } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={loading ? null : member ? <Navigate to="/mypage" replace /> : <LoginPage />}
      />
      <Route
        path="/mypage"
        element={
          <ProtectedRoute>
            <MyPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fees"
        element={
          <ProtectedRoute>
            <FeeInquiryPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={member ? '/mypage' : '/login'} replace />} />
    </Routes>
  )
}
