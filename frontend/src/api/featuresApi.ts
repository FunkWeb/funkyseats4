import type {
  CreateFeatureRequest,
  FeatureDto,
  UpdateFeatureRequest,
} from '../../../contracts/feature'
import { del, get, patch, post, postFile } from './httpClient'

export function getFeatures(): Promise<FeatureDto[]> {
  return get<FeatureDto[]>('/features')
}

export function createFeature(input: CreateFeatureRequest): Promise<{ id: number }> {
  return post<{ id: number }>('/features', input)
}

export function updateFeature(id: number, input: UpdateFeatureRequest): Promise<void> {
  return patch<void>(`/features/${id}`, input)
}

export function deleteFeature(id: number): Promise<void> {
  return del<void>(`/features/${id}`)
}

export function uploadFeatureIcon(file: File): Promise<{ iconPath: string }> {
  return postFile<{ iconPath: string }>('/features/icons', file, 'image/svg+xml')
}
