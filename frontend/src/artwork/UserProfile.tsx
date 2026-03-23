import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getUserProfile, getUserArtworks, toggleFollowUser } from '../api/user'
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
      if (confirm('팔로우하려면 로그인이 필요해요! 로그인 페이지로 갈까요?')) {
        navigate('/login')
      }
      return
    }
    try {
      await toggleFollowUser(id)
      setIsFollowing(!isFollowing)
      setUser({
        ...user,
        followerCount: isFollowing ? user.followerCount - 1 : user.followerCount + 1
      })
    } catch (error) {
      console.error('Failed to toggle follow:', error)
    }
  }
  
  const handleLike = async (artId: string) => {
    try {
      await toggleLikeArtwork(artId)
      setArtworks((prev: ArtworkResponse[]) => prev.map((art: ArtworkResponse) => {
        if (art.id === artId) {
          const isLiked = !art.isLiked
          return {
            ...art,
            isLiked,
            likeCount: isLiked ? (art.likeCount || 0) + 1 : Math.max(0, (art.likeCount || 0) - 1)
          }
        }
        return art
      }))
    } catch (error) {
      console.error('Failed to toggle like:', error)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--mesh-candy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: '#6B82A0' }}>
      잠시만 기다려주세요! 🐣✨
    </div>
  )
  
  if (!user) return (
    <div style={{ minHeight: '100vh', background: 'var(--mesh-candy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: '#FF5C8D' }}>
      친구를 찾을 수 없어요... 😢
    </div>
  )

  const s = {
    page: {
      minHeight: '100vh',
      background: 'var(--mesh-candy)',
      paddingTop: 120,
      paddingBottom: 80,
      position: 'relative' as const,
      overflow: 'hidden' as const
    },
    blobs: {
      position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' as const, zIndex: 0
    },
    blob1: { position: 'absolute' as const, top: '10%', left: '5%', width: 400, height: 400, background: 'rgba(255, 214, 232, 0.4)', filter: 'blur(80px)', borderRadius: '50%' },
    blob2: { position: 'absolute' as const, top: '40%', right: '5%', width: 500, height: 500, background: 'rgba(165, 216, 255, 0.3)', filter: 'blur(100px)', borderRadius: '50%' },
    
    container: { maxWidth: 1000, margin: '0 auto', padding: '0 24px', position: 'relative' as const, zIndex: 1 },
    
    headerCard: {
      background: 'rgba(255, 255, 255, 0.5)',
      backdropFilter: 'blur(20px)',
      borderRadius: 48,
      padding: '48px 40px',
      border: '2px solid rgba(255, 255, 255, 0.7)',
      boxShadow: '0 20px 50px rgba(107, 130, 160, 0.08)',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      textAlign: 'center' as const,
      marginBottom: 60,
      animation: 'fadeUp 0.8s ease-out'
    },
    
    avatarWrapper: {
      width: 140,
      height: 140,
      borderRadius: 50,
      overflow: 'hidden',
      border: '6px solid #fff',
      boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
      marginBottom: 24,
      background: '#fff'
    },
    avatarImg: { width: '100%', height: '100%', objectFit: 'cover' as const },
    avatarPlaceholder: { 
      width: '100%', height: '100%', 
      background: 'linear-gradient(135deg, #FFD6E8, #A5D8FF)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 48, fontWeight: 900, color: '#fff'
    },
    
    nickname: {
      fontSize: 42,
      fontWeight: 900,
      color: '#1a1a2e',
      marginBottom: 12,
      letterSpacing: -1.5
    },
    emailBadge: {
      padding: '6px 16px',
      background: 'rgba(107, 130, 160, 0.1)',
      borderRadius: 20,
      fontSize: 14,
      color: '#6B82A0',
      fontWeight: 700,
      marginBottom: 32
    },
    
    buttons: { display: 'flex', gap: 12, marginBottom: 40 },
    followBtn: {
      padding: '14px 32px',
      borderRadius: 24,
      border: 'none',
      background: isFollowing ? '#fff' : 'linear-gradient(135deg, #FFD6E8, #FF85B3)',
      color: isFollowing ? '#FF85B3' : '#fff',
      fontSize: 18,
      fontWeight: 800,
      cursor: 'pointer',
      boxShadow: isFollowing ? '0 4px 15px rgba(0,0,0,0.05)' : '0 10px 25px rgba(255, 133, 179, 0.3)',
      transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    },
    
    statGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 20,
      width: '100%',
      maxWidth: 600
    },
    statItem: {
      background: 'rgba(255, 255, 255, 0.6)',
      padding: '20px 10px',
      borderRadius: 24,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 4
    },
    statValue: { fontSize: 24, fontWeight: 900, color: '#1a1a2e' },
    statLabel: { fontSize: 13, fontWeight: 700, color: '#8a8aaa' },
    
    galleryTitle: {
      fontSize: 28,
      fontWeight: 900,
      color: '#1a1a2e',
      marginBottom: 32,
      display: 'flex',
      alignItems: 'center',
      gap: 12
    },
    
    artworkGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: 32
    },
    
    emptyState: {
      textAlign: 'center' as const,
      padding: '100px 20px',
      background: 'rgba(255, 255, 255, 0.4)',
      borderRadius: 40,
      border: '3px dashed rgba(255, 255, 255, 0.7)',
      color: '#8a8aaa',
      fontSize: 18,
      fontWeight: 700,
      gridColumn: '1 / -1'
    }
  }

  return (
    <div style={s.page} className="user-profile-page">
      <Header />
      
      <div style={s.blobs}>
        <div style={s.blob1}></div>
        <div style={s.blob2}></div>
      </div>

      <div style={s.container}>
        <header style={s.headerCard}>
          <div style={s.avatarWrapper}>
            {user.profileImageUrl ? (
              <img 
                src={user.profileImageUrl.startsWith('/uploads') ? `http://localhost:8080${user.profileImageUrl}` : user.profileImageUrl} 
                alt={user.nickname} 
                style={s.avatarImg} 
              />
            ) : (
              <div style={s.avatarPlaceholder}>{user.nickname[0].toUpperCase()}</div>
            )}
          </div>
          
          <h1 style={s.nickname}>{user.nickname}</h1>
          <div style={s.emailBadge}>{user.email}</div>

          <div style={s.buttons}>
            {currentUserId && id !== currentUserId && (
              <button onClick={handleFollow} style={s.followBtn} className="hover-scale">
                {isFollowing ? '우리는 단짝! ✅' : '단짝 신청하기 ✨'}
              </button>
            )}
          </div>

          <div style={s.statGrid}>
            <div style={s.statItem}>
              <span style={s.statValue}>{user.followerCount}</span>
              <span style={s.statLabel}>내 팬 💖</span>
            </div>
            <div style={s.statItem}>
              <span style={s.statValue}>{user.followingCount}</span>
              <span style={s.statLabel}>내가 찜한 친구 ⭐</span>
            </div>
            <div style={s.statItem}>
              <span style={s.statValue}>{artworks.length}</span>
              <span style={s.statLabel}>그린 그림 🎨</span>
            </div>
          </div>
        </header>

        <section>
          <h2 style={s.galleryTitle}>
            자랑스러운 나의 전시회 <span style={{ fontSize: '1.2em' }}>💎</span>
          </h2>
          
          <div style={s.artworkGrid}>
            {artworks.length > 0 ? (
              artworks.map((artwork) => (
                <ArtworkCard 
                  key={artwork.id} 
                  artwork={artwork} 
                  onLike={() => handleLike(artwork.id)} 
                  variant="polaroid"
                />
              ))
            ) : (
              <div style={s.emptyState}>
                <div style={{ fontSize: 64, marginBottom: 20 }}>☁️</div>
                아직 전시된 그림이 없어요.<br/>멋진 그림을 그려보길 기다릴게요!
              </div>
            )}
          </div>
        </section>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hover-scale:hover {
          transform: scale(1.05);
        }
      `}</style>
    </div>
  )
}

export default UserProfile
