import { Routes, Route } from 'react-router-dom'
import Canvas from './pages/Canvas'
import Decalcomania from './pages/Decalcomania'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Inquiry from './pages/Inquiry'
import PasswordReset from './pages/PasswordReset'
import PasswordResetConfirm from './pages/PasswordResetConfirm'
import OAuthCallback from './pages/OAuthCallback'
import KakaoOnboarding from './pages/KakaoOnboarding'
import Policy from './pages/Policy'
import TokenShop from './pages/TokenShop'
import MyPage from './pages/MyPage'

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUserManagement from './pages/admin/AdminUserManagement';
import UserManagement from './pages/admin/UserManagement';
import PaymentManagement from './pages/admin/PaymentManagement';
import AdminSidebar from './pages/admin/AdminSidebar';

function OnboardingGuard() {
  const { needsOnboarding } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (needsOnboarding && location.pathname !== '/kakao-onboarding') {
      navigate('/kakao-onboarding', { replace: true })
    }
  }, [needsOnboarding, location.pathname])

  return null
}

function App() {
    return (
        <Routes>
            {/* --- 일반 사용자 페이지 --- */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/canvas" element={<Canvas />} />
            <Route path="/canvas/:id" element={<Canvas />} />
            <Route path="/decalcomania" element={<Decalcomania />} />
            <Route path="/decalcomania/:id" element={<Decalcomania />} />

            {/* 준비 중인 페이지들 */}
            <Route path="/gallery" element={<div>Gallery</div>} />
            <Route path="/explore" element={<div>Explore</div>} />
            <Route path="/artwork/:id" element={<div>Artwork Detail</div>} />
            <Route path="/user/:id" element={<div>User Profile</div>} />
            <Route path="/search" element={<div>Search</div>} />
            <Route path="/notifications" element={<div>Notifications</div>} />
            <Route path="/pricing" element={<div>Pricing</div>} />
            <Route path="/billing" element={<div>Billing</div>} />
            <Route path="/profile" element={<div>Profile</div>} />

            {/* 고객지원 및 약관 */}
            <Route path="/contact" element={<Inquiry />} />
            <Route path="/password-reset" element={<PasswordReset />} />
            <Route path="/password-reset/confirm" element={<PasswordResetConfirm />} />
            <Route path="/terms" element={<Policy type="TERMS" />} />
            <Route path="/privacy" element={<Policy type="PRIVACY" />} />

            {/* 결제 및 계정 */}
            <Route path="/oauth/callback" element={<OAuthCallback />} />
            <Route path="/payment/success" element={<div>Payment Success</div>} />
            <Route path="/payment/fail" element={<div>Payment Fail</div>} />
            <Route path="/token-shop" element={<TokenShop />} />
            <Route path="/mypage" element={<MyPage />} />

            {/* --- 🛡️ 어드민 영역 --- */}
            <Route path="/admin" element={<AdminSidebar />}>
                {/* 1. localhost:3000/admin 접속 시 자동으로 대시보드 표시 */}
                <Route index element={<AdminDashboard />} />
                {/* 2. localhost:3000/admin/dashboard 접속 시 대시보드 표시 */}
                <Route path="dashboard" element={<AdminDashboard />} />
                {/* 3. 기타 관리 페이지들 (앞에 /를 붙이지 마세요!) */}
                <Route path="users" element={<AdminUserManagement />} />
                <Route path="all-users" element={<UserManagement />} />
                <Route path="payments" element={<PaymentManagement />} />
            </Route>

            {/* 404 페이지 */}
            <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
    )
  return (
    <>
      <OnboardingGuard />
      <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/canvas" element={<Canvas />} />
      <Route path="/canvas/:id" element={<Canvas />} />
      <Route path="/decalcomania" element={<Decalcomania />} />
      <Route path="/decalcomania/:id" element={<Decalcomania />} />
      <Route path="/gallery" element={<div>Gallery</div>} />
      <Route path="/explore" element={<div>Explore</div>} />
      <Route path="/artwork/:id" element={<div>Artwork Detail</div>} />
      <Route path="/user/:id" element={<div>User Profile</div>} />
      <Route path="/search" element={<div>Search</div>} />
      <Route path="/notifications" element={<div>Notifications</div>} />
      <Route path="/pricing" element={<div>Pricing</div>} />
      <Route path="/billing" element={<div>Billing</div>} />
      <Route path="/profile" element={<div>Profile</div>} />
        <Route path="/contact" element={<Inquiry />} />
      <Route path="/password-reset" element={<div>Password Reset</div>} />
      <Route path="/contact" element={<div>Contact</div>} />
      <Route path="/password-reset" element={<PasswordReset />} />
      <Route path="/password-reset/confirm" element={<PasswordResetConfirm />} />
      <Route path="/oauth/callback" element={<OAuthCallback />} />
      <Route path="/kakao-onboarding" element={<KakaoOnboarding />} />
      <Route path="/payment/success" element={<div>Payment Success</div>} />
      <Route path="/payment/fail" element={<div>Payment Fail</div>} />
        <Route path="/terms" element={<Policy type="TERMS" />} />
        <Route path="/privacy" element={<Policy type="PRIVACY" />} />
      <Route path="/token-shop" element={<TokenShop />} />
      <Route path="/mypage" element={<MyPage />} />
      <Route path="/admin" element={<div>Admin</div>} />
      <Route path="*" element={<div>404 Not Found</div>} />
    </Routes>
    </>
  )
}

export default App
