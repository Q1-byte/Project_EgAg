import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'
import Header from '../components/Header'
import { getMyProfile, updateMyProfile, changePassword, getMyArtworks, uploadProfilePhoto, toggleArtworkVisibility, deleteArtwork, getFollowers, getFollowing } from '../api/user'
import { updateArtworkTitle } from '../api/artwork'
import type { UserProfile, ArtworkSummary } from '../api/user'
import type { UserResponse } from '../types'
import { Camera, Pencil, Globe, Lock, Download, Trash2, Ticket, ArrowRight, Eye, X } from 'lucide-react'

type Tab = 'profile' | 'gallery'

export default function MyPage() {
  const navigate = useNavigate()
  const { isAuthenticated, setProfileImageUrl } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [tab, setTab] = useState<Tab>('profile')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [artworks, setArtworks] = useState<ArtworkSummary[]>([])
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [loadingGallery, setLoadingGallery] = useState(false)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [profileError, setProfileError] = useState(false)
  const [titleModal, setTitleModal] = useState<ArtworkSummary | null>(null)
  const [modalTitle, setModalTitle] = useState('')
  const [followModal, setFollowModal] = useState<'followers' | 'following' | null>(null)
  const [followList, setFollowList] = useState<UserResponse[]>([])
  const [followListLoading, setFollowListLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return }
    getMyProfile()
      .then(p => {
        setProfile(p)
        if (p.profileImageUrl) setProfileImageUrl(p.profileImageUrl)
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
      if (updated.profileImageUrl) setProfileImageUrl(updated.profileImageUrl)
    } catch { /* 실패 시 조용히 처리 */ }
    finally { setPhotoLoading(false) }
  }

  const handleToggleVisibility = async (id: string, currentIsPublic: boolean) => {
    if (!currentIsPublic) {
      if (!window.confirm('이 작품을 갤러리에 공개하시겠습니까?\n공개된 작품은 갤러리 페이지에서 모든 사용자에게 보여집니다.')) return
    }
    try {
      const updated = await toggleArtworkVisibility(id)
      setArtworks(prev => prev.map(a => a.id === id ? { ...a, isPublic: updated.isPublic } : a))
    } catch { /* 실패 시 무시 */ }
  }

  const handleDeleteArtwork = async (id: string) => {
    if (!window.confirm('이 작품을 목록에서 삭제할까요?')) return
    try {
      await deleteArtwork(id)
      setArtworks(prev => prev.filter(a => a.id !== id))
    } catch (err: any) {
      alert(err?.response?.data?.error?.message ?? '삭제에 실패했습니다.')
    }
  }

  const handleDownload = async (imageUrl: string, title: string) => {
    const a = document.createElement('a')
    a.download = `${title || '작품'}.png`
    if (imageUrl.startsWith('data:')) {
      a.href = imageUrl; a.click()
    } else {
      try {
        const res = await fetch(imageUrl)
        const blob = await res.blob()
        a.href = URL.createObjectURL(blob); a.click()
        URL.revokeObjectURL(a.href)
      } catch { window.open(imageUrl, '_blank') }
    }
  }

  const openFollowModal = async (type: 'followers' | 'following') => {
    if (!profile) return
    setFollowModal(type)
    setFollowListLoading(true)
    try {
      const data = type === 'followers' ? await getFollowers(profile.id) : await getFollowing(profile.id)
      setFollowList(data)
    } catch { setFollowList([]) }
    finally { setFollowListLoading(false) }
  }

  const avatarSrc = profile?.profileImageUrl
    ? (profile.profileImageUrl.startsWith('/uploads') ? `http://localhost:8080${profile.profileImageUrl}` : profile.profileImageUrl)
    : null

  return (
    <div style={s.bg} className="mp-bg">
      <Header />
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .mp-tab:hover { color: #6B82A0 !important; }
        .mp-avatar-wrap:hover .mp-avatar-overlay { opacity: 1 !important; }
        .mp-gallery-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(107,130,160,0.18) !important; }
        .mp-btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }
        .mp-btn-secondary:hover { background: rgba(107,130,160,0.14) !important; }
        @media (max-width: 640px) {
          .mp-bg { padding: 80px 12px 60px !important; }
          .mp-card { padding: 28px 20px !important; }
          .mp-stat-row { padding: 12px 16px !important; }
          .mp-btn-row { flex-direction: column !important; }
          .mp-follow-modal { padding: 24px 0 16px !important; }
        }
        @media (min-width: 641px) and (max-width: 860px) {
          .mp-card { padding: 32px 28px !important; }
        }
      `}</style>

      <main style={s.main}>
        <h1 style={s.pageTitle}>마이페이지</h1>

        {/* 탭 */}
        <div style={s.tabRow}>
          {([
            { key: 'profile', label: '내 프로필' },
            { key: 'gallery', label: '내 갤러리' },
          ] as { key: Tab; label: string }[]).map(t => (
            <button key={t.key} className="mp-tab"
              style={{ ...s.tabBtn, ...(tab === t.key ? s.tabBtnActive : {}) }}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 내 프로필 */}
        {tab === 'profile' && (
          <div style={s.card} className="mp-card">
            {loadingProfile ? (
              <p style={s.loadingText}>불러오는 중...</p>
            ) : profileError ? (
              <div style={{ textAlign: 'center', color: '#8a7a9a' }}>
                <p style={{ fontSize: 15, marginBottom: 16 }}>프로필 정보를 불러오지 못했어요.</p>
                <button className="mp-btn-secondary" style={s.btnSecondary}
                  onClick={() => {
                    setProfileError(false); setLoadingProfile(true)
                    getMyProfile().then(p => { setProfile(p) }).catch(() => setProfileError(true)).finally(() => setLoadingProfile(false))
                  }}>
                  다시 시도
                </button>
              </div>
            ) : profile ? (
              <>
                {/* 아바타 */}
                <div className="mp-avatar-wrap" style={s.avatarWrap} onClick={() => fileInputRef.current?.click()}>
                  {photoLoading ? (
                    <div style={s.avatarInner}>
                      <div style={{ fontSize: 28, color: '#6B82A0' }}>...</div>
                    </div>
                  ) : avatarSrc ? (
                    <img src={avatarSrc} alt="프로필" style={s.avatarImg} />
                  ) : (
                    <div style={s.avatarInner}>
                      <span style={s.avatarInitial}>{profile.nickname?.[0]?.toUpperCase()}</span>
                    </div>
                  )}
                  <div className="mp-avatar-overlay" style={s.avatarOverlay}>
                    <Camera size={20} color="#fff" />
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
                <p style={s.avatarHint}>클릭하여 사진 변경</p>

                <h2 style={s.nicknameText}>{profile.nickname}</h2>

                {/* 통계 */}
                <div style={s.statRow} className="mp-stat-row">
                  <div style={{ ...s.statItem, cursor: 'pointer' }} onClick={() => openFollowModal('followers')}>
                    <span style={s.statValue}>{profile.followerCount}</span>
                    <span style={{ ...s.statLabel, textDecoration: 'underline dotted' }}>팔로워</span>
                  </div>
                  <div style={s.statDivider} />
                  <div style={{ ...s.statItem, cursor: 'pointer' }} onClick={() => openFollowModal('following')}>
                    <span style={s.statValue}>{profile.followingCount}</span>
                    <span style={{ ...s.statLabel, textDecoration: 'underline dotted' }}>팔로잉</span>
                  </div>
                  <div style={s.statDivider} />
                  <div style={s.statItem}>
                    <span style={{ ...s.statValue, color: '#c47a8a' }}>{profile.tokenBalance}</span>
                    <span style={s.statLabel}>토큰</span>
                  </div>
                </div>

                {/* 정보 */}
                <div style={s.infoGrid}>
                  {[
                    { label: '이름', value: profile.name || '—' },
                    { label: '닉네임', value: profile.nickname || '—' },
                    { label: '이메일', value: profile.subEmail || '—' },
                    { label: '전화번호', value: profile.phone || '—' },
                    { label: '가입 방법', value: profile.provider === 'email' ? '이메일' : `소셜 (${profile.provider})` },
                    { label: '가입일', value: new Date(profile.createdAt).toLocaleDateString('ko-KR') },
                  ].map(item => (
                    <div key={item.label} style={s.infoRow}>
                      <span style={s.infoLabel}>{item.label}</span>
                      <span style={s.infoValue}>{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* 버튼 */}
                <div style={{ display: 'flex', gap: 10, width: '100%' }} className="mp-btn-row">
                  <button className="mp-btn-primary" style={{ ...s.btnPrimary, flex: 1 }}
                    onClick={() => navigate('/token-shop')}>
                    <Ticket size={15} />
                    토큰 충전
                  </button>
                  <button className="mp-btn-secondary" style={{ ...s.btnSecondary, flex: 1 }}
                    onClick={() => navigate('/profile/edit')}>
                    <Pencil size={15} />
                    내 정보 변경
                  </button>
                </div>
              </>
            ) : (
              <p style={s.loadingText}>프로필을 불러올 수 없습니다.</p>
            )}
          </div>
        )}

        {/* 내 갤러리 */}
        {tab === 'gallery' && (
          <div style={{ width: '100%', maxWidth: 860 }}>
            {loadingGallery ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af', fontSize: 15, fontWeight: 600 }}>
                불러오는 중...
              </div>
            ) : artworks.length === 0 ? (
              <div style={s.emptyBox}>
                <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>🎨</div>
                <p style={{ margin: '0 0 20px', fontSize: 15, color: '#9ca3af', fontWeight: 600 }}>아직 그린 작품이 없어요</p>
                <button className="mp-btn-primary" style={s.btnPrimary} onClick={() => navigate('/canvas')}>
                  <ArrowRight size={15} />
                  첫 작품 그리러 가기
                </button>
              </div>
            ) : (
              <>
                <div style={s.galleryHeader}>
                  <h2 style={s.galleryTitle}>내 작품</h2>
                  <span style={s.galleryCount}>{artworks.length}개</span>
                </div>
                <div style={s.galleryGrid}>
                  {artworks.map((art, i) => (
                    <div key={art.id} className="mp-gallery-card" style={{ ...s.galleryCard, animation: `fadeUp ${0.3 + i * 0.04}s ease both` }}>
                      {/* 이미지 영역 */}
                      <div style={s.galleryImgRow} onClick={() => {
                        if (art.title) {
                          navigate(`/artwork/${art.id}`)
                        } else {
                          setTitleModal(art); setModalTitle('')
                        }
                      }}>
                        <div style={s.galleryImgWrap}>
                          <p style={s.galleryImgLabel}>내 그림</p>
                          {art.userImageData
                            ? <img src={art.userImageData} alt="내 그림" style={s.galleryImg} />
                            : <div style={s.galleryImgPlaceholder}><Pencil size={24} color="#c4b5d0" /></div>
                          }
                        </div>
                        <div style={s.galleryImgWrap}>
                          <p style={s.galleryImgLabel}>AI 그림</p>
                          {art.imageUrl
                            ? <img src={art.imageUrl} alt="AI 그림" style={s.galleryImg} />
                            : <div style={s.galleryImgPlaceholder}><Eye size={24} color="#c4b5d0" /></div>
                          }
                        </div>
                      </div>

                      {/* 정보 */}
                      <div style={s.galleryInfo}>
                        <p style={s.galleryDate}>
                          {new Date(art.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '')}
                        </p>
                        <p style={s.galleryArtTitle}>{art.title || '제목 없음'}</p>
                        <div style={s.galleryMeta}>
                          {art.topic && <span>#{art.topic}</span>}
                          <span style={{ color: art.isPublic ? '#43aa8b' : '#c47a8a' }}>
                            {art.isPublic ? '공개' : '비공개'}
                          </span>
                          <span>좋아요 {art.likeCount}</span>
                        </div>
                        <div style={s.galleryBtns} onClick={e => e.stopPropagation()}>
                          <button style={{ ...s.galleryBtn, color: art.isPublic ? '#43aa8b' : '#8a7a9a' }}
                            onClick={() => handleToggleVisibility(art.id, art.isPublic)}
                            title={art.isPublic ? '비공개로 전환' : '갤러리에 공개'}>
                            {art.isPublic ? <Globe size={13} /> : <Lock size={13} />}
                          </button>
                          <button style={s.galleryBtn}
                            onClick={() => {
                              if (art.userImageData) handleDownload(art.userImageData, `${art.title || '작품'}-내그림`)
                              if (art.imageUrl) handleDownload(art.imageUrl, `${art.title || '작품'}-AI그림`)
                            }}
                            title="PNG로 저장">
                            <Download size={13} />
                          </button>
                          <button style={{ ...s.galleryBtn, color: '#c47a8a' }}
                            onClick={() => handleDeleteArtwork(art.id)}
                            title="삭제">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* 팔로워/팔로잉 모달 */}
      {followModal && (
        <div style={s.modalBackdrop} onClick={() => setFollowModal(null)}>
          <div style={{ ...s.modalCard, maxWidth: 400, padding: '32px 0 20px', gap: 0 }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setFollowModal(null)} style={s.modalClose}><X size={18} /></button>
            <p style={{ ...s.modalEyebrow, marginBottom: 20, paddingLeft: 28 }}>
              {followModal === 'followers' ? '팔로워' : '팔로잉'}
            </p>
            {followListLoading ? (
              <p style={{ ...s.loadingText, textAlign: 'center', padding: '32px 0' }}>불러오는 중...</p>
            ) : followList.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af', fontSize: 14, fontWeight: 600 }}>
                {followModal === 'followers' ? '아직 팔로워가 없어요' : '팔로우한 사람이 없어요'}
              </p>
            ) : (
              <div style={{ maxHeight: 420, overflowY: 'auto', width: '100%' }}>
                {followList.map(u => {
                  const uAvatar = u.profileImageUrl
                    ? (u.profileImageUrl.startsWith('/uploads') ? `http://localhost:8080${u.profileImageUrl}` : u.profileImageUrl)
                    : null
                  return (
                    <div key={u.id}
                      onClick={() => { setFollowModal(null); navigate(`/user/${u.id}`) }}
                      style={s.followListItem}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(107,130,160,0.06)'}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                    >
                      <div style={s.followListAvatar}>
                        {uAvatar
                          ? <img src={uAvatar} alt={u.nickname} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                          : <span style={s.followListInitial}>{u.nickname?.[0]?.toUpperCase()}</span>
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={s.followListNickname}>{u.nickname}</p>
                        <p style={s.followListSub}>팔로워 {u.followerCount}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 작품 감상 모달 */}
      {titleModal && (
        <div style={s.modalBackdrop} onClick={() => setTitleModal(null)}>
          <div style={s.modalCard} onClick={e => e.stopPropagation()}>
            <button onClick={() => setTitleModal(null)} style={s.modalClose}>✕</button>
            <p style={s.modalEyebrow}>작품 제목 짓기</p>
            <h2 style={s.modalTitle}>이 작품, 이름이 없어요</h2>
            <p style={s.modalSub}>제목을 지어줘야 감상 페이지로 이동할 수 있어요</p>
            <div style={{ width: '100%', position: 'relative' }}>
              <input
                type="text"
                value={modalTitle}
                onChange={e => setModalTitle(e.target.value.slice(0, 12))}
                onKeyDown={e => {
                  if (e.key === 'Enter' && modalTitle.trim()) {
                    updateArtworkTitle(titleModal.id, modalTitle.trim()).catch(() => {})
                    navigate(`/artwork/${titleModal.id}`, { state: { title: modalTitle.trim() } })
                    setTitleModal(null)
                  }
                }}
                maxLength={12}
                placeholder="멋진 제목을 입력해주세요..."
                style={s.modalInput}
                autoFocus
              />
              <span style={{
                position: 'absolute', right: 14, bottom: 10,
                fontSize: 11, fontWeight: 600,
                color: modalTitle.length >= 12 ? '#c47a8a' : '#b0a8bc',
              }}>
                {modalTitle.length}/12
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10, width: '100%' }}>
              <button className="mp-btn-primary"
                style={{ ...s.btnPrimary, flex: 2, opacity: modalTitle.trim() ? 1 : 0.5, justifyContent: 'center' }}
                disabled={!modalTitle.trim()}
                onClick={() => {
                  updateArtworkTitle(titleModal.id, modalTitle.trim()).catch(() => {})
                  navigate(`/artwork/${titleModal.id}`, { state: { title: modalTitle.trim() } })
                  setTitleModal(null)
                }}>
                감상하러 가기
              </button>
              <button className="mp-btn-secondary" style={{ ...s.btnSecondary, flex: 1, justifyContent: 'center' }}
                onClick={() => setTitleModal(null)}>
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  bg: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #f5f0f8 0%, #ede8f2 40%, #f0eee9 100%)',
    padding: '110px 20px 80px',
  },
  main: {
    maxWidth: 860, margin: '0 auto',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    animation: 'fadeUp 0.5s ease both',
  },
  pageTitle: {
    fontSize: 28, fontWeight: 900, margin: '0 0 28px',
    background: 'linear-gradient(135deg, #c47a8a 0%, #6B82A0 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
    letterSpacing: -0.5,
  },
  tabRow: {
    display: 'flex', gap: 8, marginBottom: 32,
    background: 'rgba(255,255,255,0.55)', borderRadius: 50,
    padding: '5px 6px', border: '1px solid rgba(255,255,255,0.8)',
    boxShadow: '0 2px 12px rgba(107,130,160,0.08)',
  },
  tabBtn: {
    padding: '9px 26px', borderRadius: 50, border: 'none',
    background: 'transparent', fontSize: 14, fontWeight: 600,
    color: '#9ca3af', cursor: 'pointer', transition: 'all 0.15s',
  },
  tabBtnActive: {
    background: 'linear-gradient(135deg, #6B82A0, #c47a8a)',
    color: '#fff', boxShadow: '0 2px 12px rgba(107,130,160,0.25)',
  },
  card: {
    width: '100%', maxWidth: 480,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(245,240,248,0.85) 100%)',
    borderRadius: 28, padding: '44px 40px',
    boxShadow: '0 8px 40px rgba(107,130,160,0.13)',
    border: '1.5px solid rgba(255,255,255,0.75)',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative', cursor: 'pointer',
    width: 96, height: 96, borderRadius: '50%',
    overflow: 'hidden', marginBottom: 6, flexShrink: 0,
    border: '3px solid rgba(255,255,255,0.9)',
    boxShadow: '0 4px 20px rgba(107,130,160,0.22)',
  },
  avatarImg: {
    width: '100%', height: '100%', objectFit: 'cover', display: 'block',
  },
  avatarInner: {
    width: '100%', height: '100%',
    background: 'linear-gradient(135deg, rgba(196,122,138,0.15), rgba(107,130,160,0.15))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 34, fontWeight: 900,
    background: 'linear-gradient(135deg, #c47a8a, #6B82A0)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  },
  avatarOverlay: {
    position: 'absolute', inset: 0,
    background: 'rgba(0,0,0,0.38)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    opacity: 0, transition: 'opacity 0.18s',
  },
  avatarHint: { fontSize: 11, color: '#b0a8bc', margin: '0 0 4px' },
  nicknameText: {
    fontSize: 22, fontWeight: 900, margin: '8px 0 20px',
    background: 'linear-gradient(135deg, #c47a8a 0%, #6B82A0 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
    letterSpacing: -0.5,
  },
  statRow: {
    display: 'flex', alignItems: 'center', gap: 0,
    background: 'rgba(107,130,160,0.05)', borderRadius: 14,
    padding: '14px 28px', width: '100%',
    justifyContent: 'center', marginBottom: 24,
  },
  statItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: 1 },
  statDivider: { width: 1, height: 30, background: 'rgba(107,130,160,0.15)', flexShrink: 0 },
  statValue: { fontSize: 20, fontWeight: 900, color: '#3d3d5c' },
  statLabel: { fontSize: 11, color: '#9ca3af', fontWeight: 600 },
  infoGrid: { width: '100%', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 },
  infoRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 14px', borderRadius: 12,
    background: 'rgba(245,240,248,0.55)', border: '1px solid rgba(107,130,160,0.09)',
  },
  infoLabel: { fontSize: 12, color: '#9ca3af', fontWeight: 600 },
  infoValue: { fontSize: 13, color: '#4a4a6a', fontWeight: 700 },
  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '12px 22px', fontSize: 14, fontWeight: 700, color: '#fff',
    background: 'linear-gradient(135deg, #c47a8a 0%, #6B82A0 100%)',
    border: 'none', borderRadius: 12, cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 16px rgba(107,130,160,0.22)',
  },
  btnSecondary: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '12px 22px', fontSize: 14, fontWeight: 700, color: '#6B82A0',
    background: 'rgba(107,130,160,0.09)', border: '1.5px solid rgba(107,130,160,0.22)',
    borderRadius: 12, cursor: 'pointer', transition: 'background 0.15s',
  },
  loadingText: { color: '#9ca3af', fontSize: 15, fontWeight: 600 },
  emptyBox: {
    textAlign: 'center', padding: '60px 20px',
    background: 'rgba(255,255,255,0.7)', borderRadius: 20,
    border: '1.5px dashed rgba(107,130,160,0.2)',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  galleryHeader: {
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
    width: '100%',
  },
  galleryTitle: { fontSize: 16, fontWeight: 800, color: '#4a4a6a', margin: 0 },
  galleryCount: {
    fontSize: 12, fontWeight: 700, color: '#6B82A0',
    background: 'rgba(107,130,160,0.1)', borderRadius: 6, padding: '2px 8px',
  },
  galleryGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 18,
    width: '100%',
  },
  galleryCard: {
    borderRadius: 18, overflow: 'hidden',
    background: 'rgba(255,255,255,0.88)',
    border: '1.5px solid rgba(255,255,255,0.7)',
    boxShadow: '0 4px 20px rgba(107,130,160,0.10)',
    transition: 'transform 0.18s, box-shadow 0.18s',
    cursor: 'pointer',
  },
  galleryImgRow: { display: 'flex' },
  galleryImgWrap: { flex: 1, display: 'flex', flexDirection: 'column' },
  galleryImgLabel: {
    fontSize: 10, fontWeight: 700, color: '#b0a8bc', textAlign: 'center',
    margin: '6px 0 2px', letterSpacing: 0.5,
  },
  galleryImg: { width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' },
  galleryImgPlaceholder: {
    width: '100%', aspectRatio: '1',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, rgba(107,130,160,0.07), rgba(196,122,138,0.06))',
  },
  galleryInfo: { padding: '12px 14px' },
  galleryDate: { fontSize: 11, color: '#b0a8bc', margin: '0 0 2px', fontWeight: 600 },
  galleryArtTitle: {
    fontSize: 13, fontWeight: 800, color: '#4a4a6a',
    margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  galleryMeta: {
    display: 'flex', gap: 8, fontSize: 11, color: '#9ca3af', marginBottom: 10, fontWeight: 600,
  },
  galleryBtns: { display: 'flex', gap: 6 },
  galleryBtn: {
    flex: 1, padding: '6px 0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(107,130,160,0.07)', border: '1px solid rgba(107,130,160,0.14)',
    borderRadius: 8, cursor: 'pointer', color: '#6B82A0', transition: 'background 0.15s',
  },
  modalBackdrop: {
    position: 'fixed', inset: 0, zIndex: 500,
    background: 'rgba(50,40,70,0.4)', backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  modalCard: {
    position: 'relative',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(245,240,248,0.95) 100%)',
    borderRadius: 28, padding: '44px 36px 36px',
    width: '100%', maxWidth: 420,
    boxShadow: '0 24px 64px rgba(107,130,160,0.22)',
    border: '1.5px solid rgba(255,255,255,0.8)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
  },
  modalClose: {
    position: 'absolute', top: 14, right: 16,
    background: 'none', border: 'none', color: '#9ca3af',
    cursor: 'pointer', lineHeight: 1, display: 'flex', alignItems: 'center',
  },
  followListItem: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 24px', cursor: 'pointer',
    transition: 'background 0.12s',
  },
  followListAvatar: {
    width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg, rgba(196,122,138,0.15), rgba(107,130,160,0.15))',
    border: '2px solid rgba(255,255,255,0.8)',
    boxShadow: '0 2px 8px rgba(107,130,160,0.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  followListInitial: {
    fontSize: 18, fontWeight: 900,
    background: 'linear-gradient(135deg, #c47a8a, #6B82A0)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  },
  followListNickname: { margin: 0, fontSize: 14, fontWeight: 700, color: '#3d3d5c' },
  followListSub: { margin: '2px 0 0', fontSize: 11, color: '#9ca3af', fontWeight: 600 },
  modalEyebrow: {
    fontSize: 11, fontWeight: 700, letterSpacing: 2,
    color: '#c47a8a', textTransform: 'uppercase', margin: 0,
  },
  modalTitle: {
    fontSize: 20, fontWeight: 900, margin: 0, textAlign: 'center',
    background: 'linear-gradient(135deg, #c47a8a, #6B82A0)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  },
  modalSub: { fontSize: 13, color: '#a09ab0', margin: 0, textAlign: 'center' },
  modalInput: {
    width: '100%', padding: '13px 16px', fontSize: 15,
    border: '1.5px solid rgba(107,130,160,0.25)', borderRadius: 14, outline: 'none',
    background: 'rgba(255,255,255,0.85)', color: '#4a4a6a',
    boxSizing: 'border-box', fontFamily: 'inherit',
  },
}
