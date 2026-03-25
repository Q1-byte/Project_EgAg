import axios from 'axios';
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signup } from '../api/auth'
import { checkNicknameAvailable } from '../api/user'
import { useAuthStore } from '../stores/useAuthStore'
import { AlertTriangle } from 'lucide-react'

interface Form {
  name: string
  nickname: string
  email: string
  phone: string
  password: string
  passwordConfirm: string
  agreePrivacy: boolean
  agreeTerms: boolean
}

interface Errors {
  name?: string
  nickname?: string
  email?: string
  phone?: string
  password?: string
  passwordConfirm?: string
  agreePrivacy?: string
  agreeTerms?: string
  general?: string
}

export default function Signup() {
  const navigate = useNavigate()
  const setAuth = useAuthStore(s => s.setAuth)

  const [form, setForm] = useState<Form>({
    name: '', nickname: '', email: '', phone: '',
    password: '', passwordConfirm: '', agreePrivacy: false, agreeTerms: false,
  })
  const [errors, setErrors] = useState<Errors>({})
  const [loading, setLoading] = useState(false)
  const [nicknameChecked, setNicknameChecked] = useState<boolean | null>(null)
  const [nicknameChecking, setNicknameChecking] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [termsOpen, setTermsOpen] = useState(false)
  const [alertMessages, setAlertMessages] = useState<string[]>([])

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, '').slice(0, 12)
    setForm(prev => ({ ...prev, nickname: value }))
    setErrors(prev => ({ ...prev, nickname: undefined }))
    setNicknameChecked(null)
  }

  const handleCheckNickname = async () => {
    if (!form.nickname.trim()) return
    setNicknameChecking(true)
    try {
      const available = await checkNicknameAvailable(form.nickname.trim())
      setNicknameChecked(available)
    } catch {
      setNicknameChecked(null)
    } finally {
      setNicknameChecking(false)
    }
  }

  const formatPhone = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 11)
    let formatted = digits
    if (digits.length > 7) formatted = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
    else if (digits.length > 3) formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`
    setForm(prev => ({ ...prev, phone: formatted }))
    setErrors(prev => ({ ...prev, phone: undefined }))
  }

  const validate = (): Errors => {
    const e: Errors = {}
    if (!form.name.trim()) e.name = '이름을 입력해주세요.'
    else if (form.name.trim().length < 2) e.name = '이름은 2자 이상이어야 합니다.'

    if (!form.nickname.trim()) e.nickname = '별명을 입력해주세요.'
    else if (form.nickname.trim().length < 2) e.nickname = '별명은 2자 이상이어야 합니다.'
    else if (form.nickname.trim().length > 12) e.nickname = '별명은 12자 이하이어야 합니다.'

    if (!form.email.trim()) e.email = '이메일 주소를 입력해주세요.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = '올바른 이메일 형식이 아닙니다.'

    if (!form.phone.trim()) e.phone = '전화번호를 입력해주세요.'
    else if (!/^01[0-9]{8,9}$/.test(form.phone.replace(/-/g, ''))) e.phone = '올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)'

    if (!form.password) e.password = '비밀번호를 입력해주세요.'
    else if (form.password.length < 8) e.password = '비밀번호는 8자 이상이어야 합니다.'
    else if (!/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password)) e.password = '비밀번호는 영문과 숫자를 모두 포함해야 합니다.'

    if (!form.passwordConfirm) e.passwordConfirm = '비밀번호 확인을 입력해주세요.'
    else if (form.password !== form.passwordConfirm) e.passwordConfirm = '비밀번호가 일치하지 않습니다.'

    if (!form.agreePrivacy) e.agreePrivacy = '개인정보 수집 및 이용에 동의해주세요.'
    if (!form.agreeTerms) e.agreeTerms = '콘텐츠 생성 및 이용 약관에 동의해주세요.'

    return e
  }

  const FIELD_LABELS: Record<string, string> = {
    name: '이름',
    nickname: '별명',
    email: '이메일 주소',
    phone: '전화번호',
    password: '비밀번호',
    passwordConfirm: '비밀번호 확인',
    agreePrivacy: '개인정보 수집 및 이용 동의',
    agreeTerms: '콘텐츠 생성 및 이용 약관 동의',
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      setAlertMessages(Object.keys(errs).filter(k => k !== 'general').map(k => FIELD_LABELS[k] ?? k))
      return
    }

    setLoading(true)
    setErrors({})
    try {
      const res = await signup({
        name: form.name, nickname: form.nickname,
        email: form.email, phone: form.phone, password: form.password,
      })
      if (res.refreshToken) localStorage.setItem('refreshToken', res.refreshToken)
      setAuth(res.userId, res.nickname, res.role, res.tokenBalance, res.accessToken);
      navigate('/')
    } catch (err: unknown) {
      // ✅ Axios 에러인지 확인하여 any 제거
      if (axios.isAxiosError(err)) {
        const code = err.response?.data?.error?.code ?? '';

        if (code === 'EMAIL_DUPLICATED') {
          setErrors({ email: '이미 사용 중인 이메일입니다.' });
        } else if (code === 'NICKNAME_DUPLICATED') {
          setErrors({ nickname: '이미 사용 중인 별명입니다.' });
        } else {
          setErrors({ general: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' });
        }
      } else {
        // Axios 에러가 아닌 일반 에러 처리
        setErrors({ general: '네트워크 연결을 확인해주세요.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.bg}>
      <style>{`
        .signup-input:focus { border-color: #6B82A0 !important; box-shadow: 0 0 0 3px rgba(107,130,160,0.12); }
        .signup-input.error:focus { border-color: #e53e3e !important; box-shadow: 0 0 0 3px rgba(229,62,62,0.1); }
        .signup-input.ok:focus { border-color: #22c55e !important; box-shadow: 0 0 0 3px rgba(34,197,94,0.1); }
        .signup-check-btn:hover:not(:disabled) { border-color: #6B82A0 !important; color: #6B82A0 !important; background: #f0f4f8 !important; }
        .signup-check-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .signup-btn-primary:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(107,130,160,0.35); }
        .signup-btn-primary:active { transform: translateY(0); }
        .signup-btn-secondary:hover { background: #f5f5f7 !important; color: #374151 !important; }
        .signup-toggle-btn:hover { color: #6B82A0 !important; }
        .signup-login-link:hover { color: #c47a8a !important; text-decoration: underline !important; }
        @media (max-width: 860px) {
          .signup-left { display: none !important; }
          .signup-right { border-radius: 0 !important; width: 100% !important; padding: 48px 28px !important; }
          .signup-layout { min-height: 100vh !important; }
        }
      `}</style>

      {/* 미입력 안내 모달 */}
      {alertMessages.length > 0 && (
        <div style={s.modalOverlay} onClick={() => setAlertMessages([])}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <div style={s.modalTitle}><AlertTriangle size={18} style={{ marginRight: 6, verticalAlign: 'middle', color: '#F59E0B' }} />입력하지 않은 항목이 있어요</div>
            <ul style={s.modalList}>
              {alertMessages.map((msg, i) => (
                <li key={i} style={s.modalItem}>· {msg}</li>
              ))}
            </ul>
            <button style={s.modalBtn} onClick={() => setAlertMessages([])}>확인</button>
          </div>
        </div>
      )}

      <div style={s.layout} className="signup-layout">
        {/* 왼쪽 브랜딩 패널 */}
        <div style={s.panel} className="signup-left">
          <div style={s.panelInner}>
            <img src="/Egag_logo-removebg.png" alt="EgAg" style={{ height: 80, marginBottom: 48 }} />
            <h2 style={{ margin: '0 0 20px', fontSize: 28, fontWeight: 800, letterSpacing: -0.5, color: '#fff' }}>창작의 공간,<br />이그에그</h2>
            <p style={{ margin: 0, fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7 }}>그림을 그리고, 공유하고,<br />영감을 나눠보세요.</p>
          </div>
        </div>

        {/* 오른쪽 폼 패널 */}
        <div style={s.card} className="signup-right">
          <div style={s.titleArea}>
            <h1 style={s.title}>회원가입</h1>
            <p style={s.subtitle}>계정을 만들고 창작을 시작하세요</p>
          </div>

          {errors.general && <div style={s.errorBanner}>{errors.general}</div>}

        <form onSubmit={handleSubmit} noValidate style={s.form}>

          {/* 이름 */}
          <div style={s.field}>
            <label style={s.label}>이름 <span style={s.required}>*</span></label>
            <input
              className={`signup-input${errors.name ? ' error' : ''}`}
              style={{ ...s.input, ...(errors.name ? s.inputError : {}) }}
              type="text" placeholder="홍길동" value={form.name}
              onChange={set('name')} maxLength={20}
            />
            {errors.name && <span style={s.fieldError}>{errors.name}</span>}
          </div>

          {/* 별명 */}
          <div style={s.field}>
            <label style={s.label}>별명 <span style={s.required}>*</span></label>
            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
              <input
                className={`signup-input${errors.nickname ? ' error' : nicknameChecked === true ? ' ok' : nicknameChecked === false ? ' error' : ''}`}
                style={{ ...s.input, ...(errors.nickname ? s.inputError : nicknameChecked === true ? { borderColor: '#22c55e' } : nicknameChecked === false ? { borderColor: '#ef4444' } : {}), flex: 1, width: 0 }}
                type="text" placeholder="2~12자" value={form.nickname}
                onChange={handleNicknameChange} maxLength={12}
              />
              <button type="button" className="signup-check-btn" onClick={handleCheckNickname}
                disabled={nicknameChecking || !form.nickname.trim()}
                style={{
                  padding: '0 16px', borderRadius: 10, border: '1.5px solid #d1d5db',
                  background: '#f9fafb', fontSize: 13, fontWeight: 700, color: '#6b7280',
                  cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                  transition: 'all 0.15s',
                }}
              >
                {nicknameChecking ? '확인 중...' : '중복확인'}
              </button>
            </div>
            {nicknameChecked === true && <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>✓ 사용 가능한 별명이에요!</span>}
            {nicknameChecked === false && <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>이미 사용 중인 별명이에요.</span>}
            {errors.nickname && <span style={s.fieldError}>{errors.nickname}</span>}
          </div>

          {/* 이메일 */}
          <div style={s.field}>
            <label style={s.label}>이메일 주소 <span style={s.required}>*</span></label>
            <input
              className={`signup-input${errors.email ? ' error' : ''}`}
              style={{ ...s.input, ...(errors.email ? s.inputError : {}) }}
              type="email" placeholder="example@email.com" value={form.email}
              onChange={set('email')} autoComplete="email"
            />
            {errors.email && <span style={s.fieldError}>{errors.email}</span>}
          </div>

          {/* 전화번호 */}
          <div style={s.field}>
            <label style={s.label}>전화번호 <span style={s.required}>*</span></label>
            <input
              className={`signup-input${errors.phone ? ' error' : ''}`}
              style={{ ...s.input, ...(errors.phone ? s.inputError : {}) }}
              type="tel" placeholder="010-1234-5678" value={form.phone}
              onChange={formatPhone} maxLength={13}
            />
            {errors.phone && <span style={s.fieldError}>{errors.phone}</span>}
          </div>

          {/* 비밀번호 */}
          <div style={s.field}>
            <label style={s.label}>비밀번호 <span style={s.required}>*</span></label>
            <input
              className={`signup-input${errors.password ? ' error' : ''}`}
              style={{ ...s.input, ...(errors.password ? s.inputError : {}) }}
              type="password" placeholder="영문+숫자 8자 이상" value={form.password}
              onChange={set('password')} autoComplete="new-password"
            />
            {errors.password && <span style={s.fieldError}>{errors.password}</span>}
          </div>

          {/* 비밀번호 확인 */}
          <div style={s.field}>
            <label style={s.label}>비밀번호 확인 <span style={s.required}>*</span></label>
            <input
              className={`signup-input${errors.passwordConfirm ? ' error' : ''}`}
              style={{ ...s.input, ...(errors.passwordConfirm ? s.inputError : {}) }}
              type="password" placeholder="비밀번호를 다시 입력하세요" value={form.passwordConfirm}
              onChange={set('passwordConfirm')} autoComplete="new-password"
            />
            {errors.passwordConfirm && <span style={s.fieldError}>{errors.passwordConfirm}</span>}
          </div>

          {/* 개인정보 수집 동의 */}
          <div style={s.privacyBox}>
            <div style={s.privacyHeader}>
              <label style={s.checkLabel}>
                <input
                  type="checkbox" checked={form.agreePrivacy}
                  onChange={set('agreePrivacy')} style={s.checkbox}
                />
                <span style={s.checkText}>
                  <strong>개인정보 수집 및 이용에 동의합니다</strong>
                  <span style={s.required}> *</span>
                </span>
              </label>
              <button type="button" className="signup-toggle-btn" style={s.toggleBtn} onClick={() => setPrivacyOpen(v => !v)}>
                {privacyOpen ? '접기 ▲' : '내용 보기 ▼'}
              </button>
            </div>

            {privacyOpen && (
              <div style={s.privacyContent}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>수집 항목</th>
                      <th style={s.th}>수집 목적</th>
                      <th style={s.th}>보유 기간</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={s.td}>이름, 별명</td>
                      <td style={s.td}>서비스 이용 및 회원 식별</td>
                      <td style={s.td} rowSpan={3}>회원 탈퇴 시까지</td>
                    </tr>
                    <tr>
                      <td style={s.td}>이메일 주소</td>
                      <td style={s.td}>로그인, 공지 및 알림 발송</td>
                    </tr>
                    <tr>
                      <td style={s.td}>전화번호</td>
                      <td style={s.td}>본인 확인 및 계정 복구</td>
                    </tr>
                    <tr>
                      <td style={s.td}>비밀번호 (암호화)</td>
                      <td style={s.td}>계정 보안</td>
                      <td style={s.td}>회원 탈퇴 시까지</td>
                    </tr>
                  </tbody>
                </table>
                <p style={s.privacyNote}>
                  위 항목의 수집을 거부할 권리가 있으나, 거부 시 서비스 이용이 제한될 수 있습니다.
                </p>
              </div>
            )}

            {errors.agreePrivacy && <span style={s.fieldError}>{errors.agreePrivacy}</span>}
          </div>

          {/* 콘텐츠 생성 및 이용 약관 동의 */}
          <div style={s.privacyBox}>
            <div style={s.privacyHeader}>
              <label style={s.checkLabel}>
                <input
                  type="checkbox" checked={form.agreeTerms}
                  onChange={set('agreeTerms')} style={s.checkbox}
                />
                <span style={s.checkText}>
                  <strong>콘텐츠 생성 및 이용 약관에 동의합니다</strong>
                  <span style={s.required}> *</span>
                </span>
              </label>
              <button type="button" style={s.toggleBtn} onClick={() => setTermsOpen(v => !v)}>
                {termsOpen ? '접기 ▲' : '내용 보기 ▼'}
              </button>
            </div>

            {termsOpen && (
              <div style={s.privacyContent}>
                <div style={s.termsText}>
                  <p style={s.termsTitle}>콘텐츠 생성 및 이용 약관 (안)</p>
                  <p style={s.termsDesc}>본 약관은 [서비스명]에서 제공하는 동화 제작 서비스 및 아동이 직접 그린 그림(이하 '콘텐츠')의 이용과 관련하여 필요한 사항을 안내합니다.</p>

                  <p style={s.termsSectionTitle}>1. 콘텐츠의 저작권 및 이용 권한</p>
                  <p style={s.termsItem}><strong>저작권 귀속:</strong> 아동이 직접 그린 모든 그림의 저작권은 원칙적으로 제작자(아동 및 법정대리인)에게 있습니다.</p>
                  <p style={s.termsItem}><strong>서비스 내 활용:</strong> 사용자가 생성한 그림은 해당 동화의 구성 요소로 포함되며, 서비스 내에서 동화 감상 및 보관 목적으로 사용됩니다.</p>
                  <p style={s.termsItem}><strong>보관 및 노출:</strong> 사용자가 '저장' 또는 '공유' 기능을 선택할 경우, 해당 콘텐츠는 서비스 데이터베이스에 저장되며 서비스 내 피드 등에 노출될 수 있습니다.</p>
                  <p style={s.termsItem}><strong>서비스 내 이용 권한 부여:</strong> 이용자가 본 서비스를 통해 생성한 그림(이하 '이용자 창작물')의 저작권은 이용자 본인에게 귀속됩니다. 다만, 이용자는 본 서비스를 이용함으로써, 자신이 생성한 이용자 창작물에 대해 서비스 운영자가 본 서비스의 운영·홍보·개선 등의 목적으로 서비스 내에서 자유롭게 사용할 수 있는 비독점적이고 무상의 라이선스를 부여하는 것에 동의한 것으로 봅니다.</p>
                  <p style={s.termsItem}><strong>동의 거부 시 제한:</strong> 위 서비스 내 이용 권한 부여에 동의하지 아니하실 경우, 본 서비스의 회원가입 및 이용이 제한됩니다.</p>

                  <p style={s.termsSectionTitle}>2. 법정대리인의 동의</p>
                  <p style={s.termsItem}>본 서비스는 만 14세 미만 아동의 창작 활동을 포함하므로, 서비스 이용 시 보호자(법정대리인)의 동의가 반드시 필요합니다.</p>
                  <p style={s.termsItem}>보호자는 아동이 부적절한 이미지(개인정보가 노출된 그림, 타인의 저작권을 침해하는 그림 등)를 생성하지 않도록 지도할 책임이 있습니다.</p>

                  <p style={s.termsSectionTitle}>3. 개인정보 수집 및 이용 (선택/필수)</p>
                  <p style={s.termsItem}><strong>수집 항목:</strong> 아동이 그린 그림 데이터, 동화 텍스트 정보.</p>
                  <p style={s.termsItem}><strong>이용 목적:</strong> 나만의 동화 완성 및 저장, 서비스 개선을 위한 데이터 분석.</p>
                  <p style={s.termsItem}><strong>보유 기간:</strong> 회원 탈퇴 시 혹은 서비스 종료 시까지 (단, 관계 법령에 따라 보관이 필요한 경우 해당 기간까지).</p>

                  <p style={s.termsSectionTitle}>4. 이용자 주의사항</p>
                  <p style={s.termsItem}>타인의 저작물을 무단으로 모방하여 그리거나, 개인정보(이름, 전화번호 등)를 그림에 직접 기입하지 않도록 주의해 주세요.</p>
                  <p style={s.termsItem}>부적절한 내용이 포함된 그림은 관리자에 의해 삭제되거나 서비스 이용이 제한될 수 있습니다.</p>
                </div>
              </div>
            )}

            {errors.agreeTerms && <span style={s.fieldError}>{errors.agreeTerms}</span>}
          </div>

          <div style={s.btnRow}>
            <button
              className="signup-btn-secondary"
              style={s.btnSecondary}
              type="button"
              onClick={() => navigate('/')}
            >
              취소
            </button>
            <button
              className="signup-btn-primary"
              style={{ ...s.btnPrimary, opacity: loading ? 0.7 : 1 }}
              type="submit" disabled={loading}
            >
              {loading ? '가입 중...' : '회원가입'}
            </button>
          </div>
        </form>

        <p style={s.loginText}>
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="signup-login-link" style={s.loginLink}>로그인</Link>
        </p>
        </div>
      </div>
    </div>
  )
}

// ─── 스타일 ──────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  bg: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%)', padding: '32px 16px',
  },
  layout: {
    display: 'flex', width: '100%', maxWidth: 900,
    borderRadius: 20, overflow: 'hidden',
    boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
    minHeight: 600,
  },
  panel: {
    flex: '0 0 340px',
    background: 'linear-gradient(160deg, #6B82A0 0%, #c47a8a 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '48px 40px', position: 'relative', overflow: 'hidden',
  },
  panelInner: {
    position: 'relative', zIndex: 1,
    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
  },
  card: {
    flex: 1, background: '#fff', padding: '44px 48px',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    overflowY: 'auto' as const,
  },
  titleArea: { width: '100%', marginBottom: 28, textAlign: 'left' as const },
  title: { fontSize: 24, fontWeight: 800, color: '#111827', margin: '0 0 6px', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#9ca3af', margin: 0 },
  errorBanner: {
    width: '100%', background: '#fff0f0', border: '1px solid #ffd0d0',
    borderRadius: 10, padding: '12px 16px', fontSize: 14, color: '#e53e3e', marginBottom: 16,
  },
  form: { width: '100%', display: 'flex', flexDirection: 'column', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-start' },
  label: { fontSize: 13, fontWeight: 600, color: '#374151', letterSpacing: -0.1 },
  required: { color: '#e53e3e' },
  input: {
    padding: '11px 14px', fontSize: 15,
    background: '#fafafa',
    border: '1.5px solid #e5e7eb',
    color: '#111',
    borderRadius: 10, outline: 'none', width: '100%', boxSizing: 'border-box' as const,
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  inputError: { borderColor: '#e53e3e' },
  fieldError: { fontSize: 12, color: '#e53e3e' },
  privacyBox: {
    width: '100%', background: '#f9fafb', border: '1.5px solid #e5e7eb',
    borderRadius: 12, padding: '12px 16px',
    display: 'flex', flexDirection: 'column', gap: 10,
    boxSizing: 'border-box' as const,
  },
  privacyHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  checkLabel: { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' },
  checkbox: { width: 17, height: 17, accentColor: '#6B82A0', cursor: 'pointer', flexShrink: 0 },
  checkText: { fontSize: 14, color: '#374151' },
  toggleBtn: {
    fontSize: 12, color: '#9ca3af', background: 'none',
    border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' as const, flexShrink: 0,
  },
  privacyContent: {
    borderTop: '1px solid #e5e7eb', paddingTop: 12,
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 },
  th: {
    background: '#f0f4f8', color: '#6B82A0', fontWeight: 700,
    padding: '8px 10px', border: '1px solid #e5e7eb', textAlign: 'center' as const,
  },
  td: {
    padding: '8px 10px', border: '1px solid #f3f4f6',
    color: '#6b7280', textAlign: 'center' as const, verticalAlign: 'middle' as const,
  },
  privacyNote: { fontSize: 12, color: '#9ca3af', margin: 0 },
  termsText: { display: 'flex', flexDirection: 'column' as const, gap: 6 },
  termsTitle: { fontSize: 14, fontWeight: 800, color: '#1a1a2e', margin: 0 },
  termsDesc: { fontSize: 13, color: '#6b7280', margin: 0, lineHeight: 1.6 },
  termsSectionTitle: { fontSize: 13, fontWeight: 700, color: '#6B82A0', margin: '6px 0 2px' },
  termsItem: { fontSize: 13, color: '#6b7280', margin: 0, lineHeight: 1.6, paddingLeft: 8 },
  btnRow: { display: 'flex', gap: 10, marginTop: 6 },
  btnSecondary: {
    flex: '0 0 auto', padding: '13px 20px', fontSize: 15, fontWeight: 600,
    background: '#fff', color: '#6b7280',
    border: '1.5px solid #e5e7eb', borderRadius: 10, cursor: 'pointer',
    whiteSpace: 'nowrap' as const, transition: 'all 0.15s',
  },
  btnPrimary: {
    flex: 1, padding: '13px', fontSize: 15, fontWeight: 700,
    background: 'linear-gradient(135deg, #6B82A0 0%, #c47a8a 100%)',
    color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer',
    transition: 'all 0.18s', boxShadow: '0 2px 10px rgba(107,130,160,0.25)',
  },
  loginText: { fontSize: 14, color: '#9ca3af', marginTop: 18, textAlign: 'center' as const },
  loginLink: { color: '#6B82A0', fontWeight: 600, textDecoration: 'none' },
  modalOverlay: {
    position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
  },
  modalBox: {
    background: '#fff', borderRadius: 20, padding: '32px 36px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.12)', maxWidth: 360, width: '90%',
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 16,
  },
  modalTitle: { fontSize: 17, fontWeight: 800, color: '#1a1a2e', textAlign: 'center' as const },
  modalList: { listStyle: 'none', padding: 0, margin: 0, width: '100%', display: 'flex', flexDirection: 'column' as const, gap: 8 },
  modalItem: { fontSize: 15, color: '#e53e3e', fontWeight: 600 },
  modalBtn: {
    marginTop: 4, padding: '10px 36px', fontSize: 15, fontWeight: 700,
    background: 'linear-gradient(135deg, #6B82A0 0%, #c47a8a 100%)',
    color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer',
  },
}
