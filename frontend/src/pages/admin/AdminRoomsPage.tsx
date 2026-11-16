import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useId, useState, type FormEvent, type InputHTMLAttributes } from 'react'
import type { CreateRoomRequest, RoomDto } from '../../../../contracts/room'
import { createRoom, deleteRoom, getRooms, updateRoom } from '../../api/roomsApi'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { IconButton } from '../../components/IconButton'
import { Modal } from '../../components/Modal'
import { Notice } from '../../components/Notice'
import { PageHeader } from '../../components/PageHeader'
import { Spinner } from '../../components/Spinner'
import styles from './AdminRoomsPage.module.css'

type ModalMode = { type: 'create' } | { type: 'edit'; room: RoomDto }

interface RoomFormValues {
  name: string
  slug: string
  description: string
  maxDaysAhead: string
}

type RoomFormErrors = Partial<Record<keyof RoomFormValues, string>>

interface InputFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className'> {
  label: string
  error?: string
  helperText?: string
}

const emptyForm: RoomFormValues = { name: '', slug: '', description: '', maxDaysAhead: '' }

function AdminIcon({ kind }: { kind: 'plus' | 'trash' }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      {kind === 'plus' ? (
        <path d="M12 5v14M5 12h14" />
      ) : (
        <path d="M4 7h16M10 11v6M14 11v6M5 7l1 14h12l1-14M9 7V4h6v3" />
      )}
    </svg>
  )
}

function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
    .replace(/-+$/g, '')
}

function validateForm(values: RoomFormValues): RoomFormErrors {
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

function InputField({ label, error, helperText, ...inputProps }: InputFieldProps) {
  const id = useId()
  const helperId = `${id}-helper`
  const errorId = `${id}-error`

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
        {inputProps.required && <span aria-hidden="true"> *</span>}
      </label>
      <input
        {...inputProps}
        id={id}
        className={`${styles.input}${error ? ` ${styles.invalid}` : ''}`}
        aria-invalid={Boolean(error)}
        aria-describedby={
          [helperText && helperId, error && errorId].filter(Boolean).join(' ') || undefined
        }
      />
      {helperText && (
        <span className={styles.helper} id={helperId}>
          {helperText}
        </span>
      )}
      {error && (
        <span className={styles.error} id={errorId}>
          {error}
        </span>
      )}
    </div>
  )
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback
}

export default function AdminRoomsPage() {
  const queryClient = useQueryClient()
  const { data: rooms, isPending, isError } = useQuery({ queryKey: ['rooms'], queryFn: getRooms })
  const [modalMode, setModalMode] = useState<ModalMode | null>(null)
  const [deletingRoom, setDeletingRoom] = useState<RoomDto | null>(null)
  const [formValues, setFormValues] = useState<RoomFormValues>(emptyForm)
  const [slugEdited, setSlugEdited] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const formErrors = validateForm(formValues)

  const saveMutation = useMutation({
    mutationFn: async ({ roomId, input }: { roomId?: number; input: CreateRoomRequest }) => {
      if (roomId === undefined) {
        await createRoom(input)
        return
      }
      await updateRoom(roomId, input)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['rooms'] })
      setModalMode(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteRoom,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['rooms'] })
      setDeletingRoom(null)
    },
  })

  function openForm(room?: RoomDto) {
    saveMutation.reset()
    setFormValues(
      room
        ? {
            name: room.name,
            slug: room.slug,
            description: room.description ?? '',
            maxDaysAhead: String(room.maxDaysAhead),
          }
        : emptyForm,
    )
    setSlugEdited(Boolean(room))
    setHasSubmitted(false)
    setModalMode(room ? { type: 'edit', room } : { type: 'create' })
  }

  function updateForm(field: keyof RoomFormValues, value: string) {
    setFormValues((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setHasSubmitted(true)
    if (Object.keys(formErrors).length) return

    const input: CreateRoomRequest = {
      name: formValues.name.trim(),
      slug: formValues.slug,
      description: formValues.description.trim() || null,
      ...(formValues.maxDaysAhead.trim()
        ? { maxDaysAhead: Number(formValues.maxDaysAhead.trim()) }
        : {}),
    }

    saveMutation.mutate({
      roomId: modalMode?.type === 'edit' ? modalMode.room.id : undefined,
      input,
    })
  }

  return (
    <>
      <PageHeader title="Admin panel" />

      <section className={styles.section} aria-labelledby="rooms-heading">
        <div className={styles.sectionHeader}>
          <h2 id="rooms-heading" className={styles.heading}>
            Rom
          </h2>
          <Button icon={<AdminIcon kind="plus" />} onClick={() => openForm()}>
            Legg til rom
          </Button>
        </div>

        {isPending && <Spinner label="Laster rom" />}
        {isError && (
          <Notice variant="danger" title="Kunne ikke hente rom" description="Prøv igjen senere." />
        )}
        {rooms?.length === 0 && (
          <Notice title="Ingen rom" description="Det finnes ingen rom ennå." />
        )}

        {rooms && rooms.length > 0 && (
          <ul className={styles.roomList}>
            {rooms.map((room) => (
              <li key={room.id}>
                <Card className={styles.roomCard}>
                  <div className={styles.roomHeading}>
                    <h3 className={styles.roomName}>{room.name}</h3>
                    <IconButton
                      icon={<AdminIcon kind="trash" />}
                      variant="danger"
                      aria-label={`Slett rom ${room.name}`}
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        deleteMutation.reset()
                        setDeletingRoom(room)
                      }}
                    />
                  </div>
                  {room.description && <p className={styles.description}>{room.description}</p>}
                  <Button variant="outline" onClick={() => openForm(room)}>
                    Rediger rom
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal
        open={modalMode !== null}
        title={modalMode?.type === 'edit' ? 'Rediger rom' : 'Legg til rom'}
        onClose={() => setModalMode(null)}
        footer={
          <>
            <Button type="submit" form="room-form" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Lagrer…' : 'Lagre'}
            </Button>
            <Button variant="outline" onClick={() => setModalMode(null)}>
              Avbryt
            </Button>
          </>
        }
      >
        {saveMutation.isError && (
          <Notice
            variant="danger"
            title="Det oppstod en feil"
            description={errorMessage(saveMutation.error, 'Kunne ikke lagre rommet. Prøv igjen.')}
          />
        )}
        {modalMode && (
          <form id="room-form" className={styles.form} onSubmit={handleSubmit} noValidate>
            <InputField
              label="Navn"
              value={formValues.name}
              onChange={(event) => {
                const name = event.target.value
                setFormValues((current) => ({
                  ...current,
                  name,
                  slug: slugEdited ? current.slug : slugFromName(name),
                }))
              }}
              required
              error={hasSubmitted ? formErrors.name : undefined}
            />
            <InputField
              label="Slug"
              value={formValues.slug}
              onChange={(event) => {
                setSlugEdited(true)
                updateForm('slug', event.target.value)
              }}
              required
              maxLength={50}
              helperText="Må være unik. Bruk små bokstaver, tall og enkle bindestreker."
              error={hasSubmitted ? formErrors.slug : undefined}
            />
            <div className={styles.field}>
              <label className={styles.label} htmlFor="room-description">
                Beskrivelse
              </label>
              <textarea
                id="room-description"
                className={styles.textarea}
                value={formValues.description}
                onChange={(event) => updateForm('description', event.target.value)}
                rows={4}
              />
            </div>
            <InputField
              label="Maks dager frem i tid"
              type="number"
              min={1}
              step={1}
              value={formValues.maxDaysAhead}
              onChange={(event) => updateForm('maxDaysAhead', event.target.value)}
              error={hasSubmitted ? formErrors.maxDaysAhead : undefined}
            />
          </form>
        )}
      </Modal>

      <Modal
        open={deletingRoom !== null}
        title="Slett rom?"
        onClose={() => setDeletingRoom(null)}
        footer={
          <>
            <Button
              variant="danger"
              disabled={deleteMutation.isPending}
              onClick={() => deletingRoom && deleteMutation.mutate(deletingRoom.id)}
            >
              {deleteMutation.isPending ? 'Sletter…' : 'Slett rom'}
            </Button>
            <Button
              variant="outline"
              disabled={deleteMutation.isPending}
              onClick={() => setDeletingRoom(null)}
            >
              Avbryt
            </Button>
          </>
        }
      >
        <p>
          Er du sikker på at du vil slette rommet <strong>{deletingRoom?.name}</strong>?
        </p>
        {deleteMutation.isError && (
          <Notice
            variant="danger"
            title="Det oppstod en feil"
            description={errorMessage(
              deleteMutation.error,
              'Kunne ikke slette rommet. Prøv igjen.',
            )}
          />
        )}
      </Modal>
    </>
  )
}
