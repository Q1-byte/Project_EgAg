import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '../stores/useAuthStore'
import { Pencil, Layers, Ticket, Sparkles, Timer, ArrowRight, MessageCircle, ChevronUp } from 'lucide-react'

export default function Home() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const nickname = useAuthStore(s => s.nickname)
  const tokenBalance = useAuthStore(s => s.tokenBalance)
  const logout = useAuthStore(s => s.logout)
  const featureRefs = useRef<(HTMLDivElement | null)[]>([])
  const [showTop, setShowTop] = useState(false)
  const [headerVisible, setHeaderVisible] = useState(true)
  const [showTokenModal, setShowTokenModal] = useState<'canvas' | 'deco' | 'time' | null>(null)

  useEffect(() => {
    let lastY = window.scrollY
    const onScroll = () => {
      const currentY = window.scrollY
      if (currentY <= 10) {
        setHeaderVisible(true)
      } else if (currentY < lastY) {
        setHeaderVisible(true)
      } else if (currentY > lastY + 4) {
        setHeaderVisible(false)
      }
      lastY = currentY
      setShowTop(currentY > 400)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('feature-visible')
          }
        })
      },
      { threshold: 0.15 }
    )
    featureRefs.current.forEach(el => { if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div style={s.bg}>
      <style>{`
        @keyframes float1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }
        @keyframes float2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes scrollDot { 0%{transform:translateY(0);opacity:1} 80%{transform:translateY(14px);opacity:0} 100%{transform:translateY(0);opacity:0} }
        .scroll-dot { width:3px; height:5px; border-radius:2px; background:rgba(180,168,200,0.7); animation:scrollDot 1.8s ease infinite; }
        .scroll-hint { animation: float2 3s ease-in-out infinite; }
        .card-canvas:hover { transform: translateY(-6px) scale(1.02); box-shadow: 0 20px 60px rgba(196,122,138,0.25) !important; }
        .card-deco:hover   { transform: translateY(-6px) scale(1.02); box-shadow: 0 20px 60px rgba(107,130,160,0.25) !important; }
        .card-time:hover   { transform: translateY(-6px) scale(1.02); box-shadow: 0 20px 60px rgba(212,168,0,0.25) !important; }
        .start-btn:hover   { filter: brightness(1.08); }
        .egag-cards { display: flex; gap: 24px; justify-content: center; flex-wrap: wrap; padding: 0 16px; }
        .egag-card  { width: clamp(260px, 28vw, 300px); }
        .egag-header-right span, .egag-header-right button { font-size: clamp(12px, 1.2vw, 14px) !important; }
        .fab-inquiry { transition: box-shadow 0.2s, transform 0.15s; }
        .fab-inquiry:hover { transform: scale(1.06); box-shadow: 0 8px 32px rgba(107,130,160,0.4) !important; }
        .fab-top { transition: box-shadow 0.2s, transform 0.3s, opacity 0.3s; }
        .fab-top:hover { transform: translateY(-2px) scale(1.08) !important; box-shadow: 0 8px 32px rgba(107,130,160,0.35) !important; }
        .star-field {
          background-image:
            radial-gradient(circle, rgba(255,255,255,0.75) 1px, transparent 1px),
            radial-gradient(circle, rgba(255,255,255,0.45) 1px, transparent 1px),
            radial-gradient(circle, rgba(200,180,255,0.5) 1px, transparent 1px);
          background-size: 220px 220px, 340px 340px, 160px 160px;
          background-position: 10px 20px, 80px 140px, 40px 80px;
        }
        .egag-main-title { font-size: clamp(28px, 5vw, 48px) !important; }
        .egag-main-desc  { font-size: clamp(14px, 1.5vw, 17px) !important; }
        @media (max-width: 600px) {
          .egag-card { width: 100% !important; }
          .egag-cards { padding: 0 20px; }
        }
        /* ── feature section animations ── */
        .feature-item { opacity: 0; }
        .feat-img {
          opacity: 0;
          transform: translateX(-64px);
          transition: transform 1s cubic-bezier(0.16,1,0.3,1), opacity 0.9s ease;
        }
        .feat-txt {
          opacity: 0;
          transform: translateX(64px);
          transition: transform 1s cubic-bezier(0.16,1,0.3,1) 0.18s, opacity 0.9s ease 0.18s;
        }
        .feat-row-rev .feat-img { transform: translateX(64px); }
        .feat-row-rev .feat-txt { transform: translateX(-64px); }
        .feature-visible { opacity: 1; }
        .feature-visible .feat-img,
        .feature-visible .feat-txt { opacity: 1; transform: translateX(0); }
        .feat-intro {
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.9s ease, transform 0.9s ease;
        }
        .feat-intro.feature-visible { opacity: 1; transform: translateY(0); }
        .feat-cta { transition: gap 0.2s, opacity 0.2s; display:inline-flex; align-items:center; gap:6px; }
        .feat-cta:hover { gap: 12px !important; opacity: 0.75; }
        @media (max-width: 860px) {
          .feat-row, .feat-row-rev { flex-direction: column !important; }
          .feat-img, .feat-txt { transform: translateY(40px) !important; }
          .feature-visible .feat-img,
          .feature-visible .feat-txt { transform: translateY(0) !important; }
        }
        @media (max-width: 600px) {
          .egag-card { width: 100% !important; }
          .egag-cards { padding: 0 20px; }
        }
      `}</style>

      {/* 배경 blob */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-8%', width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, #d8e8f5 0%, transparent 70%)', animation: 'float1 7s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', top: '20%', right: '-10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, #f2d8dc 0%, transparent 70%)', animation: 'float2 9s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '5%', left: '20%', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, #eddff5 0%, transparent 70%)', animation: 'float1 11s ease-in-out infinite' }} />
      </div>

      {/* 헤더 */}
      <header style={{ ...s.header, transform: headerVisible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(calc(-100% - 24px))', transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)' }}>
        <div style={s.logo} onClick={() => navigate('/')} role="button">
          <img src="/Egag_logo-removebg.png" alt="EgAg" style={{ height: 110 }} />
        </div>
        <div className="egag-header-right" style={s.headerRight}>
          {isAuthenticated && nickname ? (
            <>
              <span style={s.userGreet}>{nickname}님 안녕하세요!</span>
              <span style={{ ...s.tokenBadge, cursor: 'pointer' }} onClick={() => navigate('/token-shop')}><Ticket size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />{tokenBalance}개</span>
              <button style={s.logoutBtn} onClick={() => navigate('/mypage')}>마이페이지</button>
              <button style={s.logoutBtn} onClick={handleLogout}>로그아웃</button>
            </>
          ) : (
            <>
              <button style={s.loginBtn} onClick={() => navigate('/login')}>로그인</button>
              <button style={s.signupBtn} onClick={() => navigate('/signup')}>회원가입</button>
            </>
          )}
        </div>
      </header>

      {/* 메인 */}
      <main style={s.main}>
        <p style={s.eyebrow}><Sparkles size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} />AI 그림 놀이터</p>
        <h1 className="egag-main-title" style={s.mainTitle}>무엇을 그려볼까요?</h1>
        <p className="egag-main-desc" style={s.mainDesc}>AI와 함께하는 3가지 그림 놀이, 지금 바로 시작해봐요</p>

        {/* 스크롤 유도 */}
        <div className="scroll-hint" style={{ margin: '4px 0 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 10, letterSpacing: 4, color: '#c0b8d0', textTransform: 'uppercase', fontWeight: 700 }}>scroll</span>
          <div style={{ width: 16, height: 26, borderRadius: 8, border: '1.5px solid rgba(180,168,200,0.5)', display: 'flex', justifyContent: 'center', paddingTop: 4, boxSizing: 'border-box' }}>
            <div className="scroll-dot" />
          </div>
        </div>

        <div className="egag-cards" style={s.cards}>
          {/* EgAg 카드 */}
          <div className="card-canvas egag-card" style={s.cardCanvas} onClick={() => isAuthenticated ? setShowTokenModal('canvas') : navigate('/login')}>
            <div style={s.cardTop}>
              <div style={{ ...s.cardIconWrap, background: 'rgba(255,255,255,0.45)' }}><Pencil size={28} color="#7a3a4a" /></div>
              <span style={{ ...s.cardTag, color: '#7a3a4a', background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(196,122,138,0.3)' }}><Ticket size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />토큰 1개</span>
            </div>
            <h2 style={{ ...s.cardTitle, color: '#5a1e2e' }}>마법 그림판</h2>
            <p style={{ ...s.cardDesc, color: '#7a3a4a' }}>
              자유롭게 그리면 AI가 맞춰보고<br />동화 스타일 그림으로 변환해줘요
            </p>
            <button className="start-btn" style={{ ...s.cardBtn, background: 'linear-gradient(135deg, #c47a8a, #a85a6a)' }}>
              시작하기
              <ArrowRight size={16} />
            </button>
          </div>

          {/* 데칼코마니 카드 */}
          <div className="card-deco egag-card" style={s.cardDeco} onClick={() => isAuthenticated ? setShowTokenModal('deco') : navigate('/login')}>
            <div style={s.cardTop}>
              <div style={{ ...s.cardIconWrap, background: 'rgba(255,255,255,0.45)' }}><Layers size={28} color="#2d5a8a" /></div>
              <span style={{ ...s.cardTag, color: '#2d5a8a', background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(107,130,160,0.3)' }}><Ticket size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />토큰 1개</span>
            </div>
            <h2 style={{ ...s.cardTitle, color: '#1e3a5f' }}>거울 그림판</h2>
            <p style={{ ...s.cardDesc, color: '#3a5a7a' }}>
              절반만 그리면 AI 미러가<br />반대쪽을 대칭으로 완성해줘요
            </p>
            <button className="start-btn" style={{ ...s.cardBtn, background: 'linear-gradient(135deg, #6B82A0, #4a6a8a)' }}>
              시작하기
              <ArrowRight size={16} />
            </button>
          </div>

          {/* 타임어택 카드 */}
          <div className="card-time egag-card" style={s.cardTime} onClick={() => isAuthenticated ? setShowTokenModal('time') : navigate('/login')}>
            <div style={s.cardTop}>
              <div style={{ ...s.cardIconWrap, background: 'rgba(255,255,255,0.45)' }}><Timer size={28} color="#7a6000" /></div>
              <span style={{ ...s.cardTag, color: '#7a6000', background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(200,170,0,0.3)' }}><Ticket size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />토큰 1개</span>
            </div>
            <h2 style={{ ...s.cardTitle, color: '#5a4400' }}>시간초 그림판</h2>
            <p style={{ ...s.cardDesc, color: '#7a6000' }}>
              주어진 주제를 제한 시간 안에 그려봐요.<br />AI가 맞히면 성공!
            </p>
            <button className="start-btn" style={{ ...s.cardBtn, background: 'linear-gradient(135deg, #d4a800, #b08800)' }}>
              시작하기
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

      </main>

      {/* SVG 웨이브 전환 */}
      <div style={{ position: 'relative', zIndex: 1, lineHeight: 0, marginTop: 60 }}>
        <svg viewBox="0 0 1440 130" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: '100%' }} preserveAspectRatio="none">
          <path d="M0,70 C240,130 600,10 900,80 C1140,140 1320,30 1440,65 L1440,130 L0,130 Z" fill="rgba(35,24,58,0.5)" />
          <path d="M0,90 C300,20 700,120 1050,60 C1260,20 1380,90 1440,75 L1440,130 L0,130 Z" fill="#1a1428" />
        </svg>
      </div>

      {/* 기능 소개 섹션 */}
      <section style={s.featureSection}>

        {/* 별 레이어 */}
        <div className="star-field" style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', borderRadius: 'inherit' }} />
        {/* 성운 glow */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '10%', left: '5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(100,40,160,0.18) 0%, transparent 65%)' }} />
          <div style={{ position: 'absolute', top: '45%', right: '0%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(30,60,150,0.15) 0%, transparent 65%)' }} />
          <div style={{ position: 'absolute', bottom: '5%', left: '30%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(120,30,100,0.14) 0%, transparent 65%)' }} />
        </div>

        {/* 섹션 헤더 */}
        <div className="feat-intro" ref={el => { featureRefs.current[3] = el }} style={s.featIntro}>
          <p style={s.featEyebrow}>Features</p>
          <h2 style={s.featSectionTitle}>세 가지 방법으로<br />즐기는 AI 그림 놀이</h2>
          <div style={s.featDivider} />
        </div>

        {/* 마법 그림판: 이미지 왼쪽, 텍스트 오른쪽 */}
        <div className="feature-item feat-row" ref={el => { featureRefs.current[0] = el }} style={s.featureRow}>
          <div className="feat-img" style={s.featureImgWrap}>
            <img src="/icon/img1.png" alt="마법 그림판" style={s.featureImg} />
          </div>
          <div className="feat-txt" style={s.featureText}>
            <span style={{ ...s.featureBadge, color: '#e8a0b0', background: 'rgba(196,122,138,0.15)', border: '1px solid rgba(196,122,138,0.4)' }}>마법 그림판</span>
            <h3 style={s.featureTitle}>AI가 내 그림을<br />맞춰요!</h3>
            <p style={s.featureDesc}>
              캔버스에 자유롭게 그림을 그려보세요.<br />
              AI가 분석하고 카툰·동화·마법 3D<br />스타일로 변환해드려요.
            </p>
            <button className="feat-cta" style={s.featCta} onClick={() => navigate(isAuthenticated ? '/canvas' : '/login')}>
              시작하기
            </button>
          </div>
        </div>

        {/* 거울 그림판: 텍스트 왼쪽, 이미지 오른쪽 */}
        <div className="feature-item feat-row-rev" ref={el => { featureRefs.current[1] = el }} style={{ ...s.featureRow, flexDirection: 'row-reverse' as const }}>
          <div className="feat-img" style={s.featureImgWrap}>
            <img src="/icon/img2.png" alt="거울 그림판" style={s.featureImg} />
          </div>
          <div className="feat-txt" style={{ ...s.featureText, alignItems: 'flex-end' as const, textAlign: 'right' as const }}>
            <span style={{ ...s.featureBadge, color: '#90b8e0', background: 'rgba(107,130,160,0.18)', border: '1px solid rgba(107,130,160,0.45)' }}>거울 그림판</span>
            <h3 style={s.featureTitle}>반만 그려도<br />완성!</h3>
            <p style={s.featureDesc}>
              캔버스 절반에만 그림을 그리면<br />
              AI 미러가 반대쪽을 대칭으로<br />완성해줘요.
            </p>
            <button className="feat-cta" style={s.featCta} onClick={() => navigate(isAuthenticated ? '/decalcomania' : '/login')}>
              시작하기
            </button>
          </div>
        </div>

        {/* 시간초 그림판: 이미지 왼쪽, 텍스트 오른쪽 */}
        <div className="feature-item feat-row" ref={el => { featureRefs.current[2] = el }} style={s.featureRow}>
          <div className="feat-img" style={s.featureImgWrap}>
            <img src="/icon/img3.png" alt="시간초 그림판" style={s.featureImg} />
          </div>
          <div className="feat-txt" style={s.featureText}>
            <span style={{ ...s.featureBadge, color: '#e8c850', background: 'rgba(212,168,0,0.15)', border: '1px solid rgba(212,168,0,0.4)' }}>시간초 그림판</span>
            <h3 style={s.featureTitle}>두근두근<br />제한 시간!</h3>
            <p style={s.featureDesc}>
              주어진 주제를 제한 시간 안에 그려요.<br />
              AI가 맞히면 성공! 친구·가족과<br />함께하면 더욱 재밌어요.
            </p>
            <button className="feat-cta" style={s.featCta} onClick={() => navigate(isAuthenticated ? '/canvas' : '/login')}>
              시작하기
            </button>
          </div>
        </div>

      </section>

      <footer style={s.footer}>© 2025 EgAg · AI 그림판</footer>

      {/* 스크롤 상단 버튼 */}
      <button
        className="fab-top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        style={{
          position: 'fixed', bottom: 100, right: 32,
          width: 48, height: 48, borderRadius: '50%',
          background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)',
          border: '1.5px solid rgba(107,130,160,0.25)',
          boxShadow: '0 4px 24px rgba(107,130,160,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 200,
          opacity: showTop ? 1 : 0,
          transform: showTop ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.3s, transform 0.3s',
          pointerEvents: showTop ? 'auto' : 'none',
        }}
      >
        <ChevronUp size={20} color="#6B82A0" strokeWidth={2.5} />
      </button>

      {/* 플로팅 문의 버튼 */}
      <button
        className="fab-inquiry"
        onClick={() => navigate('/contact')}
        style={{
          position: 'fixed', bottom: 32, right: 32,
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '14px 22px', borderRadius: 100,
          background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)',
          border: '1.5px solid rgba(107,130,160,0.25)',
          boxShadow: '0 4px 24px rgba(107,130,160,0.2)',
          fontSize: 14, fontWeight: 700, color: '#4a5a7a',
          cursor: 'pointer', zIndex: 200,
        }}
      >
        <MessageCircle size={18} color="#6B82A0" />
        문의하기
      </button>

      {/* 토큰 확인 모달 */}
      {showTokenModal && (
        <div
          onClick={() => setShowTokenModal(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 500,
            background: 'rgba(10,8,20,0.6)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'rgba(255,255,255,0.97)',
              borderRadius: 28, padding: '40px 36px',
              width: '100%', maxWidth: 380,
              boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
              textAlign: 'center',
            }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: showTokenModal === 'deco' ? 'rgba(107,130,160,0.12)' : showTokenModal === 'time' ? 'rgba(212,168,0,0.12)' : 'rgba(196,122,138,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4,
            }}>
              <Ticket size={26} color={showTokenModal === 'deco' ? '#4a6a8a' : showTokenModal === 'time' ? '#b08800' : '#a85a6a'} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 900, margin: 0, color: '#1a1a2e', letterSpacing: -0.5 }}>
              토큰 1개가 사용돼요
            </h3>
            <p style={{ fontSize: 14, color: '#8a8aaa', lineHeight: 1.75, margin: '4px 0 8px' }}>
              {showTokenModal === 'canvas' && '그림을 완성하고 AI 변환을 요청할 때\n토큰 1개가 소비됩니다.'}
              {showTokenModal === 'deco' && '거울 그림판은 AI 미러 기능 사용 시\n토큰 1개가 소비됩니다.'}
              {showTokenModal === 'time' && '시간초 그림판은 결과 확인 시\n토큰 1개가 소비됩니다.'}
              <br />현재 보유 토큰 <strong style={{ color: '#4a5a7a' }}>{tokenBalance}개</strong>
            </p>
            <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 8 }}>
              <button
                onClick={() => setShowTokenModal(null)}
                style={{
                  flex: 1, padding: '13px', fontSize: 15, fontWeight: 600,
                  background: 'none', border: '1.5px solid #e2e8f0',
                  borderRadius: 14, cursor: 'pointer', color: '#8a8aaa',
                }}
              >
                취소
              </button>
              <button
                onClick={() => {
                  setShowTokenModal(null)
                  navigate(showTokenModal === 'deco' ? '/decalcomania' : '/canvas')
                }}
                style={{
                  flex: 1, padding: '13px', fontSize: 15, fontWeight: 700,
                  background: showTokenModal === 'deco'
                    ? 'linear-gradient(135deg, #6B82A0, #4a6a8a)'
                    : showTokenModal === 'time'
                    ? 'linear-gradient(135deg, #d4a800, #b08800)'
                    : 'linear-gradient(135deg, #c47a8a, #a85a6a)',
                  border: 'none', borderRadius: 14, cursor: 'pointer', color: '#fff',
                }}
              >
                시작할게요!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  bg: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #f5f0f8 0%, #ede8f2 40%, #f0eee9 100%)',
    fontFamily: 'inherit',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflowX: 'hidden',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 28px', height: 70, overflow: 'hidden',
    background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(16px)',
    position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
    width: 'calc(100% - 48px)', maxWidth: 960,
    borderRadius: 100,
    boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
    border: '1px solid rgba(255,255,255,0.8)',
    zIndex: 100,
  },
  logo: { display: 'flex', alignItems: 'center', cursor: 'pointer' },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
  userGreet: { fontSize: 14, fontWeight: 600, color: '#4a4a6a' },
  tokenBadge: {
    fontSize: 13, fontWeight: 700, color: '#6B82A0',
    background: 'rgba(107,130,160,0.12)', border: '1px solid rgba(107,130,160,0.25)',
    borderRadius: 20, padding: '4px 14px',
  },
  logoutBtn: {
    fontSize: 13, fontWeight: 500, color: '#8a8aaa',
    background: 'none', border: '1px solid #ddd',
    borderRadius: 20, padding: '6px 16px', cursor: 'pointer',
  },
  loginBtn: {
    fontSize: 14, fontWeight: 600, color: '#6B82A0',
    background: 'none', border: '1px solid rgba(107,130,160,0.4)',
    borderRadius: 20, padding: '7px 20px', cursor: 'pointer',
  },
  signupBtn: {
    fontSize: 14, fontWeight: 700, color: '#fff',
    background: 'linear-gradient(135deg, #6B82A0, #c47a8a)',
    border: 'none', borderRadius: 20, padding: '7px 20px', cursor: 'pointer',
  },
  main: {
    flex: 1, position: 'relative', zIndex: 1,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '130px 24px 60px',
    textAlign: 'center',
  },
  eyebrow: {
    fontSize: 13, fontWeight: 600, letterSpacing: 2,
    color: '#c47a8a', margin: '0 0 16px',
    textTransform: 'uppercase',
  },
  mainTitle: {
    fontSize: 48, fontWeight: 900, margin: '0 0 16px',
    letterSpacing: -1.5, lineHeight: 1.2, padding: '4px 8px',
    background: 'linear-gradient(135deg, #3a5a8a 0%, #c47a8a 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  mainDesc: {
    fontSize: 17, color: '#8a7a9a', margin: '0 0 60px', lineHeight: 1.7,
  },
  cards: {
    display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap',
  },
  cardCanvas: {
    background: 'linear-gradient(145deg, #fce8ed 0%, #f2d0d8 100%)',
    borderRadius: 28, padding: '36px 32px',
    boxShadow: '0 8px 40px rgba(196,122,138,0.18)',
    width: 300, display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
    gap: 14, cursor: 'pointer',
    border: '1.5px solid rgba(255,255,255,0.7)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    textAlign: 'left',
  },
  cardDeco: {
    background: 'linear-gradient(145deg, #ddeaf8 0%, #c8daf0 100%)',
    borderRadius: 28, padding: '36px 32px',
    boxShadow: '0 8px 40px rgba(107,130,160,0.18)',
    width: 300, display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
    gap: 14, cursor: 'pointer',
    border: '1.5px solid rgba(255,255,255,0.7)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    textAlign: 'left',
  },
  cardTime: {
    background: 'linear-gradient(145deg, #fdf5cc 0%, #f5e580 100%)',
    borderRadius: 28, padding: '36px 32px',
    boxShadow: '0 8px 40px rgba(212,168,0,0.18)',
    width: 300, display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
    gap: 14, cursor: 'pointer',
    border: '1.5px solid rgba(255,255,255,0.7)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    textAlign: 'left',
  },
  cardTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  cardIconWrap: {
    fontSize: 32, width: 56, height: 56, borderRadius: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(8px)',
  },
  cardTag: {
    fontSize: 12, fontWeight: 600, borderRadius: 20, padding: '4px 12px',
  },
  cardTitle: { fontSize: 24, fontWeight: 900, margin: 0 },
  cardDesc: { fontSize: 14, lineHeight: 1.75, margin: 0, flex: 1 },
  cardBtn: {
    width: '100%', padding: '14px', fontSize: 15, fontWeight: 700,
    color: '#fff', border: 'none', borderRadius: 14, cursor: 'pointer',
    transition: 'filter 0.15s',
    letterSpacing: 0.3,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  featureSection: {
    position: 'relative', zIndex: 1,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 100,
    width: '100%',
    padding: '60px 24px 140px',
    background: '#1a1428',
  },
  featInner: {
    maxWidth: 1080, margin: '0 auto', width: '100%',
    display: 'flex', flexDirection: 'column' as const, gap: 120,
  },
  featIntro: {
    textAlign: 'center' as const,
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 16,
    position: 'relative' as const, zIndex: 1,
    width: '100%', maxWidth: 860,
  },
  featEyebrow: {
    fontSize: 12, fontWeight: 700, letterSpacing: 4,
    color: '#7a6a9a', margin: 0, textTransform: 'uppercase' as const,
  },
  featSectionTitle: {
    fontSize: 'clamp(32px, 4.5vw, 52px)' as unknown as number,
    fontWeight: 900, margin: 0,
    letterSpacing: -2, lineHeight: 1.12,
    color: '#f0ecfa',
  },
  featDivider: {
    width: 48, height: 3, borderRadius: 99,
    background: 'linear-gradient(90deg, #c47a8a, #6B82A0)',
    marginTop: 8,
  },
  featureRow: {
    display: 'flex', alignItems: 'center', gap: 56,
    position: 'relative' as const, zIndex: 1,
    width: '100%', maxWidth: 860,
  },
  featureImgWrap: {
    flex: '0 0 auto',
    width: 'clamp(240px, 38%, 380px)' as unknown as number,
    aspectRatio: '1 / 1' as unknown as number,
    borderRadius: 36,
    overflow: 'hidden',
    boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
    background: 'rgba(255,255,255,0.05)',
  },
  featureImg: {
    width: '100%', height: '100%', objectFit: 'cover' as const, display: 'block',
  },
  featureText: {
    flex: 1,
    display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-start' as const, gap: 20,
    minWidth: 0,
  },
  featureBadge: {
    display: 'inline-block',
    fontSize: 13, fontWeight: 700, borderRadius: 100, padding: '6px 16px',
    letterSpacing: 0.3,
  },
  featureTitle: {
    fontSize: 'clamp(32px, 3.8vw, 52px)' as unknown as number,
    fontWeight: 900, margin: 0,
    color: '#f0ecfa', letterSpacing: -1.5, lineHeight: 1.1,
  },
  featureDesc: {
    fontSize: 17, color: '#8888aa', lineHeight: 1.9, margin: 0,
  },
  featCta: {
    fontSize: 16, fontWeight: 700,
    color: '#d0c8f0', background: 'none', border: 'none',
    cursor: 'pointer', padding: 0, letterSpacing: -0.3,
    marginTop: 4,
  },
  footer: {
    position: 'relative', zIndex: 1,
    textAlign: 'center', padding: '24px', fontSize: 12, color: '#4a4a6a',
    background: '#1a1428',
  },
}

