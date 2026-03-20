import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'
import { Ticket } from 'lucide-react'

interface HeaderProps {
  hideOnScroll?: boolean
}

export default function Header({ hideOnScroll = false }: HeaderProps) {
  const navigate = useNavigate()
  const { isAuthenticated, nickname, tokenBalance, logout, profileImageUrl, role } = useAuthStore()
  const [visible, setVisible] = useState(true)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!hideOnScroll) return
    let lastY = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      if (y <= 10) setVisible(true)
      else if (y < lastY) setVisible(true)
      else if (y > lastY + 4) setVisible(false)
      lastY = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [hideOnScroll])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <>
      <style>{`
        .egag-header-right span, .egag-header-right button { font-size: clamp(12px, 1.2vw, 14px) !important; }
      `}</style>
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px', height: 70, overflow: 'visible',
        background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(16px)',
        position: 'fixed', top: 16, left: '50%',
        transform: `translateX(-50%) translateY(${hideOnScroll && !visible ? 'calc(-100% - 24px)' : '0'})`,
        transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
        width: 'calc(100% - 48px)', maxWidth: 960,
        borderRadius: 100,
        boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
        border: '1px solid rgba(255,255,255,0.8)',
        zIndex: 100,
      }}>
        {/* 로고 */}
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/')} role="button">
          <img src="/Egag_logo-removebg.png" alt="EgAg" style={{ height: 110 }} />
        </div>

        {/* 우측 */}
        <div className="egag-header-right" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isAuthenticated && nickname ? (
            <>
              <span
                onClick={() => navigate('/token-shop')}
                style={{
                  fontSize: 13, fontWeight: 700, color: '#6B82A0',
                  background: 'rgba(107,130,160,0.12)', border: '1px solid rgba(107,130,160,0.25)',
                  borderRadius: 20, padding: '4px 14px', cursor: 'pointer',
                }}
              >
                <Ticket size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />{tokenBalance}개
              </span>

              {/* 프로필 아바타 + 드롭다운 */}
              <div ref={profileRef} style={{ position: 'relative' }}>
                <div
                  onClick={() => setShowProfileMenu(v => !v)}
                  style={{
                    width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
                    background: profileImageUrl ? 'none' : 'linear-gradient(135deg, #6B82A0, #c47a8a)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 800, color: 'white',
                    border: '2px solid rgba(255,255,255,0.8)',
                    boxShadow: '0 2px 12px rgba(107,130,160,0.35)',
                    userSelect: 'none', flexShrink: 0,
                    overflow: 'hidden',
                    transition: 'filter 0.15s, transform 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.filter = 'brightness(1.1)'; (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.06)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.filter = ''; (e.currentTarget as HTMLDivElement).style.transform = '' }}
                >
                  {profileImageUrl ? (
                    <img
                      src={profileImageUrl.startsWith('/uploads') ? `http://localhost:8080${profileImageUrl}` : profileImageUrl}
                      alt={nickname || ''}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    nickname?.charAt(0).toUpperCase()
                  )}
                </div>

                {/* 드롭다운 */}
                <div style={{
                  position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                  background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(16px)',
                  borderRadius: 16, overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  border: '1px solid rgba(255,255,255,0.8)',
                  minWidth: 160,
                  opacity: showProfileMenu ? 1 : 0,
                  transform: showProfileMenu ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.96)',
                  pointerEvents: showProfileMenu ? 'auto' : 'none',
                  transition: 'opacity 0.18s ease, transform 0.18s ease',
                  zIndex: 200,
                }}>
                  <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #f0f0f0' }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>{nickname}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9ca3af' }}>토큰 {tokenBalance}개 보유</p>
                  </div>
                  {[
                    { label: '마이페이지', onClick: () => { setShowProfileMenu(false); navigate('/mypage') } },
                    ...(role === 'ADMIN' ? [{ label: '관리자 페이지', onClick: () => { setShowProfileMenu(false); navigate('/admin') } }] : []),
                    { label: '로그아웃', onClick: () => { setShowProfileMenu(false); handleLogout() }, danger: true },
                  ].map(({ label, onClick, danger }) => (
                    <button
                      key={label}
                      onClick={onClick}
                      style={{
                        display: 'block', width: '100%', padding: '11px 16px',
                        background: 'none', border: 'none', textAlign: 'left',
                        fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        color: danger ? '#e63946' : '#4a4a6a',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = danger ? 'rgba(230,57,70,0.06)' : 'rgba(107,130,160,0.08)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none' }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                style={{
                  fontSize: 14, fontWeight: 600, color: '#6B82A0',
                  background: 'none', border: '1px solid rgba(107,130,160,0.4)',
                  borderRadius: 20, padding: '7px 20px', cursor: 'pointer',
                }}
              >
                로그인
              </button>
              <button
                onClick={() => navigate('/signup')}
                style={{
                  fontSize: 14, fontWeight: 700, color: '#fff',
                  background: 'linear-gradient(135deg, #6B82A0, #c47a8a)',
                  border: 'none', borderRadius: 20, padding: '7px 20px', cursor: 'pointer',
                }}
              >
                회원가입
              </button>
            </>
          )}
        </div>
      </header>
    </>
  )
}
