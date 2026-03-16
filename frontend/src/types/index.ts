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
  createdAt: string
}

export interface AuthResponse {
  user: UserResponse
  accessToken: string
  refreshToken: string
}

export interface ApiError {
  error: {
    code: string
    message: string
  }
}
