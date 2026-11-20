import { useQuery } from '@tanstack/react-query'
import { getFeatures } from '../../api/featuresApi'

export const featuresQueryKey = ['features'] as const

export function useFeatures() {
  return useQuery({ queryKey: featuresQueryKey, queryFn: getFeatures })
}
