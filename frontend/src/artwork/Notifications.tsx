import { useEffect, useState } from 'react'
import { getNotifications, markNotificationsAsRead } from '../api/notification'
import type { NotificationResponse } from '../types'
import { Link } from 'react-router-dom'

const Notifications = () => {
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
                <img src={n.actorProfileImage} alt={n.actorNickname} />
              ) : (
                <div className="avatar-placeholder-sm">{n.actorNickname[0].toUpperCase()}</div>
              )}
            </div>
            <div className="notification-content">
              <p>
                <span className="actor-name">{n.actorNickname}</span>
                {n.type === 'LIKE' ? (
                   <>님이 나의 그림 <Link to={`/artwork/${n.artworkId}`} className="artwork-link">"{n.artworkTitle}"</Link>을 좋아해요! ❤️</>
                ) : (
                   <>님이 나를 팔로우하기 시작했어요! ✨</>
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
