import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import type { CreateRoomRequest, RoomDto } from '../../../../contracts/room'
import { Button } from '../../components/Button'
import { TextArea } from '../../components/TextArea'
import { TextField } from '../../components/TextField'
import {
  emptyRoomForm,
  roomToFormValues,
  slugFromName,
  toRoomRequest,
  validateRoomForm,
  type RoomFormValues,
} from './roomFormUtils'
import styles from './RoomForm.module.css'

const MAX_SEAT_MAP_BYTES = 2 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])
const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp']

function isValidSeatMapFile(file: File): boolean {
  const lowerName = file.name.toLowerCase()
  const hasAllowedExtension = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext))
  const hasAllowedMime = file.type === '' || ALLOWED_MIME_TYPES.has(file.type.toLowerCase())
  return hasAllowedExtension && hasAllowedMime
}

export interface RoomFormSubmitData {
  input: CreateRoomRequest
  seatMapFile: File | null
}

export interface RoomFormProps {
  id: string
  room?: RoomDto
  disabled?: boolean
  onSubmit: (data: RoomFormSubmitData) => void
}

export function RoomForm({ id, room, disabled = false, onSubmit }: RoomFormProps) {
  const fileInputId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [values, setValues] = useState<RoomFormValues>(() =>
    room ? roomToFormValues(room) : emptyRoomForm,
  )
  const [slugEdited, setSlugEdited] = useState(Boolean(room))
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [seatMapPath, setSeatMapPath] = useState<string | null>(room?.seatMapPath ?? null)
  const [seatMapFile, setSeatMapFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!seatMapFile) {
      setPreviewUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(seatMapFile)
    setPreviewUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [seatMapFile])

  const errors = validateRoomForm(values)
  const visibleErrors = hasSubmitted ? errors : {}

  function updateField(field: keyof RoomFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null

    if (!file) {
      setSeatMapFile(null)
      setFileError(undefined)
      return
    }

    if (!isValidSeatMapFile(file)) {
      setSeatMapFile(null)
      setFileError('Romkartet må være en PNG-, JPEG- eller WebP-fil.')
      event.target.value = ''
      return
    }

    if (file.size > MAX_SEAT_MAP_BYTES) {
      setSeatMapFile(null)
      setFileError('Romkartet kan ikke være større enn 2 MB.')
      event.target.value = ''
      return
    }

    setFileError(undefined)
    setSeatMapFile(file)
  }

  function handleRemoveSeatMap() {
    setSeatMapPath(null)
    setSeatMapFile(null)
    setFileError(undefined)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setHasSubmitted(true)
    if (Object.keys(errors).length || fileError) return
    onSubmit({
      input: {
        ...toRoomRequest(values),
        seatMapPath,
      },
      seatMapFile,
    })
  }

  const displayedPreview = previewUrl ?? seatMapPath

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
        disabled={disabled}
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
        disabled={disabled}
        helperText="Må være unik. Bruk små bokstaver, tall og enkle bindestreker."
        error={visibleErrors.slug}
      />
      <TextArea
        label="Beskrivelse"
        value={values.description}
        onChange={(event) => updateField('description', event.target.value)}
        rows={4}
        disabled={disabled}
      />
      <TextField
        label="Maks dager frem i tid"
        type="number"
        min={1}
        step={1}
        value={values.maxDaysAhead}
        onChange={(event) => updateField('maxDaysAhead', event.target.value)}
        disabled={disabled}
        error={visibleErrors.maxDaysAhead}
      />

      <div className={styles.seatMapField}>
        <label className={styles.label} htmlFor={fileInputId}>
          Romkart (valgfritt)
        </label>
        {displayedPreview && (
          <img
            src={displayedPreview}
            alt={`Forhåndsvisning av romkart${values.name ? ` for ${values.name}` : ''}`}
            className={styles.preview}
          />
        )}
        <div className={styles.seatMapRow}>
          <input
            id={fileInputId}
            ref={fileInputRef}
            className={styles.fileInput}
            type="file"
            accept=".png,.jpg,.jpeg,.webp"
            onChange={handleFileChange}
            disabled={disabled}
          />
          {(seatMapPath !== null || seatMapFile !== null) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={handleRemoveSeatMap}
            >
              Fjern romkart
            </Button>
          )}
        </div>
        <span className={styles.helper}>PNG, JPEG eller WebP, maks 2 MB.</span>
        {fileError && <span className={styles.error}>{fileError}</span>}
      </div>
    </form>
  )
}
