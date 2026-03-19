import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'
import { getMyProfile, updateMyProfile, changePassword, getMyArtworks, uploadProfilePhoto } from '../api/user'
import type { UserProfile, ArtworkSummary } from '../api/user'

type Tab = 'profile' | 'gallery'

export default function MyPage() {
  const navigate = useNavigate()
  const { isAuthenticated, nickname, tokenBalance, logout } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [tab, setTab] = useState<Tab>('profile')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [artworks, setArtworks] = useState<ArtworkSummary[]>([])
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [loadingGallery, setLoadingGallery] = useState(false)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [profileError, setProfileError] = useState(false)

  // 내 정보 변경 패널 토글
  const [showEdit, setShowEdit] = useState(false)

  // 기본 정보 변경 폼
  const [editNickname, setEditNickname] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [editMsg, setEditMsg] = useState('')
  const [editError, setEditError] = useState('')

  // 비밀번호 변경 폼
  const [curPw, setCurPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [newPw2, setNewPw2] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMsg, setPwMsg] = useState('')
  const [pwError, setPwError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return }
    getMyProfile()
      .then(p => {
        setProfile(p)
        setEditNickname(p.nickname || '')
        setEditPhone(p.phone || '')
        setEditEmail(p.subEmail || '')
      })
      .catch(() => setProfileError(true))
      .finally(() => setLoadingProfile(false))
  }, [])

  useEffect(() => {
    if (tab === 'gallery' && artworks.length === 0) {
      setLoadingGallery(true)
      getMyArtworks().then(setArtworks).finally(() => setLoadingGallery(false))
    }
  }, [tab])

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoLoading(true)
    try {
      const updated = await uploadProfilePhoto(file)
      setProfile(updated)
    } catch {
      // 실패 시 조용히 처리
    } finally {
      setPhotoLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    setEditError(''); setEditMsg(''); setEditLoading(true)
    try {
      const updated = await updateMyProfile({ nickname: editNickname, phone: editPhone, email: editEmail })
      setProfile(updated)
      setEditMsg('정보가 성공적으로 변경되었습니다!')
    } catch (err: any) {
      setEditError(err?.response?.data?.error?.message || err?.response?.data?.message || '변경에 실패했습니다.')
    } finally {
      setEditLoading(false)
    }
  }

  const handleChangePassword = async () => {
    setPwError(''); setPwMsg('')
    if (newPw !== newPw2) { setPwError('새 비밀번호가 일치하지 않습니다.'); return }
    if (newPw.length < 8) { setPwError('비밀번호는 8자 이상이어야 합니다.'); return }
    setPwLoading(true)
    try {
      await changePassword({ currentPassword: curPw, newPassword: newPw })
      setPwMsg('비밀번호가 변경되었습니다!')
      setCurPw(''); setNewPw(''); setNewPw2('')
    } catch (err: any) {
      setPwError(err?.response?.data?.error?.message || err?.response?.data?.message || '변경에 실패했습니다.')
    } finally {
      setPwLoading(false)
    }
  }

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div style={s.bg}>
      {/* 헤더 */}
      <header style={s.header}>
        <div style={s.logo} onClick={() => navigate('/')} role="button">
          <img src="/Egag_logo-removebg.png" alt="EgAg" style={{ height: 110 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isAuthenticated && nickname && (
            <span style={s.userGreet}>{nickname}님 안녕하세요!</span>
          )}
          <span style={s.tokenBadge} onClick={() => navigate('/token-shop')} role="button">
            🎟 {tokenBalance}개 보유 중
          </span>
          <button style={s.navBtn} onClick={() => navigate(-1)}>← 돌아가기</button>
          <button style={{ ...s.navBtn, color: '#c47a8a', borderColor: '#e8c0cc' }} onClick={handleLogout}>로그아웃</button>
        </div>
      </header>

      <main style={s.main}>
        <h1 style={s.title}>마이페이지</h1>

        {/* 탭 */}
        <div style={s.tabRow}>
          {([
            { key: 'profile', label: '👤 내 프로필' },
            { key: 'gallery', label: '🖼 내 갤러리' },
          ] as { key: Tab; label: string }[]).map(t => (
            <button
              key={t.key}
              style={{ ...s.tabBtn, ...(tab === t.key ? s.tabBtnActive : {}) }}
              onClick={() => { setTab(t.key); setShowEdit(false) }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 내 프로필 */}
        {tab === 'profile' && (
          <div style={s.card}>
            {loadingProfile ? (
              <p style={s.loadingText}>불러오는 중...</p>
            ) : profileError ? (
              <div style={{ textAlign: 'center', color: '#8a7a9a' }}>
                <p style={{ fontSize: 15, marginBottom: 16 }}>프로필 정보를 불러오지 못했어요.</p>
                <button style={s.secondaryBtn} onClick={() => { setProfileError(false); setLoadingProfile(true); getMyProfile().then(p => { setProfile(p); setEditNickname(p.nickname || ''); setEditPhone(p.phone || '') }).catch(() => setProfileError(true)).finally(() => setLoadingProfile(false)) }}>
                  다시 시도
                </button>
              </div>
            ) : profile ? (
              <>
                {/* 프로필 사진 */}
                <div style={s.avatarWrap} onClick={() => fileInputRef.current?.click()} title="클릭하여 사진 변경">
                  {photoLoading ? (
                    <div style={s.avatarPlaceholder}><span style={{ fontSize: 24 }}>⏳</span></div>
                  ) : profile.profileImageUrl ? (
                    <img src={profile.profileImageUrl} alt="프로필" style={s.avatar} />
                  ) : (
                    <div style={s.avatarPlaceholder}><span style={{ fontSize: 40 }}>👤</span></div>
                  )}
                  <div style={s.avatarEdit}>📷</div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
                <p style={s.avatarHint}>클릭하여 프로필 사진 변경</p>

                {/* 회원 정보 전체 */}
                <div style={s.profileGrid}>
                  {[
                    { label: '이름', value: profile.name || '—' },
                    { label: '닉네임', value: profile.nickname },
                    { label: '이메일', value: profile.subEmail || '—' },
                    { label: '전화번호', value: profile.phone || '—' },
                    { label: '가입 방법', value: profile.provider === 'email' ? '이메일' : `소셜 (${profile.provider})` },
                    { label: '가입일', value: new Date(profile.createdAt).toLocaleDateString('ko-KR') },
                  ].map(item => (
                    <div key={item.label} style={s.profileItem}>
                      <span style={s.profileLabel}>{item.label}</span>
                      <span style={s.profileValue}>{item.value}</span>
                    </div>
                  ))}
                  <div style={s.profileItem}>
                    <span style={s.profileLabel}>토큰 잔액</span>
                    <span style={{ ...s.profileValue, color: '#6B82A0', fontWeight: 800 }}>🎟 {profile.tokenBalance}개</span>
                  </div>
                </div>

                {/* 통계 */}
                <div style={s.statRow}>
                  <div style={s.statBox}>
                    <span style={s.statNum}>{profile.followerCount}</span>
                    <span style={s.statLabel}>팔로워</span>
                  </div>
                  <div style={s.statDivider} />
                  <div style={s.statBox}>
                    <span style={s.statNum}>{profile.followingCount}</span>
                    <span style={s.statLabel}>팔로잉</span>
                  </div>
                </div>

                {/* 버튼들 */}
                <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                  <button style={{ ...s.primaryBtn, flex: 1 }} onClick={() => navigate('/token-shop')}>
                    🎟 토큰 충전
                  </button>
                  <button
                    style={{ ...s.secondaryBtn, flex: 1 }}
                    onClick={() => { setShowEdit(v => !v); setEditMsg(''); setEditError('') }}
                  >
                    ✏️ 내 정보 변경
                  </button>
                </div>

                {/* 내 정보 변경 패널 (인라인) */}
                {showEdit && (
                  <div style={s.editPanel}>
                    <h3 style={s.formSection}>기본 정보 변경</h3>
                    <label style={s.label}>이름</label>
                    <input style={{ ...s.input, background: 'rgba(200,195,210,0.25)', color: '#8a7a9a', cursor: 'not-allowed' }} value={profile.name || ''} readOnly />
                    <label style={s.label}>닉네임</label>
                    <input style={s.input} value={editNickname} onChange={e => setEditNickname(e.target.value)} placeholder="닉네임" />
                    <label style={s.label}>이메일</label>
                    <input style={s.input} type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="이메일" />
                    <label style={s.label}>전화번호</label>
                    <input style={s.input} value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="전화번호" />
                    {editError && <div style={s.errorBox}>{editError}</div>}
                    {editMsg && <div style={s.successBox}>{editMsg}</div>}
                    <button style={{ ...s.primaryBtn, width: '100%', opacity: editLoading ? 0.6 : 1 }} onClick={handleUpdateProfile} disabled={editLoading}>
                      {editLoading ? '변경 중...' : '정보 변경하기'}
                    </button>

                    <div style={s.divider} />

                    <h3 style={s.formSection}>비밀번호 변경</h3>
                    {profile.provider !== 'email' && (
                      <p style={{ fontSize: 13, color: '#c47a8a', marginBottom: 12, alignSelf: 'flex-start' }}>
                        소셜 로그인 계정은 비밀번호를 변경할 수 없습니다.
                      </p>
                    )}
                    <label style={s.label}>현재 비밀번호</label>
                    <input style={s.input} type="password" value={curPw} onChange={e => setCurPw(e.target.value)} placeholder="현재 비밀번호" disabled={profile.provider !== 'email'} />
                    <label style={s.label}>새 비밀번호</label>
                    <input style={s.input} type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="새 비밀번호 (8자 이상)" disabled={profile.provider !== 'email'} />
                    <label style={s.label}>새 비밀번호 확인</label>
                    <input style={s.input} type="password" value={newPw2} onChange={e => setNewPw2(e.target.value)} placeholder="새 비밀번호 재입력" disabled={profile.provider !== 'email'} />
                    {pwError && <div style={s.errorBox}>{pwError}</div>}
                    {pwMsg && <div style={s.successBox}>{pwMsg}</div>}
                    <button
                      style={{ ...s.primaryBtn, width: '100%', opacity: (pwLoading || profile.provider !== 'email') ? 0.5 : 1 }}
                      onClick={handleChangePassword}
                      disabled={pwLoading || profile.provider !== 'email'}
                    >
                      {pwLoading ? '변경 중...' : '비밀번호 변경하기'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p style={s.loadingText}>프로필을 불러올 수 없습니다.</p>
            )}
          </div>
        )}

        {/* 내 갤러리 */}
        {tab === 'gallery' && (
          <div style={{ width: '100%', maxWidth: 800 }}>
            {loadingGallery ? (
              <p style={s.loadingText}>불러오는 중...</p>
            ) : artworks.length === 0 ? (
              <div style={s.emptyBox}>
                <span style={{ fontSize: 48 }}>🎨</span>
                <p style={s.emptyText}>아직 그린 작품이 없어요</p>
                <button style={s.primaryBtn} onClick={() => navigate('/canvas')}>첫 작품 그리러 가기</button>
              </div>
            ) : (
              <div style={s.galleryGrid}>
                {artworks.map(art => (
                  <div key={art.id} style={s.galleryCard} onClick={() => navigate(`/canvas/${art.id}`)}>
                    {art.imageUrl
                      ? <img src={art.imageUrl} alt={art.title || '작품'} style={s.galleryImg} />
                      : <div style={s.galleryImgPlaceholder}>🎨</div>
                    }
                    <div style={s.galleryInfo}>
                      <p style={s.galleryTitle}>{art.title || '제목 없음'}</p>
                      <p style={s.galleryMeta}>
                        {art.topic && <span>#{art.topic} · </span>}
                        ❤️ {art.likeCount}
                        {!art.isPublic && <span style={{ color: '#c47a8a' }}> · 비공개</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
    display: 'flex', flexDirection: 'column',
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
  userGreet: { fontSize: 14, fontWeight: 600, color: '#4a4a6a' },
  tokenBadge: {
    fontSize: 13, fontWeight: 700, color: '#6B82A0',
    background: 'rgba(107,130,160,0.12)', border: '1px solid rgba(107,130,160,0.25)',
    borderRadius: 20, padding: '4px 14px', cursor: 'pointer',
  },
  navBtn: {
    fontSize: 13, fontWeight: 500, color: '#8a8aaa',
    background: 'none', border: '1px solid #ddd',
    borderRadius: 20, padding: '6px 16px', cursor: 'pointer',
  },
  main: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '130px 24px 80px',
  },
  title: {
    fontSize: 32, fontWeight: 800, margin: '32px 0 32px', letterSpacing: 2,
    padding: '4px 8px',
    background: 'linear-gradient(135deg, #3a5a8a 0%, #c47a8a 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  },
  tabRow: {
    display: 'flex', gap: 10, marginBottom: 32,
    background: 'rgba(255,255,255,0.5)', borderRadius: 50,
    padding: '6px 8px', border: '1px solid rgba(255,255,255,0.8)',
  },
  tabBtn: {
    padding: '10px 28px', borderRadius: 50, border: 'none',
    background: 'transparent', fontSize: 14, fontWeight: 600,
    color: '#8a7a9a', cursor: 'pointer', transition: 'all 0.15s',
  },
  tabBtnActive: {
    background: 'linear-gradient(135deg, #6B82A0, #c47a8a)',
    color: '#fff', boxShadow: '0 2px 12px rgba(107,130,160,0.25)',
  },
  card: {
    width: '100%', maxWidth: 520,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(245,240,248,0.8) 100%)',
    borderRadius: 28, padding: '40px',
    boxShadow: '0 8px 40px rgba(107,130,160,0.12)',
    border: '1.5px solid rgba(255,255,255,0.7)',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative', cursor: 'pointer', marginBottom: 6,
  },
  avatar: {
    width: 96, height: 96, borderRadius: '50%', objectFit: 'cover',
    border: '3px solid rgba(107,130,160,0.25)', display: 'block',
  },
  avatarPlaceholder: {
    width: 96, height: 96, borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(107,130,160,0.15), rgba(196,122,138,0.12))',
    border: '2px solid rgba(107,130,160,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  avatarEdit: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: '50%',
    background: 'linear-gradient(135deg, #6B82A0, #c47a8a)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  avatarHint: { fontSize: 11, color: '#a09ab0', margin: '0 0 20px' },
  profileGrid: { width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 },
  profileItem: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 16px', borderRadius: 12,
    background: 'rgba(245,240,248,0.6)', border: '1px solid rgba(107,130,160,0.1)',
  },
  profileLabel: { fontSize: 13, color: '#8a7a9a', fontWeight: 600 },
  profileValue: { fontSize: 14, color: '#4a4a6a', fontWeight: 700 },
  statRow: {
    display: 'flex', alignItems: 'center',
    background: 'rgba(245,240,248,0.6)', borderRadius: 12,
    padding: '10px 16px', marginBottom: 20, width: '100%',
    border: '1px solid rgba(107,130,160,0.1)', justifyContent: 'center',
    boxSizing: 'border-box',
  },
  statBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: 1 },
  statNum: { fontSize: 22, fontWeight: 800, color: '#3a5a8a' },
  statLabel: { fontSize: 12, color: '#8a7a9a', fontWeight: 600 },
  statDivider: { width: 1, height: 36, background: 'rgba(107,130,160,0.2)', margin: '0 16px' },
  primaryBtn: {
    padding: '13px 24px', fontSize: 15, fontWeight: 700, color: '#fff',
    background: 'linear-gradient(135deg, #6B82A0, #c47a8a)',
    border: 'none', borderRadius: 14, cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(107,130,160,0.25)',
  },
  secondaryBtn: {
    padding: '13px 24px', fontSize: 15, fontWeight: 700, color: '#6B82A0',
    background: 'rgba(107,130,160,0.1)', border: '1.5px solid rgba(107,130,160,0.25)',
    borderRadius: 14, cursor: 'pointer',
  },
  editPanel: {
    width: '100%', marginTop: 24,
    borderTop: '1.5px solid rgba(107,130,160,0.15)', paddingTop: 28,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  formSection: { fontSize: 16, fontWeight: 800, color: '#3a5a8a', margin: '0 0 16px', alignSelf: 'flex-start' },
  label: { fontSize: 13, fontWeight: 600, color: '#6B82A0', marginBottom: 6, alignSelf: 'flex-start' },
  input: {
    width: '100%', padding: '12px 14px', fontSize: 15,
    border: '1.5px solid rgba(107,130,160,0.25)', borderRadius: 12, outline: 'none',
    background: 'rgba(255,255,255,0.8)', marginBottom: 14, boxSizing: 'border-box',
  },
  errorBox: {
    width: '100%', background: 'rgba(254,242,242,0.9)', border: '1px solid #FECACA',
    borderRadius: 10, padding: '8px 12px', fontSize: 13, color: '#DC2626',
    marginBottom: 12, boxSizing: 'border-box',
  },
  successBox: {
    width: '100%', background: 'rgba(240,253,244,0.9)', border: '1px solid #86EFAC',
    borderRadius: 10, padding: '8px 12px', fontSize: 13, color: '#16A34A',
    marginBottom: 12, boxSizing: 'border-box',
  },
  divider: { width: '100%', height: 1, background: 'rgba(107,130,160,0.15)', margin: '24px 0' },
  loadingText: { color: '#8a7a9a', fontSize: 15 },
  emptyBox: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
    padding: '60px 32px',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(245,240,248,0.8) 100%)',
    borderRadius: 28, border: '1.5px solid rgba(255,255,255,0.7)',
    boxShadow: '0 8px 40px rgba(107,130,160,0.12)',
  },
  emptyText: { fontSize: 16, color: '#8a7a9a', margin: 0 },
  galleryGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16,
  },
  galleryCard: {
    borderRadius: 20, overflow: 'hidden', cursor: 'pointer',
    background: 'rgba(255,255,255,0.85)',
    border: '1.5px solid rgba(255,255,255,0.7)',
    boxShadow: '0 4px 20px rgba(107,130,160,0.10)',
    transition: 'transform 0.15s, box-shadow 0.15s',
  },
  galleryImg: { width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' },
  galleryImgPlaceholder: {
    width: '100%', aspectRatio: '1',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40,
    background: 'linear-gradient(135deg, rgba(107,130,160,0.1), rgba(196,122,138,0.08))',
  },
  galleryInfo: { padding: '12px 14px' },
  galleryTitle: { fontSize: 14, fontWeight: 700, color: '#4a4a6a', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  galleryMeta: { fontSize: 12, color: '#8a7a9a', margin: 0 },
}
