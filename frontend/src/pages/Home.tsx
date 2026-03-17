import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'

export default function Home() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const nickname = useAuthStore(s => s.nickname)
  const tokenBalance = useAuthStore(s => s.tokenBalance)

  const handleDraw = () => {
    if (isAuthenticated) {
      navigate('/decalcomania?skip=true')
    } else {
      navigate('/login')
    }
  }

  return (
    <div style={s.bg}>
      {/* 헤더 */}
      <header style={s.header}>
        <div style={s.logo}>
          <span style={s.logoIcon}>🪞</span>
          <span style={s.logoText}>Decal<b>co</b></span>
        </div>
        {isAuthenticated && nickname && (
          <div style={s.userInfo}>
            <span style={s.userGreet}>{nickname}님 안녕하세요!</span>
            <span style={s.tokenBadge}>🎟 {tokenBalance}개</span>
          </div>
        )}
      </header>

      {/* 히어로 */}
      <section style={s.hero}>
        <div style={s.heroTag}>✨ AI 데칼코마니 그림판</div>
        <h1 style={s.heroTitle}>
          절반만 그리면<br />
          <span style={s.accent}>미러(AI)</span>가 완성해줘요
        </h1>
        <p style={s.heroDesc}>
          그림의 절반을 자유롭게 그리면, AI 친구 미러가 반대쪽을 데칼코마니로 완성하고<br />
          어떤 그림인지 맞춰봐요! 완성된 작품은 색칠하고 JPG로 저장할 수 있어요.
        </p>
        <button style={s.ctaBtn} onClick={handleDraw}>
          지금 바로 그려보기 →
        </button>
        <p style={s.tokenNotice}>
          🎟 시작하기 버튼을 누르면 토큰 1개가 소모됩니다.<br />
          뒤로 가기를 눌러도 토큰은 복구되지 않습니다.
        </p>
      </section>

      {/* 사용 방법 */}
      <section style={s.howto}>
        <h2 style={s.sectionTitle}>이렇게 사용해요</h2>
        <div style={s.steps}>
          {STEPS.map((step, i) => (
            <div key={i} style={s.stepCard}>
              <div style={s.stepNum}>{i + 1}</div>
              <div style={s.stepIcon}>{step.icon}</div>
              <div style={s.stepTitle}>{step.title}</div>
              <div style={s.stepDesc}>{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

<footer style={s.footer}>
        © 2025 Decalco · AI 데칼코마니 그림판
      </footer>
    </div>
  )
}

const STEPS = [
  {
    icon: '✏️',
    title: '시작하기',
    desc: '토큰으로\n창의적인 그림그리기를\n시작하세요.',
  },
  {
    icon: '🖌️',
    title: '절반만 그려요',
    desc: '주제 키워드를 참고해서\n캔버스 왼쪽 절반에\n자유롭게 그림을 그려요.',
  },
  {
    icon: '🪞',
    title: '미러가 완성해요',
    desc: '완성하기 버튼을 누르면\nAI 미러가 반대쪽을\n데칼코마니로 채워요.',
  },
  {
    icon: '🎨',
    title: '색칠하고 저장',
    desc: 'AI의 추측을 확인하고,\n색칠해서 JPG로\n저장해봐요!',
  },
]

// ─── 스타일 ──────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  bg: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #EFF6FF 0%, #F0FDF4 60%, #FFF7ED 100%)',
    fontFamily: 'inherit',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 48px', borderBottom: '1px solid #E2E8F0',
    background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)',
    position: 'sticky', top: 0, zIndex: 10,
  },
  logo: { display: 'flex', alignItems: 'center', gap: 8 },
  userInfo: { display: 'flex', alignItems: 'center', gap: 12 },
  userGreet: { fontSize: 15, fontWeight: 600, color: '#334155' },
  tokenBadge: {
    fontSize: 14, fontWeight: 700, color: '#1D4ED8',
    background: '#EFF6FF', border: '1px solid #BFDBFE',
    borderRadius: 20, padding: '4px 14px',
  },
  logoIcon: { fontSize: 24 },
  logoText: { fontSize: 20, fontWeight: 700, color: '#1D4ED8', letterSpacing: -0.5 },
  hero: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    textAlign: 'center', padding: '80px 24px 60px',
  },
  heroTag: {
    background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 20,
    padding: '6px 18px', fontSize: 13, color: '#2563EB', fontWeight: 600,
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 46, fontWeight: 800, color: '#0F172A',
    lineHeight: 1.2, margin: '0 0 20px', letterSpacing: -1,
  },
  accent: { color: '#3B82F6' },
  heroDesc: {
    fontSize: 17, color: '#475569', lineHeight: 1.8,
    margin: '0 0 36px', maxWidth: 560,
  },
  tokenNotice: {
    fontSize: 13, color: '#94A3B8', marginTop: 14, textAlign: 'center' as const, lineHeight: 1.8,
  },
  ctaBtn: {
    padding: '16px 40px', fontSize: 17, fontWeight: 700,
    background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
    color: '#fff', border: 'none', borderRadius: 14, cursor: 'pointer',
    boxShadow: '0 4px 24px rgba(59,130,246,0.35)',
    transition: 'transform 0.15s',
  },
  howto: {
    background: '#fff', padding: '64px 24px',
    borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9',
  },
  sectionTitle: {
    textAlign: 'center', fontSize: 26, fontWeight: 800,
    color: '#0F172A', margin: '0 0 40px', letterSpacing: -0.5,
  },
  steps: {
    display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'nowrap',
    maxWidth: 960, margin: '0 auto', overflowX: 'auto',
    padding: '0 24px',
  },
  stepCard: {
    background: '#fff', borderRadius: 20, padding: '32px 24px',
    boxShadow: '0 2px 20px rgba(0,0,0,0.07)', flex: '1 1 180px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
    border: '1px solid #F1F5F9',
  },
  stepNum: {
    width: 32, height: 32, borderRadius: '50%',
    background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
    color: '#fff', fontSize: 14, fontWeight: 800,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  stepIcon: { fontSize: 28, marginBottom: 8 },
  stepTitle: { fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 6 },
  stepDesc: { fontSize: 13, color: '#64748B', lineHeight: 1.6, whiteSpace: 'pre-line' },
  footer: {
    textAlign: 'center', padding: '24px', fontSize: 13, color: '#94A3B8',
    borderTop: '1px solid #E2E8F0',
  },
}
