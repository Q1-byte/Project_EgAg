export interface StrokeData {
  id: string
  points: number[]
  color: string
  strokeWidth: number
  isAI: boolean
}

export interface ArtworkResponse {
  id: string
  userId: string
  userNickname: string
  title: string | null
  topic: string | null
  imageUrl: string | null
  strokeData: StrokeData[]
  status: string
  isPublic: boolean
  likeCount: number
  turnCount: number
  createdAt: string
  completedAt: string | null
}

export interface UserResponse {
  id: string
  email: string
  nickname: string
  profileImageUrl: string | null
  role: string
  tokenBalance: number
  followerCount: number
  followingCount: number
  isFollowing: boolean
  createdAt: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  role: string;
  userId: string
  nickname: string
  tokenBalance: number
}

export interface NotificationResponse {
  id: string
  type: 'LIKE' | 'FOLLOW'
  actorId: string
  actorNickname: string
  actorProfileImage: string | null
  artworkId: string | null
  artworkTitle: string | null
  isRead: boolean
  createdAt: string
}

export interface SearchResponse {
  artworks: ArtworkResponse[]
  users: UserResponse[]
}

export interface ApiError {
  error: {
    code: string
    message: string
  }
}
