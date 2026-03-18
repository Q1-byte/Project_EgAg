import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'

// ─── 스타일 설정 ──────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  bg: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #EFF6FF 0%, #F0FDF4 60%, #FFF7ED 100%)',
    fontFamily: 'inherit',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '18px 48px', borderBottom: '1px solid #E2E8F0',
    background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)',
    position: 'sticky', top: 0, zIndex: 10,
  },
  logo: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' },
  logoIcon: { fontSize: 24 },
  logoText: { fontSize: 20, fontWeight: 700, color: '#1D4ED8', letterSpacing: -0.5 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
  userGreet: { fontSize: 15, fontWeight: 600, color: '#334155' },
  tokenBadge: {
    fontSize: 14, fontWeight: 700, color: '#1D4ED8',
    background: '#EFF6FF', border: '1px solid #BFDBFE',
    borderRadius: 20, padding: '4px 14px',
  },
  logoutBtn: {
    fontSize: 13, fontWeight: 600, color: '#64748B',
    background: 'none', border: '1px solid #CBD5E1',
    borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
  },
  loginBtn: {
    fontSize: 14, fontWeight: 600, color: '#1D4ED8',
    background: 'none', border: '1px solid #BFDBFE',
    borderRadius: 8, padding: '7px 18px', cursor: 'pointer',
  },
  signupBtn: {
    fontSize: 14, fontWeight: 700, color: '#fff',
    background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
    border: 'none', borderRadius: 8, padding: '7px 18px', cursor: 'pointer',
  },
  main: {
    flex: 1,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '72px 24px 48px',
    textAlign: 'center',
  },
  mainTitle: {
    fontSize: 38, fontWeight: 800, color: '#0F172A',
    margin: '0 0 12px', letterSpacing: -1,
  },
  mainDesc: {
    fontSize: 16, color: '#64748B', margin: '0 0 56px',
  },
  cards: {
    display: 'flex', gap: 28, justifyContent: 'center', flexWrap: 'wrap',
  },
  card: {
    background: '#fff', borderRadius: 24, padding: '40px 32px',
    boxShadow: '0 4px 32px rgba(0,0,0,0.08)', width: 280,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 12, cursor: 'pointer',
    border: '1px solid #F1F5F9',
    transition: 'transform 0.15s, box-shadow 0.15s',
  },
  cardIcon: { fontSize: 48, marginBottom: 4 },
  cardTitle: { fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0 },
  cardDesc: { fontSize: 14, color: '#475569', lineHeight: 1.7, margin: 0 },
  cardBadge: {
    fontSize: 12, fontWeight: 600, color: '#2563EB',
    background: '#EFF6FF', border: '1px solid #BFDBFE',
    borderRadius: 20, padding: '4px 12px',
  },
  cardBtn: {
    marginTop: 8, padding: '12px 28px', fontSize: 15, fontWeight: 700,
    color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer',
    width: '100%',
  },
  footer: {
    textAlign: 'center', padding: '24px', fontSize: 13, color: '#94A3B8',
    borderTop: '1px solid #E2E8F0',
    background: 'rgba(255, 255, 255, 0.4)',
  },
  footerContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  footerLinks: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
  },
  footerLink: {
    color: '#64748B',
    textDecoration: 'none',
    fontWeight: 600,
  },
  footerItem: {
    cursor: 'pointer',
    color: '#94A3B8',
  },
  divider: {
    width: '1px',
    height: '10px',
    backgroundColor: '#E2E8F0',
  },
}

export default function Home() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const nickname = useAuthStore(s => s.nickname)
  const tokenBalance = useAuthStore(s => s.tokenBalance)
  const logout = useAuthStore(s => s.logout)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
      <div style={s.bg}>
        {/* 헤더 */}
        <header style={s.header}>
          <div style={s.logo} onClick={() => navigate('/')} role="button">
            <span style={s.logoIcon}>🪞</span>
            <span style={s.logoText}>Decal<b>co</b></span>
          </div>

          <div style={s.headerRight}>
            {isAuthenticated && nickname ? (
                <>
                  <span style={s.userGreet}>{nickname}님 안녕하세요!</span>
                  <span style={s.tokenBadge}>🎟 {tokenBalance}개</span>
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

        {/* 메인 컨텐츠 */}
        <main style={s.main}>
          <h1 style={s.mainTitle}>무엇을 그려볼까요?</h1>
          <p style={s.mainDesc}>AI와 함께 창의적인 그림을 완성해보세요.</p>

          <div style={s.cards}>
            {/* 데칼코마니 카드 */}
            <div style={s.card} onClick={() => navigate(isAuthenticated ? '/decalcomania' : '/login')}>
              <div style={s.cardIcon}>🪞</div>
              <h2 style={s.cardTitle}>데칼코마니</h2>
              <p style={s.cardDesc}>
                절반만 그리면 AI 미러가<br />
                반대쪽을 대칭으로 완성해줘요.
              </p>
              <div style={s.cardBadge}>🎟 토큰 1개 소모</div>
              <button style={{ ...s.cardBtn, background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}>
                시작하기 →
              </button>
            </div>

            {/* EgAg 카드 */}
            <div style={s.card} onClick={() => navigate(isAuthenticated ? '/canvas' : '/login')}>
              <div style={s.cardIcon}>✏️</div>
              <h2 style={{ ...s.cardTitle, color: '#4c1d95' }}>EgAg</h2>
              <p style={s.cardDesc}>
                자유롭게 그리면 AI가 맞춰보고<br />
                동화 스타일 그림으로 변환해줘요.
              </p>
              <div style={{ ...s.cardBadge, color: '#7C3AED', background: '#EDE9FE', border: '1px solid #DDD6FE' }}>
                ✨ AI 스케치 분석
              </div>
              <button style={{ ...s.cardBtn, background: 'linear-gradient(135deg, #7C3AED, #A855F7)' }}>
                시작하기 →
              </button>
            </div>
          </div>
        </main>

        {/* 푸터 영역 */}
        <footer style={s.footer}>
          <div style={s.footerContent}>
            <div>© 2026 Decalco · AI 데칼코마니 그림판</div>
            <div style={s.footerLinks}>
              <Link to="/contact" style={s.footerLink}>1:1 문의하기</Link>
              <span style={s.divider}></span>
              <span style={s.footerItem}>이용약관</span>
              <span style={s.divider}></span>
              <span style={{ ...s.footerItem, fontWeight: 700 }}>개인정보처리방침</span>
            </div>
          </div>
        </footer>
      </div>
  )
}