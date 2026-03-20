import client from './client'
import type { ArtworkResponse } from '../types'

export const getArtwork = async (id: string): Promise<ArtworkResponse> => {
  const response = await client.get<ArtworkResponse>(`/artworks/${id}`)
  return response.data
}

export const exploreArtworks = async (
  sort: string = 'latest',
  cursor?: string,
  limit: number = 20
): Promise<ArtworkResponse[]> => {
  const response = await client.get<ArtworkResponse[]>('/artworks/explore', {
    params: { sort, cursor, limit },
  })
  return response.data
}

export const toggleLikeArtwork = async (id: string): Promise<void> => {
  await client.post(`/artworks/${id}/like`)
}

export const deleteArtwork = async (id: string): Promise<void> => {
  await client.delete(`/artworks/${id}`)
}

export const reportArtwork = async (id: string, data: { reason: string, description?: string }): Promise<void> => {
  await client.post(`/artworks/${id}/report`, data)
}
