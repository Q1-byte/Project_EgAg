import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { completeOnboarding } from '../api/user'
import { useAuthStore } from '../stores/useAuthStore'

export default function KakaoOnboarding() {
  const navigate = useNavigate()
  const { nickname, setNeedsOnboarding } = useAuthStore()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string }>({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  const validate = () => {
    const e: typeof errors = {}
    if (!name.trim() || name.trim().length < 2) e.name = '이름은 2자 이상 입력해주세요.'
    const phoneRegex = /^010-\d{4}-\d{4}$/
    if (!phoneRegex.test(phone)) e.phone = '010-0000-0000 형식으로 입력해주세요.'
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = '올바른 이메일 형식을 입력해주세요.'
    return e
  }

  const handlePhoneChange = (v: string) => {
    const digits = v.replace(/\D/g, '')
    if (digits.length <= 3) setPhone(digits)
    else if (digits.length <= 7) setPhone(digits.slice(0, 3) + '-' + digits.slice(3))
    else setPhone(digits.slice(0, 3) + '-' + digits.slice(3, 7) + '-' + digits.slice(7, 11))
  }

  const handleSubmit = async () => {
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length > 0) return

    setLoading(true)
    setServerError('')
    try {
      await completeOnboarding({ name: name.trim(), phone, ...(email ? { email } : {}) })
      setNeedsOnboarding(false)
      navigate('/', { replace: true })
    } catch (err: any) {
      setServerError(err?.response?.data?.message || '저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.bg}>
      <div style={s.card}>
        <div style={s.kakaoIcon}>🟡</div>
        <h1 style={s.title}>추가 정보 입력</h1>
        <p style={s.subtitle}>
          <strong>{nickname}</strong>님, 카카오 계정으로 받지 못한 정보를 입력해주세요.
        </p>

        <div style={s.fieldGroup}>
          <label style={s.label}>이름 <span style={s.required}>*</span></label>
          <input
            style={{ ...s.input, ...(errors.name ? s.inputError : {}) }}
            placeholder="실명을 입력해주세요"
            value={name}
            onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: undefined })) }}
          />
          {errors.name && <p style={s.errorMsg}>{errors.name}</p>}
        </div>

        <div style={s.fieldGroup}>
          <label style={s.label}>전화번호 <span style={s.required}>*</span></label>
          <input
            style={{ ...s.input, ...(errors.phone ? s.inputError : {}) }}
            placeholder="010-0000-0000"
            value={phone}
            onChange={e => { handlePhoneChange(e.target.value); setErrors(p => ({ ...p, phone: undefined })) }}
            maxLength={13}
          />
          {errors.phone && <p style={s.errorMsg}>{errors.phone}</p>}
        </div>

        <div style={s.fieldGroup}>
          <label style={s.label}>이메일 <span style={s.optional}>(선택)</span></label>
          <input
            style={{ ...s.input, ...(errors.email ? s.inputError : {}) }}
            placeholder="카카오에서 이메일을 받지 못한 경우 입력"
            value={email}
            onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })) }}
          />
          {errors.email && <p style={s.errorMsg}>{errors.email}</p>}
        </div>

        {serverError && <div style={s.serverError}>{serverError}</div>}

        <button style={{ ...s.btn, opacity: loading ? 0.6 : 1 }} onClick={handleSubmit} disabled={loading}>
          {loading ? '저장 중...' : '완료하고 시작하기'}
        </button>

      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  bg: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #f5f0f8 0%, #ede8f2 40%, #f0eee9 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '24px',
  },
  card: {
    background: 'rgba(255,255,255,0.92)',
    borderRadius: 28, padding: '48px 40px',
    width: '100%', maxWidth: 460,
    boxShadow: '0 8px 40px rgba(107,130,160,0.13)',
    border: '1.5px solid rgba(255,255,255,0.8)',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  kakaoIcon: { fontSize: 48, marginBottom: 8 },
  title: {
    fontSize: 26, fontWeight: 800, margin: '0 0 8px',
    background: 'linear-gradient(135deg, #3a5a8a 0%, #c47a8a 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  },
  subtitle: { fontSize: 14, color: '#8a7a9a', margin: '0 0 32px', textAlign: 'center', lineHeight: 1.6 },
  fieldGroup: { width: '100%', marginBottom: 20 },
  label: { display: 'block', fontSize: 14, fontWeight: 600, color: '#4a4a6a', marginBottom: 6 },
  required: { color: '#c47a8a' },
  optional: { fontSize: 12, fontWeight: 400, color: '#9CA3AF' },
  input: {
    width: '100%', padding: '12px 14px', fontSize: 15,
    border: '1.5px solid rgba(107,130,160,0.25)', borderRadius: 12,
    outline: 'none', background: 'rgba(255,255,255,0.9)',
    boxSizing: 'border-box', color: '#3a3a5a',
  },
  inputError: { border: '1.5px solid #f87171' },
  errorMsg: { fontSize: 12, color: '#DC2626', margin: '4px 0 0' },
  serverError: {
    width: '100%', background: 'rgba(254,242,242,0.9)', border: '1px solid #FECACA',
    borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#DC2626',
    marginBottom: 16, boxSizing: 'border-box',
  },
  btn: {
    width: '100%', padding: '14px', fontSize: 16, fontWeight: 800,
    color: '#fff', border: 'none', borderRadius: 14, cursor: 'pointer',
    background: 'linear-gradient(135deg, #6B82A0, #c47a8a)',
    boxShadow: '0 4px 20px rgba(107,130,160,0.25)',
    marginBottom: 12,
  },
  skipBtn: {
    background: 'none', border: 'none', color: '#9CA3AF',
    fontSize: 13, cursor: 'pointer', fontWeight: 500,
  },
}
