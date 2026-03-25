import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, UserCheck, UserPlus, X } from 'lucide-react'
import { getUserProfile, getUserArtworks, toggleFollowUser, getFollowers, getFollowing } from '../api/user'
import { toggleLikeArtwork } from '../api/artwork'
import { useAuthStore } from '../stores/useAuthStore'
import type { UserResponse, ArtworkResponse } from '../types'
import ArtworkCard from './ArtworkCard'
import Header from '../components/Header'

const UserProfile = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [user, setUser] = useState<UserResponse | null>(null)
  const [artworks, setArtworks] = useState<ArtworkResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followModal, setFollowModal] = useState<'followers' | 'following' | null>(null)
  const [followList, setFollowList] = useState<UserResponse[]>([])
  const [followListLoading, setFollowListLoading] = useState(false)
  const { userId: currentUserId } = useAuthStore()

  useEffect(() => {
    const fetchUserData = async () => {
      if (!id) return
      try {
        const [profileData, artworkData] = await Promise.all([
          getUserProfile(id),
          getUserArtworks(id)
        ])
        setUser(profileData)
        setArtworks(artworkData)
        setIsFollowing(profileData.isFollowing)
      } catch (error) {
        console.error('Failed to fetch user data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchUserData()
  }, [id])

  const handleFollow = async () => {
    if (!id || !user) return
    if (!currentUserId) {
      if (confirm('팔로우하려면 로그인이 필요해요! 로그인 페이지로 갈까요?')) navigate('/login')
      return
    }
    try {
      await toggleFollowUser(id)
      setIsFollowing(!isFollowing)
      setUser({ ...user, followerCount: isFollowing ? user.followerCount - 1 : user.followerCount + 1 })
    } catch (error) {
      console.error('Failed to toggle follow:', error)
    }
  }

  const openFollowModal = async (type: 'followers' | 'following') => {
    if (!id) return
    setFollowModal(type)
    setFollowListLoading(true)
    try {
      const data = type === 'followers' ? await getFollowers(id) : await getFollowing(id)
      setFollowList(data)
    } catch { setFollowList([]) }
    finally { setFollowListLoading(false) }
  }

  const handleLike = async (artId: string) => {
    try {
      await toggleLikeArtwork(artId)
      setArtworks(prev => prev.map(art => {
        if (art.id !== artId) return art
        const liked = !art.isLiked
        return { ...art, isLiked: liked, likeCount: liked ? (art.likeCount || 0) + 1 : Math.max(0, (art.likeCount || 0) - 1) }
      }))
    } catch (error) {
      console.error('Failed to toggle like:', error)
    }
  }

  const avatarSrc = user?.profileImageUrl
    ? (user.profileImageUrl.startsWith('/uploads') ? `http://localhost:8080${user.profileImageUrl}` : user.profileImageUrl)
    : null

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #f5f0f8 0%, #ede8f2 40%, #f0eee9 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#6B82A0' }}>
      불러오는 중...
    </div>
  )

  if (!user) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #f5f0f8 0%, #ede8f2 40%, #f0eee9 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#c47a8a' }}>
      사용자를 찾을 수 없어요.
    </div>
  )

  const isMyProfile = currentUserId === id

  return (
    <div style={s.bg} className="up-bg">
      <Header />
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .up-back:hover { background: rgba(107,130,160,0.12) !important; }
        .up-follow:hover { opacity: 0.88; transform: translateY(-1px); }
        .up-artwork:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(107,130,160,0.18) !important; }
        @media (max-width: 640px) {
          .up-bg { padding: 80px 12px 60px !important; }
          .up-profile-card { padding: 28px 20px !important; }
          .up-stat-row { padding: 12px 16px !important; max-width: 100% !important; }
          .up-follow-modal-card { padding: 24px 0 16px !important; max-width: calc(100vw - 32px) !important; }
        }
        @media (min-width: 641px) and (max-width: 860px) {
          .up-profile-card { padding: 32px 28px !important; }
        }
      `}</style>

      <main style={s.main}>
        <button className="up-back" onClick={() => navigate(-1)} style={s.backBtn}>
          <ArrowLeft size={15} strokeWidth={2.5} />
          돌아가기
        </button>

        {/* 프로필 카드 */}
        <div style={s.profileCard} className="up-profile-card">
          {/* 아바타 */}
          <div style={s.avatarWrap}>
            {avatarSrc
              ? <img src={avatarSrc} alt={user.nickname} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : <span style={s.avatarInitial}>{user.nickname[0].toUpperCase()}</span>
            }
          </div>

          <h1 style={s.nickname}>{user.nickname}</h1>
          {user.email && <p style={s.email}>{user.email}</p>}

          {/* 팔로우 버튼 */}
          {!isMyProfile && (
            <button className="up-follow" onClick={handleFollow} style={{
              ...s.followBtn,
              background: isFollowing ? 'rgba(107,130,160,0.08)' : 'linear-gradient(135deg, #c47a8a 0%, #6B82A0 100%)',
              color: isFollowing ? '#6B82A0' : '#fff',
              border: isFollowing ? '1.5px solid rgba(107,130,160,0.25)' : 'none',
            }}>
              {isFollowing
                ? <><UserCheck size={15} strokeWidth={2.5} /> 팔로잉</>
                : <><UserPlus size={15} strokeWidth={2.5} /> 팔로우</>
              }
            </button>
          )}

          {/* 통계 */}
          <div style={s.statRow} className="up-stat-row">
            <div style={{ ...s.statItem, cursor: 'pointer' }} onClick={() => openFollowModal('followers')}>
              <span style={s.statValue}>{user.followerCount}</span>
              <span style={{ ...s.statLabel, textDecoration: 'underline dotted' }}>팔로워</span>
            </div>
            <div style={s.statDivider} />
            <div style={{ ...s.statItem, cursor: 'pointer' }} onClick={() => openFollowModal('following')}>
              <span style={s.statValue}>{user.followingCount}</span>
              <span style={{ ...s.statLabel, textDecoration: 'underline dotted' }}>팔로잉</span>
            </div>
            <div style={s.statDivider} />
            <div style={s.statItem}>
              <span style={s.statValue}>{artworks.length}</span>
              <span style={s.statLabel}>작품</span>
            </div>
          </div>
        </div>

        {/* 갤러리 */}
        <div style={s.galleryHeader}>
          <h2 style={s.galleryTitle}>작품</h2>
          <span style={s.galleryCount}>{artworks.length}개</span>
        </div>

        {artworks.length > 0 ? (
          <div style={s.grid}>
            {artworks.map((artwork, i) => (
              <div key={artwork.id} style={{ animation: `fadeUp ${0.3 + i * 0.04}s ease both` }}>
                <ArtworkCard artwork={artwork} onLike={() => handleLike(artwork.id)} variant="polaroid" />
              </div>
            ))}
          </div>
        ) : (
          <div style={s.empty}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎨</div>
            <p style={{ margin: 0, fontSize: 15, color: '#9ca3af', fontWeight: 600 }}>아직 작품이 없어요</p>
          </div>
        )}
      </main>

      {/* 팔로워/팔로잉 모달 */}
      {followModal && (
        <div onClick={() => setFollowModal(null)} style={{
          position: 'fixed', inset: 0, zIndex: 500,
          background: 'rgba(50,40,70,0.4)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            position: 'relative',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(245,240,248,0.95) 100%)',
            borderRadius: 28, width: '100%', maxWidth: 400,
            boxShadow: '0 24px 64px rgba(107,130,160,0.22)',
            border: '1.5px solid rgba(255,255,255,0.8)',
            overflow: 'hidden',
          }}>
            <button onClick={() => setFollowModal(null)} style={{
              position: 'absolute', top: 14, right: 16,
              background: 'none', border: 'none', color: '#9ca3af',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
            }}><X size={18} /></button>
            <p style={{
              fontSize: 11, fontWeight: 700, letterSpacing: 2,
              color: '#c47a8a', textTransform: 'uppercase', margin: 0,
              padding: '28px 28px 16px',
            }}>
              {followModal === 'followers' ? '팔로워' : '팔로잉'}
            </p>
            {followListLoading ? (
              <p style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af', fontSize: 14, fontWeight: 600 }}>불러오는 중...</p>
            ) : followList.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '32px 0 36px', color: '#9ca3af', fontSize: 14, fontWeight: 600 }}>
                {followModal === 'followers' ? '아직 팔로워가 없어요' : '팔로우한 사람이 없어요'}
              </p>
            ) : (
              <div style={{ maxHeight: 420, overflowY: 'auto', paddingBottom: 12 }}>
                {followList.map(u => {
                  const uAvatar = u.profileImageUrl
                    ? (u.profileImageUrl.startsWith('/uploads') ? `http://localhost:8080${u.profileImageUrl}` : u.profileImageUrl)
                    : null
                  return (
                    <div key={u.id}
                      onClick={() => { setFollowModal(null); navigate(`/user/${u.id}`) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 24px', cursor: 'pointer', transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(107,130,160,0.06)'}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                    >
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg, rgba(196,122,138,0.15), rgba(107,130,160,0.15))',
                        border: '2px solid rgba(255,255,255,0.8)',
                        boxShadow: '0 2px 8px rgba(107,130,160,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                      }}>
                        {uAvatar
                          ? <img src={uAvatar} alt={u.nickname} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                          : <span style={{
                            fontSize: 18, fontWeight: 900,
                            background: 'linear-gradient(135deg, #c47a8a, #6B82A0)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                          }}>{u.nickname?.[0]?.toUpperCase()}</span>
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#3d3d5c' }}>{u.nickname}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>팔로워 {u.followerCount}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
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
    animation: 'fadeUp 0.5s ease both',
  },
  backBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    marginBottom: 24, padding: '8px 16px',
    fontSize: 13, fontWeight: 600, color: '#6B82A0',
    background: 'rgba(107,130,160,0.07)',
    border: '1.5px solid rgba(107,130,160,0.18)',
    borderRadius: 100, cursor: 'pointer', transition: 'background 0.15s',
  },
  profileCard: {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(245,240,248,0.85) 100%)',
    border: '1.5px solid rgba(255,255,255,0.75)',
    borderRadius: 24, padding: '40px 48px',
    boxShadow: '0 8px 40px rgba(107,130,160,0.13)',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    textAlign: 'center', marginBottom: 36,
  },
  avatarWrap: {
    width: 100, height: 100, borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(196,122,138,0.15), rgba(107,130,160,0.15))',
    border: '3px solid rgba(255,255,255,0.9)',
    boxShadow: '0 4px 20px rgba(107,130,160,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', marginBottom: 16, flexShrink: 0,
  },
  avatarInitial: {
    fontSize: 36, fontWeight: 900,
    background: 'linear-gradient(135deg, #c47a8a, #6B82A0)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  },
  nickname: {
    fontSize: 26, fontWeight: 900, margin: '0 0 6px',
    background: 'linear-gradient(135deg, #c47a8a 0%, #6B82A0 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
    letterSpacing: -0.5,
  },
  email: { fontSize: 13, color: '#9ca3af', margin: '0 0 20px', fontWeight: 500 },
  followBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '10px 24px', borderRadius: 100,
    fontSize: 13, fontWeight: 700, cursor: 'pointer',
    transition: 'all 0.2s', marginBottom: 28,
  },
  statRow: {
    display: 'flex', alignItems: 'center', gap: 0,
    background: 'rgba(107,130,160,0.05)', borderRadius: 14,
    padding: '16px 32px', width: '100%', maxWidth: 360,
    justifyContent: 'center',
  },
  statItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: 1 },
  statDivider: { width: 1, height: 32, background: 'rgba(107,130,160,0.15)', flexShrink: 0 },
  statValue: { fontSize: 20, fontWeight: 900, color: '#3d3d5c' },
  statLabel: { fontSize: 12, color: '#9ca3af', fontWeight: 600 },
  galleryHeader: {
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
  },
  galleryTitle: { fontSize: 16, fontWeight: 800, color: '#4a4a6a', margin: 0 },
  galleryCount: {
    fontSize: 12, fontWeight: 700, color: '#6B82A0',
    background: 'rgba(107,130,160,0.1)', borderRadius: 6, padding: '2px 8px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 24,
  },
  empty: {
    textAlign: 'center', padding: '60px 20px',
    background: 'rgba(255,255,255,0.7)', borderRadius: 20,
    border: '1.5px dashed rgba(107,130,160,0.2)',
  },
}

export default UserProfile
