import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../api/auth'
import { useAuthStore } from '../stores/useAuthStore'

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
      <div style={s.card}>
        {/* 로고 */}
        <div style={s.logo} onClick={() => navigate('/')}>
          <img src="/Egag_logo-removebg.png" alt="EgAg" style={{ height: 120 }} />
        </div>

        <h1 style={s.title}>로그인</h1>

        {/* 일반 오류 */}
        {errors.general && (
          <div style={s.errorBanner}>{errors.general}</div>
        )}

        <form onSubmit={handleSubmit} noValidate style={s.form}>
          {/* 이메일 */}
          <div style={s.field}>
            <label style={s.label}>이메일</label>
            <input
              style={{ ...s.input, ...(errors.email ? s.inputError : {}) }}
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })) }}
              autoFocus
              autoComplete="email"
            />
            {errors.email && <span style={s.fieldError}>{errors.email}</span>}
          </div>

          {/* 비밀번호 */}
          <div style={s.field}>
            <label style={s.label}>비밀번호</label>
            <input
              style={{ ...s.input, ...(errors.password ? s.inputError : {}) }}
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={e => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined })) }}
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

        {/* 구분선 */}
        <div style={s.divider}>
          <div style={s.dividerLine} />
          <span style={s.dividerText}>또는</span>
          <div style={s.dividerLine} />
        </div>

        {/* 카카오 로그인 */}
        <button style={s.btnKakao} onClick={() => window.location.href = '/api/auth/kakao'}>
          <svg width="20" height="20" viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
            <path fill="#3C1E1E" d="M10 2C5.582 2 2 4.91 2 8.5c0 2.29 1.522 4.3 3.816 5.435l-.973 3.56a.25.25 0 0 0 .378.277L9.64 15.19A9.5 9.5 0 0 0 10 15.2c4.418 0 8-2.91 8-6.5S14.418 2 10 2z"/>
          </svg>
          카카오톡으로 로그인
        </button>

        {/* 하단 링크 */}
        <div style={s.bottomLinks}>
          <Link to="/signup" style={s.link}>회원가입</Link>
          <span style={s.linkDot}>·</span>
          <Link to="/password-reset" style={s.link}>비밀번호 찾기</Link>
        </div>
      </div>
    </div>
  )
}

// ─── 스타일 ──────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  bg: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%)',
    padding: '24px 16px',
  },
  card: {
    background: '#fff', borderRadius: 24, padding: '22px 48px',
    boxShadow: '0 8px 32px rgba(59,130,246,0.10)',
    width: '100%', maxWidth: 440,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 14,
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
