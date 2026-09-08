import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AppHeader from './components/AppHeader'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import MyPage from './pages/MyPage'
import MyPageEdit from './pages/MyPageEdit'
import FeeInquiryPage from './pages/FeeInquiryPage'
import ManagementFeeRegisterPage from './pages/ManagementFeeRegisterPage'
import ManagementFeeComparePage from './pages/ManagementFeeComparePage'
import './App.css'

function ProtectedRoute({ children }) {
  const { member, loading } = useAuth()
  if (loading) return <div className="page">불러오는 중...</div>
  if (!member) return <Navigate to="/login" replace />
  return (
    <>
      <AppHeader />
      {children}
    </>
  )
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
        path="/signup"
        element={loading ? null : member ? <Navigate to="/mypage" replace /> : <SignupPage />}
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
        path="/mypage/edit"
        element={
          <ProtectedRoute>
            <MyPageEdit />
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
      <Route
        path="/fees/register"
        element={
          <ProtectedRoute>
            <ManagementFeeRegisterPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fees/compare"
        element={
          <ProtectedRoute>
            <ManagementFeeComparePage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={member ? '/mypage' : '/login'} replace />} />
    </Routes>
  )
}
