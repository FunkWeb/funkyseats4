import type { CreateRoomRequest, RoomDto } from '../../../../contracts/room'

export interface RoomFormValues {
  name: string
  slug: string
  description: string
  maxDaysAhead: string
}

export type RoomFormErrors = Partial<Record<keyof RoomFormValues, string>>

export const emptyRoomForm: RoomFormValues = {
  name: '',
  slug: '',
  description: '',
  maxDaysAhead: '',
}

export function roomToFormValues(room: RoomDto): RoomFormValues {
  return {
    name: room.name,
    slug: room.slug,
    description: room.description ?? '',
    maxDaysAhead: String(room.maxDaysAhead),
  }
}

export function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
    .replace(/-+$/g, '')
}

export function validateRoomForm(values: RoomFormValues): RoomFormErrors {
  const errors: RoomFormErrors = {}
  const maxDaysAhead = values.maxDaysAhead.trim()

  if (!values.name.trim()) errors.name = 'Skriv inn et navn.'
  if (!values.slug) {
    errors.slug = 'Skriv inn en slug.'
  } else if (values.slug.length > 50 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug)) {
    errors.slug = 'Bruk små bokstaver, tall og enkle bindestreker (maks 50 tegn).'
  }
  if (
    maxDaysAhead &&
    (!/^\d+$/.test(maxDaysAhead) ||
      !Number.isSafeInteger(Number(maxDaysAhead)) ||
      Number(maxDaysAhead) <= 0)
  ) {
    errors.maxDaysAhead = 'Må være et positivt heltall.'
  }

  return errors
}

export function toRoomRequest(values: RoomFormValues): CreateRoomRequest {
  const maxDaysAhead = values.maxDaysAhead.trim()

  return {
    name: values.name.trim(),
    slug: values.slug,
    description: values.description.trim() || null,
    ...(maxDaysAhead ? { maxDaysAhead: Number(maxDaysAhead) } : {}),
  }
}
