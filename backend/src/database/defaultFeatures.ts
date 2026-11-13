import type { CreateFeatureRequest } from '../../../contracts/feature.js'

export const defaultFeatures: CreateFeatureRequest[] = [
  { name: 'Windows', description: null, iconPath: '/icons/windows.svg', category: 'OS' },
  { name: 'Linux', description: null, iconPath: '/icons/linux.svg', category: 'OS' },
  { name: 'ChromeOS', description: null, iconPath: '/icons/chromeos.svg', category: 'OS' },
  { name: 'Adobe', description: null, iconPath: '/icons/adobe.svg', category: 'SOFTWARE' },
  { name: 'Blender', description: null, iconPath: '/icons/blender.svg', category: 'SOFTWARE' },
  {
    name: 'Height-adjustable desk',
    description: null,
    iconPath: '/icons/height-adjustable-desk.svg',
    category: 'HARDWARE',
  },
]
