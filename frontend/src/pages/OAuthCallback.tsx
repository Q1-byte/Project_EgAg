import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'
import { getMe } from '../api/user'

export default function OAuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const setAuth = useAuthStore(s => s.setAuth)
  const setNeedsOnboarding = useAuthStore(s => s.setNeedsOnboarding)
  const setProfileImageUrl = useAuthStore(s => s.setProfileImageUrl)
  const processed = useRef(false)

  useEffect(() => {
    if (processed.current) return
    processed.current = true

    const accessToken = searchParams.get('accessToken')
    const refreshToken = searchParams.get('refreshToken')
    const userId = searchParams.get('userId')
    const nickname = searchParams.get('nickname')
    const role = searchParams.get('role') || 'USER'
    const tokenBalance = searchParams.get('tokenBalance')

    const needsOnboarding = searchParams.get('needsOnboarding') === 'true'

    if (accessToken && userId && nickname && tokenBalance) {
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken)
      setAuth(userId, nickname, role, parseInt(tokenBalance), accessToken)
      setNeedsOnboarding(needsOnboarding)

      // 프로필 이미지 즉시 반영
      getMe().then(profile => {
        if (profile.profileImageUrl) setProfileImageUrl(profile.profileImageUrl)
      }).catch(() => {})

      if (needsOnboarding) {
        navigate('/kakao-onboarding', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    } else {
      navigate('/login?error=oauth_failed', { replace: true })
    }
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontSize: 16, color: '#64748B' }}>로그인 처리 중...</p>
    </div>
  )
}
