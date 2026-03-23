import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getNotifications, markNotificationsAsRead } from '../api/notification'
import type { NotificationResponse } from '../types'

const Notifications = () => {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<NotificationResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await getNotifications()
        setNotifications(data)
        if (data.length > 0) {
          await markNotificationsAsRead()
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchNotifications()
  }, [])

  if (loading) return (
    <div className="loading-state">
      <div className="pulse-loader"></div>
      <p>새로운 소식을 확인하고 있어요... 🍭</p>
    </div>
  )

  return (
    <div className="layout-container notifications-page">
      <header className="section-header premium-hero" style={{ background: 'var(--gradient-candy)', border: 'none' }}>
        <h1 className="section-title">알림 센터 🔔</h1>
        <p className="section-subtitle" style={{ color: 'var(--text-h)', opacity: 0.8 }}>나의 그림과 친구들에 대한 새로운 소식을 확인해 보세요!</p>
      </header>

      <div className="notification-list">
        {notifications.map((n) => (
          <div key={n.id} className={`notification-item ${n.isRead ? 'read' : 'unread'}`}>
            <div className="actor-avatar">
              {n.actorProfileImage ? (
                <img src={n.actorProfileImage} alt={n.actorNickname} style={{ cursor: 'pointer' }} onClick={() => navigate(`/profile/${n.actorId}`)} />
              ) : (
                <div className="avatar-placeholder-sm" style={{ cursor: 'pointer' }} onClick={() => navigate(`/profile/${n.actorId}`)}>{n.actorNickname[0].toUpperCase()}</div>
              )}
            </div>
            <div className="notification-content">
              <p>
                <Link to={`/profile/${n.actorId}`} className="actor-name" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 800 }}>{n.actorNickname}</Link>
                {n.type === 'LIKE' ? (
                   <>님이 나의 그림 <Link to={`/artwork/${n.artworkId}`} className="artwork-link" style={{ fontWeight: 700, color: '#333' }}>"{n.artworkTitle}"</Link>을 좋아해요! ❤️</>
                ) : n.type === 'FOLLOW' ? (
                   <>님이 나를 팔로우하기 시작했어요! ✨</>
                ) : n.type === 'FINISHED' ? (
                   <>내가 참여한 그림 <Link to={`/artwork/${n.artworkId}`} className="artwork-link" style={{ fontWeight: 700, color: '#333' }}>"{n.artworkTitle}"</Link>이 완성되었어요! 🎨</>
                ) : n.type === 'TOKEN' ? (
                   <>새로운 토큰 보상을 획득했어요! 🎟️</>
                ) : (
                   <>새로운 알림이 도착했습니다!</>
                )}
              </p>
              <span className="notification-time">
                {new Date(n.createdAt).toLocaleString()}
              </span>
            </div>
            {!n.isRead && <div className="unread-dot"></div>}
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="empty-notifications" style={{ background: 'white', borderRadius: '32px', padding: '60px' }}>
            <div className="empty-icon" style={{ fontSize: '64px', marginBottom: '20px' }}>🌈</div>
            <p style={{ fontWeight: 800, color: 'var(--accent)' }}>아직 새로운 알림이 없어요!</p>
            <p style={{ fontSize: '14px', color: 'var(--text)', marginTop: '8px' }}>친구들의 그림에 좋아요를 눌러보거나 팔로우를 해보세요.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Notifications
