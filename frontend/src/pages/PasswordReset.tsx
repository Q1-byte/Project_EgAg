import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { requestPasswordReset } from '../api/auth'

interface Form {
  name: string
  nickname: string
  email: string
}

interface Errors {
  name?: string
  nickname?: string
  email?: string
  general?: string
}

type Phase = 'form' | 'sent'

export default function PasswordReset() {
  const navigate = useNavigate()
  const [form, setForm] = useState<Form>({ name: '', nickname: '', email: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState<Phase>('form')

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }))
    setErrors(prev => ({ ...prev, [key]: undefined, general: undefined }))
  }

  const validate = (): Errors => {
    const e: Errors = {}
    if (!form.name.trim()) e.name = '이름을 입력해주세요.'
    if (!form.nickname.trim()) e.nickname = '별명을 입력해주세요.'
    if (!form.email.trim()) e.email = '이메일 주소를 입력해주세요.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = '올바른 이메일 형식이 아닙니다.'
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    setErrors({})
    try {
      await requestPasswordReset({ name: form.name, nickname: form.nickname, email: form.email })
      setPhase('sent')
    } catch (err: any) {
      const code = err.response?.data?.error?.code ?? ''
      if (code === 'NAME_MISMATCH') {
        setErrors({ name: '입력하신 이름이 계정 정보와 일치하지 않습니다.' })
      } else if (code === 'NICKNAME_MISMATCH') {
        setErrors({ nickname: '입력하신 별명이 계정 정보와 일치하지 않습니다.' })
      } else if (code === 'USER_NOT_FOUND') {
        setErrors({ email: '입력하신 이메일로 가입된 계정이 없습니다.' })
      } else if (code === 'INFO_MISMATCH') {
        setErrors({ general: '입력하신 정보가 가입 시 등록한 정보와 일치하지 않습니다. 이름, 별명, 이메일을 다시 확인해주세요.' })
      } else {
        setErrors({ general: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' })
      }
    } finally {
      setLoading(false)
    }
  }

  // ─── 이메일 발송 완료 화면 ───────────────────────────────
  if (phase === 'sent') {
    return (
      <div style={s.bg}>
        <style>{`
          .pr-btn-primary:hover { opacity: 0.88; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(59,130,246,0.35); }
          .pr-btn-primary:active { transform: translateY(0); }
          @media (max-width: 640px) {
            .pr-card { width: calc(100vw - 32px) !important; padding: 0 20px 32px !important; border-radius: 16px !important; }
            .pr-title { font-size: 18px !important; }
          }
          @media (min-width: 641px) and (max-width: 860px) {
            .pr-card { width: calc(100vw - 64px) !important; max-width: 440px !important; padding: 0 36px 40px !important; }
          }
        `}</style>
        <div style={s.card} className="pr-card">
          <div style={s.logo} onClick={() => navigate('/')} role="button">
            <img src="/Egag_logo-removebg.png" alt="EgAg" style={{ height: 64, marginTop: 40, marginBottom: 20 }} />
          </div>
          <h1 style={s.title} className="pr-title">이메일을 확인해주세요</h1>
          <p style={s.sentDesc}>
            <strong>{form.email}</strong>로<br />
            비밀번호 재설정 링크를 발송했습니다.<br />
            메일함을 확인해주세요.
          </p>
          <p style={s.sentNote}>
            메일이 오지 않는 경우 스팸함을 확인하거나<br />
            잠시 후 다시 시도해주세요.
          </p>
          <button className="pr-btn-primary" style={{ ...s.btnPrimary, flex: 'unset', width: '100%' }} onClick={() => navigate('/login')}>
            로그인으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  // ─── 입력 폼 화면 ───────────────────────────────────────
  return (
    <div style={s.bg}>
      <style>{`
        .pr-input:focus { border-color: #6B82A0 !important; box-shadow: 0 0 0 3px rgba(107,130,160,0.12); }
        .pr-input.error:focus { border-color: #EF4444 !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.1); }
        .pr-btn-secondary:hover { background: #f5f5f7 !important; color: #374151 !important; }
        .pr-btn-primary:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(59,130,246,0.35); }
        .pr-btn-primary:active { transform: translateY(0); }
        .pr-link:hover { color: #c47a8a !important; text-decoration: underline !important; }
        @media (max-width: 640px) {
          .pr-card { width: calc(100vw - 32px) !important; padding: 0 20px 32px !important; border-radius: 16px !important; }
          .pr-title { font-size: 18px !important; }
          .pr-btn-row { flex-direction: column !important; }
          .pr-btn-row .pr-btn-secondary { flex: unset !important; width: 100% !important; }
          .pr-btn-row .pr-btn-primary { flex: unset !important; width: 100% !important; }
        }
        @media (min-width: 641px) and (max-width: 860px) {
          .pr-card { width: calc(100vw - 64px) !important; max-width: 440px !important; padding: 0 36px 40px !important; }
        }
      `}</style>
      <div style={s.card} className="pr-card">
        <div style={s.logo} onClick={() => navigate('/')} role="button">
          <img src="/Egag_logo-removebg.png" alt="EgAg" style={{ height: 64, marginTop: 40, marginBottom: 20 }} />
        </div>

        <h1 style={s.title} className="pr-title">비밀번호 찾기</h1>
        <p style={s.subtitle}>가입 시 입력하신 정보를 입력해주세요.</p>

        {errors.general && <div style={s.errorBanner}>{errors.general}</div>}

        <form onSubmit={handleSubmit} noValidate style={s.form}>
          <div style={s.field}>
            <label style={s.label}>이름 <span style={s.required}>*</span></label>
            <input
              style={{ ...s.input, ...(errors.name ? s.inputError : {}) }}
              type="text" placeholder="홍길동" value={form.name}
              onChange={set('name')} maxLength={20}
            />
            {errors.name && <span style={s.fieldError}>{errors.name}</span>}
          </div>

          <div style={s.field}>
            <label style={s.label}>별명 <span style={s.required}>*</span></label>
            <input
              style={{ ...s.input, ...(errors.nickname ? s.inputError : {}) }}
              type="text" placeholder="가입 시 사용한 별명" value={form.nickname}
              onChange={set('nickname')} maxLength={12}
            />
            {errors.nickname && <span style={s.fieldError}>{errors.nickname}</span>}
          </div>

          <div style={s.field}>
            <label style={s.label}>이메일 주소 <span style={s.required}>*</span></label>
            <input
              style={{ ...s.input, ...(errors.email ? s.inputError : {}) }}
              type="email" placeholder="example@email.com" value={form.email}
              onChange={set('email')} autoComplete="email"
            />
            {errors.email && <span style={s.fieldError}>{errors.email}</span>}
          </div>

          <div style={s.btnRow} className="pr-btn-row">
            <button className="pr-btn-secondary" style={s.btnSecondary} type="button" onClick={() => navigate('/')}>
              취소
            </button>
            <button
              className="pr-btn-primary"
              style={{ ...s.btnPrimary, opacity: loading ? 0.7 : 1 }}
              type="submit" disabled={loading}
            >
              {loading ? '확인 중...' : '인증 메일 발송'}
            </button>
          </div>
        </form>

        <p style={s.bottomText}>
          비밀번호가 기억나셨나요?{' '}
          <Link to="/login" className="pr-link" style={s.link}>로그인</Link>
        </p>
      </div>
    </div>
  )
}

// ─── 스타일 ──────────────────────────────────────────────
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
  title: { fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '0 0 8px', letterSpacing: 1 },
  subtitle: { fontSize: 14, color: '#64748B', margin: '0 0 24px', textAlign: 'center' as const },
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
    transition: 'border-color 0.15s',
  },
  inputError: { borderColor: '#EF4444' },
  fieldError: { fontSize: 13, color: '#EF4444' },
  btnRow: { display: 'flex', gap: 10, marginTop: 4 },
  btnSecondary: {
    flex: '0 0 auto', padding: '13px 20px', fontSize: 15, fontWeight: 600,
    background: '#fff', color: '#6b7280',
    border: '1.5px solid #e5e7eb', borderRadius: 10, cursor: 'pointer',
    whiteSpace: 'nowrap' as const, transition: 'all 0.15s',
  },
  btnPrimary: {
    flex: 1, padding: '13px', fontSize: 16, fontWeight: 700,
    background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
    color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer',
    transition: 'all 0.18s',
  },
  bottomText: { fontSize: 14, color: '#64748B', marginTop: 20, textAlign: 'center' as const },
  link: { color: '#6B82A0', fontWeight: 600, textDecoration: 'none', transition: 'color 0.15s' },
  sentIcon: { fontSize: 56, marginBottom: 56 },
  sentDesc: {
    fontSize: 15, color: '#334155', textAlign: 'center' as const,
    lineHeight: 1.8, margin: '0 0 12px',
  },
  sentNote: {
    fontSize: 13, color: '#94A3B8', textAlign: 'center' as const,
    lineHeight: 1.7, margin: '0 0 28px',
  },
}
