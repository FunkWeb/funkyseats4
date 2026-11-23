import { useEffect, useId, useState, type ChangeEvent, type FormEvent } from 'react'
import type { FeatureCategory } from '../../../../contracts/feature'
import { FeatureIcon } from '../../components/FeatureIcons'
import { FormActions } from '../../components/FormActions'
import { Select, type SelectOption } from '../../components/Select'
import { TextArea } from '../../components/TextArea'
import { TextField } from '../../components/TextField'
import { CATEGORY_TITLES, FEATURE_CATEGORY_LIST } from './featureCategories'
import styles from './FeatureForm.module.css'

const MAX_NAME_LENGTH = 50
const MAX_ICON_SIZE_BYTES = 100 * 1024

const CATEGORY_OPTIONS: SelectOption[] = FEATURE_CATEGORY_LIST.map((category) => ({
  value: category,
  label: CATEGORY_TITLES[category],
}))

export interface FeatureFormValues {
  name: string
  category: FeatureCategory
  description: string | null
  iconFile: File | null
}

export interface FeatureFormProps {
  isSaving?: boolean
  onCancel: () => void
  onSubmit: (values: FeatureFormValues) => void
}

function isFeatureCategory(value: string): value is FeatureCategory {
  return (FEATURE_CATEGORY_LIST as readonly string[]).includes(value)
}

function isValidSvgFile(file: File): boolean {
  const hasSvgMime = file.type === 'image/svg+xml'
  const hasSvgExtension = file.name.toLowerCase().endsWith('.svg')
  return hasSvgMime || hasSvgExtension
}

export function FeatureForm({ isSaving = false, onCancel, onSubmit }: FeatureFormProps) {
  const fileInputId = useId()
  const [name, setName] = useState('')
  const [category, setCategory] = useState<FeatureCategory | null>(null)
  const [description, setDescription] = useState('')
  const [iconFile, setIconFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | undefined>(undefined)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  useEffect(() => {
    if (!iconFile) {
      setPreviewUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(iconFile)
    setPreviewUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [iconFile])

  const trimmedName = name.trim()
  const nameError = !hasSubmitted
    ? undefined
    : trimmedName.length === 0
      ? 'Navn er obligatorisk.'
      : trimmedName.length > MAX_NAME_LENGTH
        ? 'Navn kan maks være 50 tegn.'
        : undefined

  const categoryError = hasSubmitted && category === null ? 'Kategori er obligatorisk.' : undefined

  const isDirty =
    trimmedName.length > 0 ||
    category !== null ||
    description.trim().length > 0 ||
    iconFile !== null

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null

    if (!file) {
      setIconFile(null)
      setFileError(undefined)
      return
    }

    if (!isValidSvgFile(file)) {
      setIconFile(null)
      setFileError('Ikonet må være en SVG-fil (.svg).')
      event.target.value = ''
      return
    }

    if (file.size > MAX_ICON_SIZE_BYTES) {
      setIconFile(null)
      setFileError('Ikonfilen kan ikke være større enn 100 KB.')
      event.target.value = ''
      return
    }

    setFileError(undefined)
    setIconFile(file)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setHasSubmitted(true)

    if (trimmedName.length === 0 || trimmedName.length > MAX_NAME_LENGTH) return
    if (category === null) return
    if (fileError) return

    onSubmit({
      name: trimmedName,
      category,
      description: description.trim() || null,
      iconFile,
    })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <TextField
        label="Navn"
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
        maxLength={MAX_NAME_LENGTH}
        disabled={isSaving}
        error={nameError}
      />

      <Select
        label="Kategori"
        options={CATEGORY_OPTIONS}
        value={category}
        placeholder="Velg kategori"
        onChange={(value) => {
          if (isFeatureCategory(value)) {
            setCategory(value)
          }
        }}
        disabled={isSaving}
      />
      {categoryError && <span className={styles.error}>{categoryError}</span>}

      <TextArea
        label="Beskrivelse"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        rows={3}
        disabled={isSaving}
      />

      <div className={styles.iconField}>
        <label className={styles.label} htmlFor={fileInputId}>
          Ikon (valgfritt)
        </label>
        <div className={styles.iconRow}>
          <span className={styles.preview}>
            <FeatureIcon iconPath={previewUrl} />
          </span>
          <input
            id={fileInputId}
            className={styles.fileInput}
            type="file"
            accept=".svg,image/svg+xml"
            onChange={handleFileChange}
            disabled={isSaving}
          />
        </div>
        <span className={styles.helper}>Kun SVG-filer (.svg), maks 100 KB.</span>
        {fileError && <span className={styles.error}>{fileError}</span>}
      </div>

      <FormActions isDirty={isDirty} isSaving={isSaving} onCancel={onCancel} />
    </form>
  )
}
