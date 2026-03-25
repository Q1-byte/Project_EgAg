import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyProfile, updateMyProfile, uploadAvatar, checkNicknameAvailable } from '../api/user'
import Header from '../components/Header'

const AVATAR_PRESETS = [
  { name: '꼬마 토끼', emoji: '🐰', url: 'https://img.icons8.com/plasticine/200/rabbit.png' },
  { name: '멋진 사자', emoji: '🦁', url: 'https://img.icons8.com/plasticine/200/lion.png' },
  { name: '행복한 판다', emoji: '🐼', url: 'https://img.icons8.com/plasticine/200/panda.png' },
  { name: '꿈꾸는 여우', emoji: '🦊', url: 'https://img.icons8.com/plasticine/200/fox.png' },
  { name: '영리한 부엉이', emoji: '🦉', url: 'https://img.icons8.com/plasticine/200/owl.png' },
  { name: '노란 병아리', emoji: '🐥', url: '/chick.png' },
]

export default function EditProfile() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [nickname, setNickname] = useState('')
  const [originalNickname, setOriginalNickname] = useState('')
  const [nicknameChecking, setNicknameChecking] = useState(false)
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(null)
  const [subEmail, setSubEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [profileImageUrl, setProfileImageUrl] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)

  useEffect(() => {
    getMyProfile()
      .then(user => {
        setNickname(user.nickname)
        setOriginalNickname(user.nickname)
        setSubEmail(user.subEmail || '')
        setPhone(user.phone || '')
        setProfileImageUrl(user.profileImageUrl || '')
      })
      .catch(() => setError('프로필 정보를 불러오지 못했어요.'))
      .finally(() => setLoading(false))
  }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const res = await uploadAvatar(file)
      setProfileImageUrl(res.profileImageUrl || '')
    } catch {
      setError('사진 업로드에 실패했어요.')
    } finally {
      setUploading(false)
    }
  }

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.startsWith('02')) {
      if (digits.length <= 2) return digits
      if (digits.length <= 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`
      if (digits.length <= 9) return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`
      return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`
    }
    if (digits.length <= 3) return digits
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
  }

  const nicknameChanged = nickname.trim() !== originalNickname
  const canSubmit = !nicknameChanged || nicknameAvailable === true

  const handleCheckNickname = async () => {
    const trimmed = nickname.trim()
    if (!trimmed) return
    setNicknameChecking(true)
    setNicknameAvailable(null)
    try {
      const available = await checkNicknameAvailable(trimmed)
      setNicknameAvailable(available)
    } catch {
      setNicknameAvailable(null)
    } finally {
      setNicknameChecking(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) {
      setError('닉네임 중복 확인을 해주세요.')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await updateMyProfile({ nickname, email: subEmail, phone, profileImageUrl: profileImageUrl || undefined } as any)
      setSuccess('변경되었어요!')
      setTimeout(() => navigate('/mypage'), 900)
    } catch (err: any) {
      setError(err.response?.data?.message || '변경에 실패했어요.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={s.bg}>
      <style>{`
        @keyframes blob1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-60px)} }
        @keyframes blob2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(60px)} }
        @keyframes blob3 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-40px)} }
        .preset-card { transition: transform 0.15s, box-shadow 0.15s; cursor: pointer; }
        .preset-card:hover { transform: translateY(-4px) scale(1.04); }
        .upload-zone:hover { border-color: rgba(196,122,138,0.6) !important; background: rgba(252,232,237,0.4) !important; }
        @media (max-width: 640px) {
          .ep-main { padding: 80px 16px 60px !important; }
          .ep-card { padding: 28px 20px !important; border-radius: 20px !important; }
          .ep-title { font-size: 22px !important; }
          .ep-preset-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .ep-btn-row { flex-direction: column !important; }
          .ep-btn-row button { flex: unset !important; width: 100% !important; }
        }
        @media (min-width: 641px) and (max-width: 860px) {
          .ep-main { padding: 100px 24px 72px !important; }
          .ep-card { padding: 36px 32px !important; }
        }
      `}</style>

      {/* 배경 blob */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-8%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,150,180,0.22) 0%, transparent 65%)', animation: 'blob1 7s ease-in-out infinite', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', top: '20%', right: '-10%', width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,130,160,0.18) 0%, transparent 65%)', animation: 'blob2 9s ease-in-out infinite', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '5%', left: '20%', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,220,80,0.15) 0%, transparent 65%)', animation: 'blob3 11s ease-in-out infinite', filter: 'blur(60px)' }} />
      </div>

      <Header />

      <main style={s.main} className="ep-main">
        {loading ? (
          <p style={{ color: '#8a7a9a', fontSize: 15 }}>불러오는 중...</p>
        ) : (
          <div style={s.card} className="ep-card">
            {/* 타이틀 */}
            <p style={s.eyebrow}>✦ My Profile</p>
            <h1 style={s.title} className="ep-title">내 모습 바꾸기</h1>
            <p style={s.subtitle}>닉네임과 프로필 사진을 바꿔보세요</p>

            {/* 현재 아바타 미리보기 */}
            <div style={s.avatarPreview}>
              {uploading ? (
                <div style={s.avatarCircle}><span style={{ fontSize: 28 }}>⏳</span></div>
              ) : profileImageUrl ? (
                <img
                  src={profileImageUrl.startsWith('/uploads') ? `http://localhost:8080${profileImageUrl}` : profileImageUrl}
                  alt="프로필"
                  style={{ ...s.avatarCircle, objectFit: 'cover' as const }}
                />
              ) : (
                <div style={s.avatarCircle}><span style={{ fontSize: 48 }}>👤</span></div>
              )}
              <div style={s.avatarBadge}>지금 내 모습</div>
            </div>

            <form onSubmit={handleSubmit} style={s.form}>
              {/* 오류 / 성공 메시지 */}
              {error && <div style={s.errorBox}>{error}</div>}
              {success && <div style={s.successBox}>{success}</div>}

              {/* 캐릭터 선택 */}
              <div style={s.section}>
                <p style={s.sectionLabel}>나를 닮은 캐릭터</p>
                <div style={s.presetGrid} className="ep-preset-grid">
                  {AVATAR_PRESETS.map(p => (
                    <div
                      key={p.url}
                      className="preset-card"
                      onClick={() => setProfileImageUrl(p.url)}
                      style={{
                        ...s.presetItem,
                        background: profileImageUrl === p.url
                          ? 'linear-gradient(135deg, rgba(196,122,138,0.18), rgba(107,130,160,0.18))'
                          : 'rgba(255,255,255,0.6)',
                        border: profileImageUrl === p.url
                          ? '2px solid rgba(196,122,138,0.5)'
                          : '2px solid transparent',
                        boxShadow: profileImageUrl === p.url
                          ? '0 4px 16px rgba(196,122,138,0.2)'
                          : '0 2px 8px rgba(107,130,160,0.08)',
                      }}
                    >
                      <img src={p.url} alt={p.name} style={s.presetImg} />
                      <span style={s.presetName}>{p.emoji} {p.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 직접 사진 업로드 */}
              <div style={s.section}>
                <p style={s.sectionLabel}>내 사진 직접 올리기</p>
                <div
                  className="upload-zone"
                  onClick={() => fileInputRef.current?.click()}
                  style={s.uploadZone}
                >
                  <span style={{ fontSize: 28 }}>☁️</span>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#6B82A0' }}>클릭해서 사진 올리기</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#a09ab0' }}>JPG, PNG 지원</p>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

                <button
                  type="button"
                  onClick={() => setShowUrlInput(v => !v)}
                  style={s.linkBtn}
                >
                  {showUrlInput ? '접기' : '이미지 URL로 설정하기'}
                </button>
                {showUrlInput && (
                  <input
                    type="text"
                    value={profileImageUrl}
                    onChange={e => setProfileImageUrl(e.target.value)}
                    placeholder="https://..."
                    style={{ ...s.input, marginTop: 8 }}
                  />
                )}
              </div>

              {/* 닉네임 */}
              <div style={s.section}>
                <label style={s.sectionLabel}>닉네임</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={nickname}
                    onChange={e => {
                      setNickname(e.target.value)
                      setNicknameAvailable(null)
                    }}
                    required
                    placeholder="친구들이 부를 이름"
                    style={{
                      ...s.input,
                      flex: 1,
                      borderColor: nicknameAvailable === true
                        ? 'rgba(67,170,139,0.6)'
                        : nicknameAvailable === false
                        ? 'rgba(196,122,138,0.6)'
                        : undefined,
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleCheckNickname}
                    disabled={nicknameChecking || !nickname.trim() || !nicknameChanged}
                    style={{
                      padding: '0 16px', fontSize: 13, fontWeight: 700,
                      background: nicknameChanged ? 'linear-gradient(135deg, #6B82A0, #c47a8a)' : 'rgba(107,130,160,0.1)',
                      color: nicknameChanged ? '#fff' : '#b0a8bc',
                      border: 'none', borderRadius: 12, cursor: nicknameChanged ? 'pointer' : 'default',
                      whiteSpace: 'nowrap', transition: 'all 0.15s',
                      opacity: nicknameChecking ? 0.7 : 1,
                    }}
                  >
                    {nicknameChecking ? '확인 중...' : '중복확인'}
                  </button>
                </div>
                {nicknameAvailable === true && (
                  <p style={{ margin: 0, fontSize: 12, color: '#43aa8b', fontWeight: 600 }}>사용 가능한 닉네임이에요</p>
                )}
                {nicknameAvailable === false && (
                  <p style={{ margin: 0, fontSize: 12, color: '#c47a8a', fontWeight: 600 }}>이미 사용 중인 닉네임이에요</p>
                )}
                {nicknameChanged && nicknameAvailable === null && (
                  <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>닉네임을 변경했다면 중복 확인이 필요해요</p>
                )}
              </div>

              {/* 이메일 */}
              <div style={s.section}>
                <label style={s.sectionLabel}>이메일 (선택)</label>
                <input
                  type="email"
                  value={subEmail}
                  onChange={e => setSubEmail(e.target.value)}
                  placeholder="example@email.com"
                  style={s.input}
                />
              </div>

              {/* 전화번호 */}
              <div style={s.section}>
                <label style={s.sectionLabel}>전화번호 (선택)</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(formatPhone(e.target.value))}
                  placeholder="010-0000-0000"
                  inputMode="numeric"
                  style={s.input}
                />
              </div>

              {/* 버튼 */}
              <div style={s.btnRow} className="ep-btn-row">
                <button
                  type="button"
                  onClick={() => navigate('/mypage')}
                  disabled={saving}
                  style={s.cancelBtn}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading || !canSubmit}
                  style={{ ...s.submitBtn, opacity: (saving || uploading || !canSubmit) ? 0.5 : 1 }}
                >
                  {saving ? '저장 중...' : '저장하기'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  bg: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #f5f0f8 0%, #ede8f2 40%, #f0eee9 100%)',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  main: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    padding: '120px 24px 80px',
    position: 'relative',
    zIndex: 1,
  },
  card: {
    width: '100%',
    maxWidth: 560,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(245,240,248,0.85) 100%)',
    borderRadius: 32,
    padding: '48px 44px',
    boxShadow: '0 8px 48px rgba(107,130,160,0.13)',
    border: '1.5px solid rgba(255,255,255,0.75)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: 'fit-content',
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 3,
    color: '#c47a8a',
    textTransform: 'uppercase',
    margin: '0 0 12px',
  },
  title: {
    fontSize: 30,
    fontWeight: 900,
    margin: '0 0 8px',
    letterSpacing: -0.5,
    fontFamily: "'Jua', sans-serif",
    background: 'linear-gradient(135deg, #c47a8a 0%, #6B82A0 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  subtitle: {
    fontSize: 14,
    color: '#a09ab0',
    margin: '0 0 32px',
  },
  avatarPreview: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    marginBottom: 32,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(196,122,138,0.12), rgba(107,130,160,0.1))',
    border: '3px solid rgba(255,255,255,0.8)',
    boxShadow: '0 4px 24px rgba(107,130,160,0.18)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    fontSize: 12,
    fontWeight: 600,
    color: '#a09ab0',
    background: 'rgba(255,255,255,0.7)',
    borderRadius: 20,
    padding: '4px 14px',
    border: '1px solid rgba(107,130,160,0.15)',
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    width: '100%',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: '#6B82A0',
    margin: 0,
  },
  presetGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
  },
  presetItem: {
    borderRadius: 16,
    padding: '12px 8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    transition: 'transform 0.15s, box-shadow 0.15s',
  },
  presetImg: {
    width: 56,
    height: 56,
    objectFit: 'contain',
  },
  presetName: {
    fontSize: 11,
    fontWeight: 600,
    color: '#6B82A0',
    textAlign: 'center',
  },
  uploadZone: {
    border: '2px dashed rgba(107,130,160,0.3)',
    borderRadius: 16,
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
    background: 'rgba(245,240,248,0.4)',
    transition: 'border-color 0.15s, background 0.15s',
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: '#a09ab0',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    padding: '4px 0',
    textDecoration: 'underline',
    alignSelf: 'flex-start',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    fontSize: 15,
    border: '1.5px solid rgba(107,130,160,0.25)',
    borderRadius: 12,
    outline: 'none',
    background: 'rgba(255,255,255,0.8)',
    color: '#4a4a6a',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  },
  errorBox: {
    background: 'rgba(254,242,242,0.9)',
    border: '1px solid #FECACA',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 13,
    color: '#DC2626',
  },
  successBox: {
    background: 'rgba(240,253,244,0.9)',
    border: '1px solid #86EFAC',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 13,
    color: '#16A34A',
  },
  btnRow: {
    display: 'flex',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    padding: '13px',
    fontSize: 15,
    fontWeight: 600,
    color: '#8a7a9a',
    background: 'rgba(107,130,160,0.08)',
    border: '1.5px solid rgba(107,130,160,0.2)',
    borderRadius: 14,
    cursor: 'pointer',
  },
  submitBtn: {
    flex: 2,
    padding: '13px',
    fontSize: 15,
    fontWeight: 700,
    color: '#fff',
    background: 'linear-gradient(135deg, #6B82A0, #c47a8a)',
    border: 'none',
    borderRadius: 14,
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(107,130,160,0.3)',
    transition: 'opacity 0.15s',
  },
}
