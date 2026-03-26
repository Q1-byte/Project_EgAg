import { Link } from 'react-router-dom'
import type { ArtworkResponse } from '../types'
import LikeButton from '../components/LikeButton'
import { resolveImageUrl } from '../utils/imageUrl'

interface ArtworkCardProps {
  artwork: ArtworkResponse
  onLike?: (id: string) => void
  variant?: 'default' | 'polaroid'
  showPrivateBadge?: boolean
}

const ArtworkCard = ({ artwork, onLike, variant = 'default', showPrivateBadge = true }: ArtworkCardProps) => {
  return (
    <Link to={`/artwork/${artwork.id}`} className={`artwork-card ${variant}`}>
      <div className="artwork-image">
        {artwork.imageUrl ? (
          <img
            src={resolveImageUrl(artwork.imageUrl)}
            alt={artwork.title || '제목 없음'}
          />
        ) : (
          <div className="avatar-placeholder">🎨</div>
        )}
        {showPrivateBadge && !artwork.isPublic && <div className="private-badge">나만 보기</div>}
      </div>
      <div className="artwork-meta">
        <h3 className="artwork-title">{artwork.title || artwork.topic || '제목 없음'}</h3>
        {variant !== 'polaroid' && <p className="artwork-topic">{artwork.topic}</p>}
      </div>
      <div className="artwork-stats" onClick={(e) => e.preventDefault()}>
        <div onClick={(e) => e.stopPropagation()}>
          <LikeButton 
            isLiked={artwork.isLiked || false} 
            likeCount={artwork.likeCount} 
            onToggle={() => onLike?.(artwork.id)}
            variant={variant === 'polaroid' ? 'slim' : 'default'}
          />
        </div>
      </div>
    </Link>
  )
}

export default ArtworkCard
