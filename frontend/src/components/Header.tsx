import { useRef, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { consumeToken } from '../api/canvas'
import { useAuthStore } from '../stores/useAuthStore'
import { Ticket, Bell } from 'lucide-react'
import { getUnreadCount } from '../api/notification'
import { getTodayAttendance } from '../api/user'
import AttendanceModal from './AttendanceModal'
import ChickStamp from './ChickStamp'
import { resolveImageUrl } from '../utils/imageUrl'

interface HeaderProps {
  hideOnScroll?: boolean
}

const PencilSVG = () => (
  <svg aria-hidden="true" viewBox="0 0 100 32" preserveAspectRatio="none"
    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'hidden', borderRadius: 20 }}>
    <polyline className="pencil-zigzag" pathLength="1" filter="url(#paint-texture)"
      points="0,4 13,28 25,4 38,28 50,4 63,28 75,4 88,28 100,4" />
  </svg>
)

export default function Header({ hideOnScroll = false }: HeaderProps) {
  const navigate = useNavigate()
  const { isAuthenticated, nickname, tokenBalance, setTokenBalance, logout, profileImageUrl, role } = useAuthStore()
  const [visible, setVisible] = useState(true)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDrawMenu, setShowDrawMenu] = useState(false)
  const [showTokenModal, setShowTokenModal] = useState<'canvas' | 'deco' | 'time' | null>(null)
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [hasAttendedToday, setHasAttendedToday] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const drawRef = useRef<HTMLDivElement>(null)

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

  // 알림 개수 주기적 확인 (1분)
  useEffect(() => {
    if (!isAuthenticated) return
    
    const fetchCount = async () => {
      try {
        const count = await getUnreadCount()
        setUnreadCount(count)
      } catch (err) {
        console.error('Failed to fetch unread count:', err)
      }
    }

    fetchCount()
    const interval = setInterval(fetchCount, 60000)
    return () => clearInterval(interval)
  }, [isAuthenticated])

  // 출석 상태 확인
  useEffect(() => {
    if (!isAuthenticated) return
    const fetchAttendance = async () => {
      try {
        const { attended } = await getTodayAttendance()
        setHasAttendedToday(attended)
      } catch (err) {
        console.error('Failed to fetch attendance status:', err)
      }
    }
    fetchAttendance()
  }, [isAuthenticated])

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
      {/* 토큰 확인 모달 */}
      {showTokenModal && (
        <div onClick={() => setShowTokenModal(null)} style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(10,8,20,0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'rgba(255,255,255,0.97)',
            borderRadius: 28, padding: '40px 36px',
            width: '100%', maxWidth: 380,
            boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            textAlign: 'center',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: showTokenModal === 'deco' ? 'rgba(107,130,160,0.12)' : showTokenModal === 'time' ? 'rgba(212,168,0,0.12)' : 'rgba(196,122,138,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4,
            }}>
              <Ticket size={26} color={showTokenModal === 'deco' ? '#4a6a8a' : showTokenModal === 'time' ? '#b08800' : '#a85a6a'} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 900, margin: 0, color: '#1a1a2e', letterSpacing: -0.5 }}>
              토큰 1개가 필요해요
            </h3>
            <p style={{ fontSize: 14, color: '#8a8aaa', lineHeight: 1.75, margin: '4px 0 8px' }}>
              {showTokenModal === 'canvas' && 'AI 변환을 요청할 때 토큰 1개가 차감돼요.'}
              {showTokenModal === 'deco' && 'AI 미러 변환을 요청할 때 토큰 1개가 차감돼요.'}
              {showTokenModal === 'time' && '시간초 그림판을 시작할 때 토큰 1개가 차감돼요.'}
              <br />현재 보유 토큰 <strong style={{ color: '#4a5a7a' }}>{tokenBalance}개</strong>
            </p>
            <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 8 }}>
              <button onClick={() => setShowTokenModal(null)} style={{
                flex: 1, padding: '13px', fontSize: 15, fontWeight: 600,
                background: 'none', border: '1.5px solid #e2e8f0',
                borderRadius: 14, cursor: 'pointer', color: '#8a8aaa',
              }}>취소</button>
              <button onClick={async () => {
                if (showTokenModal === 'time') {
                  try {
                    const res = await consumeToken()
                    setTokenBalance(res.tokenBalance)
                  } catch {
                    alert('토큰이 부족합니다.')
                    return
                  }
                }
                setShowTokenModal(null)
                navigate(showTokenModal === 'deco' ? '/decalcomania' : showTokenModal === 'time' ? '/time-attack' : '/canvas')
              }} style={{
                flex: 1, padding: '13px', fontSize: 15, fontWeight: 700,
                background: showTokenModal === 'deco'
                  ? 'linear-gradient(135deg, #6B82A0, #4a6a8a)'
                  : showTokenModal === 'time'
                  ? 'linear-gradient(135deg, #d4a800, #b08800)'
                  : 'linear-gradient(135deg, #c47a8a, #a85a6a)',
                border: 'none', borderRadius: 14, cursor: 'pointer', color: '#fff',
              }}>시작할게요!</button>
            </div>
          </div>
        </div>
      )}

      {/* 출석체크 모달 */}
      {showAttendanceModal && (
        <AttendanceModal 
          onClose={() => setShowAttendanceModal(false)} 
          onSuccess={() => {
            setHasAttendedToday(true)
          }}
        />
      )}

      {/* 공유 SVG 필터 */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="paint-texture" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.65 0.4" numOctaves="3" seed="2" result="noise"/>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" result="displaced"/>
            <feGaussianBlur in="displaced" stdDeviation="0.6"/>
          </filter>
        </defs>
      </svg>

      <style>{`
        .sketch-btn {
          position: relative;
          isolation: isolate;
          font-size: 16px; font-weight: 600; color: #6B82A0;
          background: none; border: none;
          border-radius: 20px; padding: 6px 18px;
          cursor: pointer; transition: color 0.3s, font-size 0.2s ease, font-weight 0.2s ease;
        }
        .sketch-btn:hover { color: #fff; font-size: 17.5px; font-weight: 800; }
        .pencil-zigzag {
          fill: none;
          stroke: rgba(212,96,122,0.9);
          stroke-width: 16;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 0 1;
          opacity: 0;
          transition: stroke-dasharray 0.5s ease, opacity 0.3s ease;
        }
        .sketch-btn:hover .pencil-zigzag { stroke-dasharray: 1.1 0; opacity: 1; }
        
        @keyframes stamp-shake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }
        .stamp-wait {
          animation: stamp-shake 2s infinite ease-in-out;
        }
        .draw-menu-item span {
          position: relative;
          display: inline-block;
        }
        .draw-menu-item span::after {
          content: '';
          position: absolute;
          left: 0; bottom: -1px;
          width: 100%; height: 1.5px;
          background: #d4607a;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.22s ease;
        }
        .draw-menu-item:hover span::after {
          transform: scaleX(1);
        }
        @media (max-width: 640px) {
          .site-header { padding: 0 16px !important; }
          .header-nav-links { display: none !important; }
          .header-token-badge { display: none !important; }
        }
        @media (min-width: 641px) and (max-width: 860px) {
          .sketch-btn { font-size: 13px !important; padding: 6px 10px !important; }
          .header-token-badge { padding: 4px 10px !important; font-size: 12px !important; }
        }
      `}</style>

      <header className="site-header" style={{
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
        {/* 로고 + 네비 버튼 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/')} role="button">
            <img src="/Egag_logo-removebg.png" alt="EgAg" style={{ height: 43 }} />
          </div>
          <div className="header-nav-links" ref={drawRef} style={{ position: 'relative' }}
            onMouseEnter={() => setShowDrawMenu(true)}
            onMouseLeave={() => setShowDrawMenu(false)}>
            <button className="sketch-btn">
              <PencilSVG />
              <span style={{ position: 'relative', zIndex: 1 }}>그림그리기</span>
            </button>
            <div style={{
              position: 'absolute', top: '100%', left: 0, paddingTop: 8,
              background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(16px)',
              borderRadius: 16, overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              border: '1px solid rgba(255,255,255,0.8)',
              minWidth: 160,
              opacity: showDrawMenu ? 1 : 0,
              transform: showDrawMenu ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.96)',
              pointerEvents: showDrawMenu ? 'auto' : 'none',
              transition: 'opacity 0.18s ease, transform 0.18s ease',
              zIndex: 200,
            }}>
              {[
                { label: '마법 그림판', type: 'canvas' as const },
                { label: '거울 그림판', type: 'deco' as const },
                { label: '시간초 그림판', type: 'time' as const },
              ].map(({ label, type }) => (
                <button key={label} onClick={() => { setShowDrawMenu(false); setShowTokenModal(type) }}
                  className="draw-menu-item"
                  style={{
                    display: 'block', width: '100%', padding: '11px 16px',
                    background: 'none', border: 'none', textAlign: 'left',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#4a4a6a',
                  }}
                >
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
          <button className="sketch-btn header-nav-links" onClick={() => navigate('/explore')}>
            <PencilSVG />
            <span style={{ position: 'relative', zIndex: 1 }}>갤러리</span>
          </button>
          <button className="sketch-btn header-nav-links" onClick={() => navigate('/token-shop')}>
            <PencilSVG />
            <span style={{ position: 'relative', zIndex: 1 }}>토큰충전</span>
          </button>
        </div>

        {/* 우측 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isAuthenticated && nickname ? (
            <>
              <span
                className="header-token-badge"
                onClick={() => navigate('/token-shop')}
                style={{
                  fontSize: 13, fontWeight: 700, color: '#6B82A0',
                  background: 'rgba(107,130,160,0.12)', border: '1px solid rgba(107,130,160,0.25)',
                  borderRadius: 20, padding: '4px 14px', cursor: 'pointer',
                }}
              >
                <Ticket size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />{tokenBalance}개
              </span>

              {/* 알림 종 아이콘 */}
              <div 
                onClick={() => navigate('/notifications')}
                style={{
                  position: 'relative',
                  width: 36, height: 36,
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  color: unreadCount > 0 ? '#ff5c8d' : '#6B82A0',
                  background: unreadCount > 0 ? 'rgba(255, 92, 141, 0.1)' : 'rgba(107, 130, 160, 0.08)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = unreadCount > 0 ? 'rgba(255, 92, 141, 0.15)' : 'rgba(107, 130, 160, 0.12)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = unreadCount > 0 ? 'rgba(255, 92, 141, 0.1)' : 'rgba(107, 130, 160, 0.08)' }}
              >
                <Bell size={20} fill={unreadCount > 0 ? '#ff5c8d' : 'transparent'} strokeWidth={2.2} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: 2, right: 2,
                    minWidth: 16, height: 16,
                    borderRadius: 8,
                    background: '#ff4d4f',
                    color: 'white',
                    fontSize: 10,
                    fontWeight: 900,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid white',
                    padding: '0 2px'
                  }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>

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
                      src={resolveImageUrl(profileImageUrl)}
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
                    { label: '나의 문의', onClick: () => { setShowProfileMenu(false); navigate('/myinquiries') } },
                    { label: '출석체크', onClick: () => { setShowProfileMenu(false); setShowAttendanceModal(true) } },
                    { label: '알림', onClick: () => { setShowProfileMenu(false); navigate('/notifications') } },
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
              <button className="sketch-btn" onClick={() => navigate('/login')}>
                <PencilSVG />
                <span style={{ position: 'relative', zIndex: 1 }}>로그인</span>
              </button>
              <button className="sketch-btn" onClick={() => navigate('/signup')}>
                <PencilSVG />
                <span style={{ position: 'relative', zIndex: 1 }}>회원가입</span>
              </button>
            </>
          )}
        </div>
      </header>
    </>
  )
}
