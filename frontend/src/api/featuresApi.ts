import type { CreateFeatureRequest, FeatureDto } from '../../../contracts/feature'
import { get, post, postFile } from './httpClient'

export function getFeatures(): Promise<FeatureDto[]> {
  return get<FeatureDto[]>('/features')
}

export function createFeature(input: CreateFeatureRequest): Promise<{ id: number }> {
  return post<{ id: number }>('/features', input)
}

export function uploadFeatureIcon(file: File): Promise<{ iconPath: string }> {
  return postFile<{ iconPath: string }>('/features/icons', file, 'image/svg+xml')
}
