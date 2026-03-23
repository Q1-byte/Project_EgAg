import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getUserProfile, getUserArtworks, toggleFollowUser } from '../api/user'
import { toggleLikeArtwork } from '../api/artwork'
import { useAuthStore } from '../stores/useAuthStore'
import type { UserResponse, ArtworkResponse } from '../types'
import ArtworkCard from './ArtworkCard'

const UserProfile = () => {
  const { id } = useParams<{ id: string }>()
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
  
  const handleLike = async (id: string) => {
    try {
      await toggleLikeArtwork(id)
      setArtworks((prev: ArtworkResponse[]) => prev.map((art: ArtworkResponse) => {
        if (art.id === id) {
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

  if (loading) return <div className="loading-state">Loading profile...</div>
  if (!user) return <div className="error-state">User not found</div>

  return (
    <div className="layout-container user-profile-page">
      <header className="profile-header-premium">
        <div className="profile-avatar-wrapper">
          {user.profileImageUrl ? (
            <img src={user.profileImageUrl} alt={user.nickname} className="avatar-premium" />
          ) : (
            <div className="avatar-premium">{user.nickname[0].toUpperCase()}</div>
          )}
        </div>
        
        <div className="profile-info-premium">
          <span className="profile-email-badge">{user.email}</span>
          <h1>{user.nickname}</h1>
          
          <div className="premium-stat-grid">
            <div className="premium-stat-item">
              <span className="premium-stat-value">{user.followerCount}</span>
              <span className="premium-stat-label">팔로워</span>
            </div>
            <div className="premium-stat-item">
              <span className="premium-stat-value">{user.followingCount}</span>
              <span className="premium-stat-label">팔로잉</span>
            </div>
            <div className="premium-stat-item">
              <span className="premium-stat-value">{artworks.length}</span>
              <span className="premium-stat-label">그린 그림</span>
            </div>
          </div>

          <div className="profile-actions mt-8">
            {currentUserId && id !== currentUserId && (
              <button 
                onClick={handleFollow}
                className={`primary-button follow-button ${isFollowing ? 'following' : ''}`}
              >
                {isFollowing ? '팔로잉 ✅' : '팔로우'}
              </button>
            )}
            {!currentUserId && (
               <button 
                onClick={() => {
                  if (confirm('팔로우하려면 로그인이 필요합니다. 로그인 페이지로 이동할까요?')) {
                    window.location.href = '/login';
                  }
                }}
                className="primary-button follow-button"
              >
                팔로우
              </button>
            )}
          </div>
        </div>
      </header>

      <section className="profile-gallery">
        <h2 className="section-title">자랑스런 그림들 🤩</h2>
        <div className="artwork-grid">
          {artworks.map((artwork) => (
            <ArtworkCard key={artwork.id} artwork={artwork} onLike={handleLike} />
          ))}
          {artworks.length === 0 && (
            <p className="no-data">아직 이 친구가 그린 그림이 없어요. ☁️</p>
          )}
        </div>
      </section>
    </div>
  )
}

export default UserProfile
