import { useState, type FormEvent } from 'react'
import type { CreateRoomRequest, RoomDto } from '../../../../contracts/room'
import { TextArea } from '../../components/TextArea'
import { TextField } from '../../components/TextField'
import {
  emptyRoomForm,
  roomToFormValues,
  slugFromName,
  toRoomRequest,
  validateRoomForm,
  type RoomFormValues,
} from './roomForm'
import styles from './RoomForm.module.css'

export interface RoomFormProps {
  id: string
  room?: RoomDto
  onSubmit: (input: CreateRoomRequest) => void
}

export function RoomForm({ id, room, onSubmit }: RoomFormProps) {
  const [values, setValues] = useState<RoomFormValues>(() =>
    room ? roomToFormValues(room) : emptyRoomForm,
  )
  const [slugEdited, setSlugEdited] = useState(Boolean(room))
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const errors = validateRoomForm(values)
  const visibleErrors = hasSubmitted ? errors : {}

  function updateField(field: keyof RoomFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setHasSubmitted(true)
    if (Object.keys(errors).length) return
    onSubmit(toRoomRequest(values))
  }

  return (
    <form id={id} className={styles.form} onSubmit={handleSubmit} noValidate>
      <TextField
        label="Navn"
        value={values.name}
        onChange={(event) => {
          const name = event.target.value
          setValues((current) => ({
            ...current,
            name,
            slug: slugEdited ? current.slug : slugFromName(name),
          }))
        }}
        required
        error={visibleErrors.name}
      />
      <TextField
        label="Slug"
        value={values.slug}
        onChange={(event) => {
          setSlugEdited(true)
          updateField('slug', event.target.value)
        }}
        required
        maxLength={50}
        helperText="Må være unik. Bruk små bokstaver, tall og enkle bindestreker."
        error={visibleErrors.slug}
      />
      <TextArea
        label="Beskrivelse"
        value={values.description}
        onChange={(event) => updateField('description', event.target.value)}
        rows={4}
      />
      <TextField
        label="Maks dager frem i tid"
        type="number"
        min={1}
        step={1}
        value={values.maxDaysAhead}
        onChange={(event) => updateField('maxDaysAhead', event.target.value)}
        error={visibleErrors.maxDaysAhead}
      />
    </form>
  )
}
