import { useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './stores/useAuthStore'
import { useTokenRefresh } from './hooks/useTokenRefresh'

// 페이지 컴포넌트들
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
import TimeAttack from './pages/TimeAttack'

// 상준 파트 페이지 컴포넌트들
import Explore from './artwork/Explore'
import ArtworkDetail from './artwork/ArtworkDetail'
import UserProfile from './artwork/UserProfile'
import Gallery from './artwork/Gallery'
import Notifications from './artwork/Notifications'
import Search from './artwork/Search'
import EditProfile from './artwork/EditProfile'

// 어드민 컴포넌트들
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUserManagement from './pages/admin/UserManagement'; // ✅ 통합 관리 페이지
// import UserManagement from './pages/admin/UserManagement'; // 👈 삭제 (더 이상 사용 안 함)
import PaymentManagement from './pages/admin/PaymentManagement';
import AdminSidebar from './pages/admin/AdminSidebar';

// 온보딩 가드: 카카오 로그인 후 추가 정보 입력이 필요한 경우 강제 이동
function OnboardingGuard() {
    const { needsOnboarding } = useAuthStore()
    const navigate = useNavigate()
    const location = useLocation()

    useEffect(() => {
        if (needsOnboarding && location.pathname !== '/kakao-onboarding') {
            navigate('/kakao-onboarding', { replace: true })
        }
    }, [needsOnboarding, location.pathname, navigate])

    return null
}

function App() {
    useTokenRefresh()
    return (
        <>
            <OnboardingGuard />
            <Routes>
                {/* --- 일반 사용자 페이지 --- */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/canvas" element={<Canvas />} />
                <Route path="/canvas/:id" element={<Canvas />} />
                <Route path="/decalcomania" element={<Decalcomania />} />
                <Route path="/decalcomania/:id" element={<Decalcomania />} />
                <Route path="/time-attack" element={<TimeAttack />} />

                {/* 준비 중인 페이지들 */}
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/artwork/:id" element={<ArtworkDetail />} />
                <Route path="/user/:id" element={<UserProfile />} />
                <Route path="/search" element={<Search />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/pricing" element={<div>Pricing</div>} />
                <Route path="/billing" element={<div>Billing</div>} />
                <Route path="/profile" element={<div>Profile</div>} />
                <Route path="/profile/edit" element={<EditProfile />} />

                {/* 고객지원 및 약관 */}
                <Route path="/contact" element={<Inquiry />} />
                <Route path="/password-reset" element={<PasswordReset />} />
                <Route path="/password-reset/confirm" element={<PasswordResetConfirm />} />
                <Route path="/terms" element={<Policy type="TERMS" />} />
                <Route path="/privacy" element={<Policy type="PRIVACY" />} />

                {/* 결제 및 계정 */}
                <Route path="/oauth/callback" element={<OAuthCallback />} />
                <Route path="/kakao-onboarding" element={<KakaoOnboarding />} />
                <Route path="/payment/success" element={<div>Payment Success</div>} />
                <Route path="/payment/fail" element={<div>Payment Fail</div>} />
                <Route path="/token-shop" element={<TokenShop />} />
                <Route path="/mypage" element={<MyPage />} />

                {/* --- 🛡️ 어드민 영역 (중첩 라우팅) --- */}
                <Route path="/admin" element={<AdminSidebar />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    {/* ✅ 통합 유저 관리 (토큰 + 상태 변경) */}
                    <Route path="users" element={<AdminUserManagement />} />
                    {/* ❌ path="all-users" 라우트 삭제됨 */}
                    <Route path="payments" element={<PaymentManagement />} />
                </Route>

                {/* 404 페이지 */}
                <Route path="*" element={<div>404 Not Found</div>} />
            </Routes>
        </>
    )
}

export default App