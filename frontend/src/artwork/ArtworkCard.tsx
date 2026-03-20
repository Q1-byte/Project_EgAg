import { Link } from 'react-router-dom'
import type { ArtworkResponse } from '../types'

interface ArtworkCardProps {
  artwork: ArtworkResponse
}

const ArtworkCard = ({ artwork }: ArtworkCardProps) => {
  return (
    <Link to={`/artwork/${artwork.id}`} className="artwork-card">
      <div className="artwork-image">
        {artwork.imageUrl ? (
          <img
            src={artwork.imageUrl}
            alt={artwork.title || '제목 없음'}
          />
        ) : (
          <div className="avatar-placeholder">🎨</div>
        )}
        {!artwork.isPublic && <div className="private-badge">나만 보기</div>}
      </div>
      <div className="artwork-meta">
        <div className="meta-content">
          <h3 className="artwork-title">{artwork.title || artwork.topic || '제목 없음'}</h3>
          <p className="artwork-topic">{artwork.topic}</p>
        </div>
        <div className="artwork-stats">
          <span className="stat-pill">❤️ {artwork.likeCount}</span>
        </div>
      </div>
    </Link>
  )
}

export default ArtworkCard
