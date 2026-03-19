import client from './client'

export interface UserProfile {
  id: string
  email: string
  name: string
  nickname: string
  phone: string
  profileImageUrl: string | null
  tokenBalance: number
  followerCount: number
  followingCount: number
  provider: string
  createdAt: string
}

export interface ArtworkSummary {
  id: string
  title: string | null
  topic: string | null
  imageUrl: string | null
  status: string
  isPublic: boolean
  likeCount: number
  createdAt: string
}

export const getMyProfile = () =>
  client.get<UserProfile>('/users/me').then(res => res.data)

export const updateMyProfile = (data: { name?: string; nickname?: string; phone?: string }) =>
  client.put<UserProfile>('/users/me', data).then(res => res.data)

export const changePassword = (data: { currentPassword: string; newPassword: string }) =>
  client.put<{ message: string }>('/users/me/password', data).then(res => res.data)

export const uploadProfilePhoto = (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return client.post<UserProfile>('/users/me/photo', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(res => res.data)
}

export const getMyArtworks = () =>
  client.get<ArtworkSummary[]>('/users/me/artworks').then(res => res.data)
