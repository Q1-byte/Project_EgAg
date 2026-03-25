import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { confirmPasswordReset } from '../api/auth'

type Phase = 'form' | 'done' | 'invalid'

export default function PasswordResetConfirm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [newPassword, setNewPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [errors, setErrors] = useState<{ newPassword?: string; passwordConfirm?: string; general?: string }>({})
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState<Phase>('form')

  useEffect(() => {
    if (!token) setPhase('invalid')
  }, [token])

  const validate = () => {
    const e: typeof errors = {}
    if (!newPassword) e.newPassword = '새 비밀번호를 입력해주세요.'
    else if (newPassword.length < 8) e.newPassword = '비밀번호는 8자 이상이어야 합니다.'
    else if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword))
      e.newPassword = '비밀번호는 영문과 숫자를 모두 포함해야 합니다.'
    if (!passwordConfirm) e.passwordConfirm = '비밀번호 확인을 입력해주세요.'
    else if (newPassword !== passwordConfirm) e.passwordConfirm = '비밀번호가 일치하지 않습니다.'
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    setErrors({})
    try {
      await confirmPasswordReset({ token, newPassword })
      setPhase('done')
    } catch (err: any) {
      const code = err.response?.data?.error?.code ?? ''
      if (code === 'TOKEN_EXPIRED') {
        setErrors({ general: '링크가 만료됐습니다. 비밀번호 찾기를 다시 시도해주세요.' })
      } else if (code === 'TOKEN_ALREADY_USED') {
        setErrors({ general: '이미 사용된 링크입니다. 비밀번호 찾기를 다시 시도해주세요.' })
      } else if (code === 'INVALID_TOKEN') {
        setPhase('invalid')
      } else if (code === 'INVALID_PASSWORD') {
        setErrors({ newPassword: '비밀번호는 영문과 숫자를 모두 포함해야 합니다.' })
      } else {
        setErrors({ general: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' })
      }
    } finally {
      setLoading(false)
    }
  }

  // ─── 완료 화면 ───────────────────────────────────────────
  if (phase === 'done') {
    return (
      <div style={s.bg}>
        <style>{`
          @media (max-width: 640px) {
            .prc-card { width: calc(100vw - 32px) !important; padding: 0 20px 32px !important; border-radius: 16px !important; }
            .prc-title { font-size: 18px !important; }
          }
          @media (min-width: 641px) and (max-width: 860px) {
            .prc-card { width: calc(100vw - 64px) !important; max-width: 440px !important; padding: 0 36px 40px !important; }
          }
        `}</style>
        <div style={s.card} className="prc-card">
          <div style={s.logo} onClick={() => navigate('/')} role="button">
            <img src="/Egag_logo-removebg.png" alt="EgAg" style={{ height: 64, marginTop: 40, marginBottom: 20 }} />
          </div>
          <h1 style={s.title} className="prc-title">비밀번호가 변경됐습니다</h1>
          <p style={s.desc}>새 비밀번호로 로그인해주세요.</p>
          <button style={s.btnPrimary} onClick={() => navigate('/login')}>
            로그인하러 가기
          </button>
        </div>
      </div>
    )
  }

  // ─── 유효하지 않은 토큰 화면 ─────────────────────────────
  if (phase === 'invalid') {
    return (
      <div style={s.bg}>
        <style>{`
          @media (max-width: 640px) {
            .prc-card { width: calc(100vw - 32px) !important; padding: 0 20px 32px !important; border-radius: 16px !important; }
            .prc-title { font-size: 18px !important; }
          }
          @media (min-width: 641px) and (max-width: 860px) {
            .prc-card { width: calc(100vw - 64px) !important; max-width: 440px !important; padding: 0 36px 40px !important; }
          }
        `}</style>
        <div style={s.card} className="prc-card">
          <div style={s.logo} onClick={() => navigate('/')} role="button">
            <img src="/Egag_logo-removebg.png" alt="EgAg" style={{ height: 64, marginTop: 40, marginBottom: 20 }} />
          </div>
          <div style={s.bigIcon}>⚠️</div>
          <h1 style={s.title} className="prc-title">유효하지 않은 링크</h1>
          <p style={s.desc}>링크가 만료되었거나 이미 사용된 링크입니다.</p>
          <button style={s.btnPrimary} onClick={() => navigate('/password-reset')}>
            비밀번호 찾기 다시 시도
          </button>
        </div>
      </div>
    )
  }

  // ─── 비밀번호 입력 폼 ────────────────────────────────────
  return (
    <div style={s.bg}>
      <style>{`
        @media (max-width: 640px) {
          .prc-card { width: calc(100vw - 32px) !important; padding: 0 20px 32px !important; border-radius: 16px !important; }
          .prc-title { font-size: 18px !important; }
        }
        @media (min-width: 641px) and (max-width: 860px) {
          .prc-card { width: calc(100vw - 64px) !important; max-width: 440px !important; padding: 0 36px 40px !important; }
        }
      `}</style>
      <div style={s.card} className="prc-card">
        <div style={s.logo} onClick={() => navigate('/')} role="button">
          <img src="/Egag_logo-removebg.png" alt="EgAg" style={{ height: 64, marginTop: 40, marginBottom: 20 }} />
        </div>

        <h1 style={s.title} className="prc-title">새 비밀번호 설정</h1>
        <p style={s.subtitle}>사용할 새 비밀번호를 입력해주세요.</p>

        {errors.general && <div style={s.errorBanner}>{errors.general}</div>}

        <form onSubmit={handleSubmit} noValidate style={s.form}>
          <div style={s.field}>
            <label style={s.label}>새 비밀번호 <span style={s.required}>*</span></label>
            <input
              style={{ ...s.input, ...(errors.newPassword ? s.inputError : {}) }}
              type="password" placeholder="영문+숫자 8자 이상"
              value={newPassword} onChange={e => { setNewPassword(e.target.value); setErrors(p => ({ ...p, newPassword: undefined })) }}
              autoComplete="new-password"
            />
            {errors.newPassword && <span style={s.fieldError}>{errors.newPassword}</span>}
          </div>

          <div style={s.field}>
            <label style={s.label}>비밀번호 확인 <span style={s.required}>*</span></label>
            <input
              style={{ ...s.input, ...(errors.passwordConfirm ? s.inputError : {}) }}
              type="password" placeholder="비밀번호를 다시 입력하세요"
              value={passwordConfirm} onChange={e => { setPasswordConfirm(e.target.value); setErrors(p => ({ ...p, passwordConfirm: undefined })) }}
              autoComplete="new-password"
            />
            {errors.passwordConfirm && <span style={s.fieldError}>{errors.passwordConfirm}</span>}
          </div>

          <button
            style={{ ...s.btnPrimary, opacity: loading ? 0.7 : 1 }}
            type="submit" disabled={loading}
          >
            {loading ? '변경 중...' : '비밀번호 변경'}
          </button>
        </form>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  bg: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%)',
    padding: '32px 16px',
  },
  card: {
    background: '#fff', borderRadius: 24, padding: '0px 48px 44px',
    boxShadow: '0 8px 32px rgba(59,130,246,0.10)',
    width: '100%', maxWidth: 440,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  logo: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 0 },
  logoIcon: { fontSize: 24 },
  logoText: { fontSize: 20, fontWeight: 700, color: '#1D4ED8', letterSpacing: -0.5 },
  bigIcon: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '0 0 8px', textAlign: 'center' as const, letterSpacing: 1.5 },
  subtitle: { fontSize: 14, color: '#64748B', margin: '0 0 24px', textAlign: 'center' as const },
  desc: { fontSize: 15, color: '#475569', margin: '0 0 28px', textAlign: 'center' as const },
  errorBanner: {
    width: '100%', background: '#FEF2F2', border: '1px solid #FECACA',
    borderRadius: 10, padding: '12px 16px', fontSize: 14, color: '#DC2626',
    marginBottom: 16, lineHeight: 1.6, boxSizing: 'border-box' as const,
  },
  form: { width: '100%', display: 'flex', flexDirection: 'column', gap: 18 },
  field: { display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-start' },
  label: { fontSize: 14, fontWeight: 600, color: '#374151' },
  required: { color: '#EF4444' },
  input: {
    padding: '11px 14px', fontSize: 15, border: '2px solid #E2E8F0',
    borderRadius: 10, outline: 'none', width: '100%', boxSizing: 'border-box' as const,
  },
  inputError: { borderColor: '#EF4444' },
  fieldError: { fontSize: 13, color: '#EF4444' },
  btnPrimary: {
    width: '100%', padding: '13px', fontSize: 16, fontWeight: 700,
    background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
    color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', marginTop: 4,
  },
}
