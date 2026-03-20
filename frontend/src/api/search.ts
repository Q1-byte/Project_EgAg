import client from './client'
import type { SearchResponse } from '../types'

export const search = async (query: string): Promise<SearchResponse> => {
  const response = await client.get<SearchResponse>('/search', {
    params: { query }
  })
  return response.data
}
