import client from './client'

export interface UserProfile {
  id: string
  email: string
  subEmail: string | null
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
  userImageData: string | null
  status: string
  isPublic: boolean
  likeCount: number
  createdAt: string
}

export const getMyProfile = () =>
  client.get<UserProfile>('/users/me').then(res => res.data)

export const updateMyProfile = (data: { name?: string; nickname?: string; phone?: string; email?: string }) =>
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

export const completeOnboarding = (data: { name: string; phone: string; nickname: string; email?: string }) =>
  client.post<UserProfile>('/users/me/onboarding', data).then(res => res.data)

export const getMyArtworks = () =>
  client.get<ArtworkSummary[]>('/users/me/artworks').then(res => res.data)

export const saveArtworkToGallery = (imageUrl: string, userImageData: string, title: string, source: string) =>
  client.post<ArtworkSummary>('/artworks', { imageUrl, userImageData, title, source }).then(res => res.data)

export const toggleArtworkVisibility = (id: string) =>
  client.patch<ArtworkSummary>(`/artworks/${id}/visibility`).then(res => res.data)

export const deleteArtwork = (id: string) =>
  client.delete(`/artworks/${id}`)

export const getPublicArtworks = () =>
  client.get<ArtworkSummary[]>('/gallery/public').then(res => res.data)
