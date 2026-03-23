import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../api/auth'
import { useAuthStore } from '../stores/useAuthStore'

function AnimatedEye({ passwordFocused, emailFocused }: { passwordFocused: boolean; emailFocused: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const targetRef = useRef({ x: 0, y: 0 })
  const currentRef = useRef({ x: 0, y: 0 })
  const rafRef = useRef<number>()
  const [pupil, setPupil] = useState({ x: 0, y: 0 })
  const [blink, setBlink] = useState(false)

  useEffect(() => {
    const tick = () => {
      const c = currentRef.current
      const t = targetRef.current
      const nx = c.x + (t.x - c.x) * 0.13
      const ny = c.y + (t.y - c.y) * 0.13
      if (Math.abs(nx - c.x) > 0.02 || Math.abs(ny - c.y) > 0.02) {
        currentRef.current = { x: nx, y: ny }
        setPupil({ x: nx, y: ny })
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (passwordFocused || emailFocused) return
      const el = svgRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height * 0.56
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const ratio = Math.min(dist, 280) / 280
      targetRef.current = { x: (dx / dist) * 4 * ratio, y: (dy / dist) * 4 * ratio }
    }
    window.addEventListener('mousemove', handle, { passive: true })
    return () => window.removeEventListener('mousemove', handle)
  }, [passwordFocused, emailFocused])

  useEffect(() => {
    if (passwordFocused) targetRef.current = { x: 0, y: 0 }
    else if (emailFocused) targetRef.current = { x: 0, y: 4 }
    else targetRef.current = { x: 0, y: 0 }
  }, [passwordFocused, emailFocused])

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    const doBlink = () => {
      setBlink(true)
      setTimeout(() => {
        setBlink(false)
        t = setTimeout(doBlink, 2400 + Math.random() * 3000)
      }, 130)
    }
    t = setTimeout(doBlink, 1800 + Math.random() * 2000)
    return () => clearTimeout(t)
  }, [])

  const px = pupil.x
  const py = pupil.y
  // 눈 중심 — viewBox 200×270 기준
  const L = { x: 83, y: 151 }
  const R = { x: 117, y: 151 }
  const eyeClosed = blink

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4, userSelect: 'none' }}>
      <style>{`
        @keyframes chicFloat { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-8px)} }
        .chic-svg { animation: chicFloat 3.6s ease-in-out infinite; }
      `}</style>
      <svg ref={svgRef} width="240" height="324" viewBox="0 0 200 270" className="chic-svg"
        style={{ filter: 'drop-shadow(0 14px 28px rgba(0,0,0,0.15))' }}>
        <defs>
          <clipPath id="body-clip">
            <rect x="0" y="133" width="200" height="200" />
          </clipPath>
        </defs>

        {/* ── 병아리 몸통 (노란 타원) ── */}
        <ellipse cx="100" cy="173" rx="57" ry="73" fill="#FFD700" stroke="#000000" strokeWidth="1.5" clipPath="url(#body-clip)" />

        {/* ── 눈 흰자 ── */}
        <circle cx={L.x} cy={L.y} r="11" fill="white" stroke="#000000" strokeWidth="1.5"
          style={{ transformBox: 'fill-box', transformOrigin: 'center',
            transform: eyeClosed ? 'scaleY(0.07)' : 'scaleY(1)',
            transition: 'transform 0.09s ease' }} />
        <circle cx={R.x} cy={R.y} r="11" fill="white" stroke="#000000" strokeWidth="1.5"
          style={{ transformBox: 'fill-box', transformOrigin: 'center',
            transform: eyeClosed ? 'scaleY(0.07)' : 'scaleY(1)',
            transition: 'transform 0.09s ease' }} />

        {/* ── 동공 + 하이라이트 ── */}
        {!eyeClosed && (
          <>
            <circle cx={L.x + px} cy={L.y + py} r="6.5" fill="#0a0400" />
            <circle cx={L.x + px + 2.5} cy={L.y + py - 2.5} r="2" fill="white" opacity="0.9" />
            <circle cx={R.x + px} cy={R.y + py} r="6.5" fill="#0a0400" />
            <circle cx={R.x + px + 2.5} cy={R.y + py - 2.5} r="2" fill="white" opacity="0.9" />
          </>
        )}

        {/* ── 부리 (둥근 삼각형) ── */}
        <path d="M 93,161 L 107,161 L 100,172 Z"
          fill="#FFA500" stroke="#000000" strokeWidth="1" strokeLinejoin="round" />

        {/* ── 볼터치 ── */}
        <ellipse cx="64" cy="160" rx="8" ry="5.5" fill="#FFC0CB" />
        <ellipse cx="136" cy="160" rx="8" ry="5.5" fill="#FFC0CB" />

        {/* ── 달걀 하단 컵 (병아리 몸통 하부를 덮음) ── */}
        <path d="M 30,187 L 48,170 L 65,187 L 83,170 L 100,187 L 117,170 L 135,187 L 152,170 L 170,187
                 C 175,222 170,255 100,258
                 C 30,255 25,222 30,187 Z"
          fill="#FFEDDC" stroke="#000000" strokeWidth="1.8" strokeLinejoin="miter" />

        {/* ── 달걀 상단 뚜껑 (비밀번호 포커스 시 내려와서 닫힘) ── */}
        <g style={{
          transform: passwordFocused ? 'translateY(38px)' : 'translateY(0px)',
          transition: 'transform 0.4s cubic-bezier(0.34, 1.3, 0.64, 1)',
        }}>
          <path d="M 30,148 L 48,131 L 65,148 L 83,131 L 100,148 L 117,131 L 135,148 L 152,131 L 170,148
                   C 165,102 150,72 100,68
                   C 50,72 35,102 30,148 Z"
            fill="#FFEDDC" stroke="#000000" strokeWidth="1.8" strokeLinejoin="miter" />
          <ellipse cx="76" cy="98" rx="9" ry="13" fill="#FFFFFF" opacity="0.4"
            transform="rotate(-25, 76, 98)" />
        </g>

      </svg>
    </div>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore(s => s.setAuth)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({})
  const [loading, setLoading] = useState(false)
  const [failCount, setFailCount] = useState(0)
  const [robotChecked, setRobotChecked] = useState(false)
  const [robotChecking, setRobotChecking] = useState(false)

  const handleRobotCheck = () => {
    if (robotChecked || robotChecking) return
    setRobotChecking(true)
    setTimeout(() => {
      setRobotChecking(false)
      setRobotChecked(true)
    }, 1200)
  }
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)

  const validate = () => {
    const e: typeof errors = {}
    if (!email.trim()) {
      e.email = '이메일을 입력해주세요.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = '올바른 이메일 형식이 아닙니다.'
    }
    if (!password) {
      e.password = '비밀번호를 입력해주세요.'
    } else if (password.length < 8) {
      e.password = '비밀번호는 8자 이상이어야 합니다.'
    }
    return e
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // 1. 변수 선언은 한 번만! 'unknown'을 거쳐 'Record<string, unknown>'으로 안전하게 변환
      const res = await login(email, password)

      if (res.refreshToken) localStorage.setItem('refreshToken', res.refreshToken)
      setAuth(res.userId, res.nickname, res.role, res.tokenBalance, res.accessToken)

      navigate('/')

    } catch (err: unknown) {
      console.error("로그인 에러 상세:", err);

      interface ApiError {
        response?: {
          data?: { error?: { code?: string } };
          status?: number;
        };
      }

      const error = err as ApiError;
      const code = error.response?.data?.error?.code;
      const status = error.response?.status;

      setFailCount(c => c + 1)
      setRobotChecked(false)
      setRobotChecking(false)

      if (status === 401 || code === 'INVALID_CREDENTIALS') {
        setErrors({ general: '이메일 또는 비밀번호가 올바르지 않습니다.' });
      } else if (code === 'USER_SUSPENDED') {
        setErrors({ general: '정지된 계정입니다. 고객센터에 문의해주세요.' });
      } else if (status === 429) {
        setErrors({ general: '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.' });
      } else {
        setErrors({ general: '아이디 또는 비밀번호가 틀립니다. 잠시 후 다시 시도해주세요.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.bg}>
      <style>{`
        @media (max-width: 700px) {
          .login-left { display: none !important; }
          .login-right { border-radius: 0 !important; }
        }
        @keyframes hueShift {
          0%   { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }
      `}</style>

      {/* 왼쪽 — 캐릭터 패널 */}
      <div className="login-left" style={{ ...s.left, position: 'relative' }}>

        {/* 끊김 없는 색상 흐름 배경 */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: 'linear-gradient(135deg, #fed7aa, #fecdd3, #f5d0fe, #bae6fd, #a7f3d0, #fef9c3)',
          animation: 'hueShift 14s linear infinite',
        }} />

        {/* 달걀·별 배경 패턴 */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.13, zIndex: 0 }}
          xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="egg-star-pattern" x="0" y="0" width="90" height="90" patternUnits="userSpaceOnUse">
              {/* 달걀 1 */}
              <ellipse cx="18" cy="22" rx="7" ry="9" fill="#f97316" transform="rotate(-12,18,22)" />
              {/* 달걀 2 */}
              <ellipse cx="65" cy="58" rx="6" ry="8" fill="#ec4899" transform="rotate(15,65,58)" />
              {/* 작은 달걀 */}
              <ellipse cx="42" cy="72" rx="4.5" ry="6" fill="#f59e0b" transform="rotate(-5,42,72)" />
              {/* 별 1 */}
              <text x="52" y="20" fontSize="13" fill="#f97316">✦</text>
              {/* 별 2 */}
              <text x="8"  y="68" fontSize="9"  fill="#ec4899">✦</text>
              {/* 별 3 */}
              <text x="72" y="36" fontSize="7"  fill="#f59e0b">★</text>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#egg-star-pattern)" />
        </svg>

        <div style={{ ...s.logo, position: 'relative', zIndex: 10 }} onClick={() => navigate('/')}>
          <img src="/Egag_logo-removebg.png" alt="EgAg" style={{ height: 200 }} />
        </div>
        <div style={{ position: 'relative', top: -95, zIndex: 1 }}>
          <AnimatedEye passwordFocused={passwordFocused} emailFocused={emailFocused} />
        </div>
      </div>

      {/* 오른쪽 — 폼 패널 */}
      <div className="login-right" style={s.right}>
        <div style={{ width: '100%', maxWidth: 400 }}>
        <h1 style={s.title}>로그인</h1>

        {errors.general && (
          <div style={s.errorBanner}>{errors.general}</div>
        )}

        <form onSubmit={handleSubmit} noValidate style={s.form}>
          <div style={s.field}>
            <label style={s.label}>이메일</label>
            <input
              style={{ ...s.input, ...(errors.email ? s.inputError : {}) }}
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })) }}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              autoFocus
              autoComplete="email"
            />
            {errors.email && <span style={s.fieldError}>{errors.email}</span>}
          </div>

          <div style={s.field}>
            <label style={s.label}>비밀번호</label>
            <input
              style={{ ...s.input, ...(errors.password ? s.inputError : {}) }}
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={e => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined })) }}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              autoComplete="current-password"
            />
            {errors.password && <span style={s.fieldError}>{errors.password}</span>}
          </div>

          {/* reCAPTCHA - 1회 실패 후 표시 */}
          {failCount >= 1 && (
            <>
              <style>{`
                @keyframes rc-spin1 { 0%{stroke-dashoffset:80} 50%{stroke-dashoffset:20} 100%{stroke-dashoffset:80} }
                @keyframes rc-rotate { to { transform: rotate(360deg) } }
                @keyframes rc-ripple { 0%{transform:scale(0);opacity:0.4} 100%{transform:scale(2.5);opacity:0} }
                @keyframes rc-check { 0%{stroke-dashoffset:30} 100%{stroke-dashoffset:0} }
              `}</style>
              <div style={{
                border: '1px solid #d3d3d3', borderRadius: 3,
                background: '#f9f9f9',
                boxShadow: '0 0 4px 1px rgba(0,0,0,0.08)',
                overflow: 'hidden',
                userSelect: 'none' as const,
              }}>
                {/* 메인 영역 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 0 12px', height: 74 }}>
                  {/* 왼쪽: 체크박스 + 텍스트 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {/* 체크박스 */}
                    <div
                      onClick={handleRobotCheck}
                      style={{ position: 'relative', width: 28, height: 28, cursor: robotChecked ? 'default' : 'pointer', flexShrink: 0 }}
                    >
                      {/* ripple */}
                      {robotChecking && (
                        <div style={{
                          position: 'absolute', inset: 0, borderRadius: '50%',
                          background: 'rgba(0,0,0,0.1)',
                          animation: 'rc-ripple 0.8s ease-out forwards',
                        }} />
                      )}
                      {/* 박스 */}
                      <div style={{
                        width: 28, height: 28, borderRadius: 2,
                        border: robotChecked ? 'none' : '2px solid #c1c1c1',
                        background: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxSizing: 'border-box' as const,
                      }}>
                        {robotChecking && (
                          <svg width="22" height="22" viewBox="0 0 22 22"
                            style={{ animation: 'rc-rotate 1s linear infinite', transformOrigin: '50% 50%' }}>
                            <circle cx="11" cy="11" r="9" fill="none" stroke="#e0e0e0" strokeWidth="2.5"/>
                            <circle cx="11" cy="11" r="9" fill="none" stroke="#4a90d9" strokeWidth="2.5"
                              strokeDasharray="56" strokeDashoffset="40" strokeLinecap="round"/>
                          </svg>
                        )}
                        {robotChecked && (
                          <svg width="28" height="28" viewBox="0 0 28 28">
                            <path d="M5 14l6 6L23 8"
                              stroke="#009900" strokeWidth="3"
                              strokeLinecap="round" strokeLinejoin="round" fill="none"
                              strokeDasharray="30" strokeDashoffset="0"
                              style={{ animation: 'rc-check 0.25s ease both' }}
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span style={{ fontSize: 14, color: '#333', fontWeight: 400 }}>로봇이 아닙니다.</span>
                  </div>

                  {/* 오른쪽: 브랜딩 */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    {/* 실제 reCAPTCHA 로고 */}
                    <svg width="38" height="38" viewBox="0 0 64 64">
                      <path d="M32 8 A24 24 0 1 1 11.2 44" fill="none" stroke="#4a90d9" strokeWidth="6" strokeLinecap="round"/>
                      <path d="M8 38 l4 8 l8 -4" fill="none" stroke="#4a90d9" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="32" cy="32" r="8" fill="#4a90d9"/>
                      <circle cx="32" cy="32" r="4" fill="#fff"/>
                    </svg>
                    <span style={{ fontSize: 8, color: '#555', fontWeight: 700, letterSpacing: 0.5 }}>reCAPTCHA</span>
                    <span style={{ fontSize: 7, color: '#999', letterSpacing: 0.2 }}>Privacy · Terms</span>
                  </div>
                </div>
              </div>
            </>
          )}

          <button
            style={{ ...s.btnEmail, opacity: (loading || (failCount >= 1 && !robotChecked)) ? 0.5 : 1, cursor: (failCount >= 1 && !robotChecked) ? 'not-allowed' : 'pointer' }}
            type="submit"
            disabled={loading || (failCount >= 1 && !robotChecked)}
          >
            {loading ? '로그인 중...' : '로그인하기'}
          </button>
        </form>

        <div style={s.divider}>
          <div style={s.dividerLine} />
          <span style={s.dividerText}>또는</span>
          <div style={s.dividerLine} />
        </div>

        <button style={s.btnKakao} onClick={() => window.location.href = '/api/auth/kakao'}>
          <svg width="20" height="20" viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
            <path fill="#3C1E1E" d="M10 2C5.582 2 2 4.91 2 8.5c0 2.29 1.522 4.3 3.816 5.435l-.973 3.56a.25.25 0 0 0 .378.277L9.64 15.19A9.5 9.5 0 0 0 10 15.2c4.418 0 8-2.91 8-6.5S14.418 2 10 2z"/>
          </svg>
          카카오톡으로 로그인
        </button>

        <div style={s.bottomLinks}>
          <Link to="/signup" style={s.link}>회원가입</Link>
          <span style={s.linkDot}>·</span>
          <Link to="/password-reset" style={s.link}>비밀번호 찾기</Link>
        </div>
        </div>
      </div>
    </div>
  )
}

// ─── 스타일 ──────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  bg: {
    minHeight: '100vh', display: 'flex',
    background: '#f5f5f5',
  },
  left: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '32px', gap: 4,
  },
  right: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: '#fff', padding: '52px 44px',
    boxShadow: '-4px 0 32px rgba(0,0,0,0.06)',
  },
  leftTitle: {
    margin: '8px 0 4px', fontSize: 26, fontWeight: 800,
    color: '#4c1d95', letterSpacing: -0.5,
    fontFamily: "'Jua', sans-serif",
  },
  leftDesc: {
    margin: 0, fontSize: 15, color: '#7c3aed',
    textAlign: 'center' as const, lineHeight: 1.7, opacity: 0.8,
    fontFamily: "'Jua', sans-serif",
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 8,
  },
  logoIcon: { fontSize: 24 },
  logoText: { fontSize: 20, fontWeight: 700, color: '#1D4ED8', letterSpacing: -0.5 },
  title: {
    fontSize: 24, fontWeight: 800, color: '#0F172A',
    margin: '0 0 24px', textAlign: 'center', width: '100%',
    letterSpacing: 1.5,
  },
  errorBanner: {
    width: '100%', boxSizing: 'border-box' as const, background: '#FEF2F2', border: '1px solid #FECACA',
    borderRadius: 10, padding: '12px 16px', fontSize: 14, color: '#DC2626',
    marginBottom: 16,
  },
  form: { width: '100%', display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' },
  label: { fontSize: 14, fontWeight: 600, color: '#374151' },
  input: {
    padding: '12px 14px', fontSize: 15, border: '2px solid #E2E8F0',
    borderRadius: 10, outline: 'none', width: '100%', boxSizing: 'border-box' as const,
    transition: 'border-color 0.15s',
  },
  inputError: { borderColor: '#EF4444' },
  fieldError: { fontSize: 13, color: '#EF4444' },
  btnEmail: {
    width: '100%', padding: '13px', fontSize: 15, fontWeight: 700,
    background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
    color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer',
    marginTop: 4,
  },
  divider: {
    display: 'flex', alignItems: 'center', gap: 12,
    width: '100%', margin: '20px 0',
  },
  dividerLine: { flex: 1, height: 1, background: '#E2E8F0' },
  dividerText: { fontSize: 13, color: '#94A3B8', whiteSpace: 'nowrap' as const },
  btnKakao: {
    width: '100%', padding: '13px', fontSize: 15, fontWeight: 700,
    background: '#FEE500', color: '#3C1E1E',
    border: 'none', borderRadius: 10, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  bottomLinks: {
    display: 'flex', alignItems: 'center', gap: 10,
    marginTop: 24, fontSize: 14,
  },
  link: { color: '#3B82F6', fontWeight: 600, textDecoration: 'none' },
  linkDot: { color: '#CBD5E1' },
}
