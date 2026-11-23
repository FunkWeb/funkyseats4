import { useState, type FormEvent } from 'react'
import type { FeatureDto, FeatureCategory } from '../../../../contracts/feature'
import type { SeatWithFeaturesDto } from '../../../../contracts/seat'
import { FeatureGroup } from '../../components/FeatureGroup'
import { TextArea } from '../../components/TextArea'
import { TextField } from '../../components/TextField'
import { CATEGORY_TITLES } from '../features/featureCategories'
import styles from './SeatForm.module.css'

export interface SeatFormProps {
  id: string
  seat?: SeatWithFeaturesDto
  features: FeatureDto[]
  onSubmit: (values: {
    seatNumber: string
    description: string | null
    featureIds: number[]
  }) => void
}

export function SeatForm({ id, seat, features, onSubmit }: SeatFormProps) {
  const [seatNumber, setSeatNumber] = useState(seat?.seatNumber ?? '')
  const [description, setDescription] = useState(seat?.description ?? '')
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<number[]>(
    () => seat?.features.map((feature) => feature.id) ?? [],
  )
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const seatNumberError =
    hasSubmitted && seatNumber.trim().length === 0 ? 'Plassnummer er obligatorisk.' : undefined

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setHasSubmitted(true)
    if (seatNumber.trim().length === 0) return

    onSubmit({
      seatNumber: seatNumber.trim(),
      description: description.trim() || null,
      featureIds: selectedFeatureIds,
    })
  }

  function toggleFeature(feature: FeatureDto) {
    setSelectedFeatureIds((current) =>
      current.includes(feature.id)
        ? current.filter((featureId) => featureId !== feature.id)
        : [...current, feature.id],
    )
  }

  return (
    <form id={id} className={styles.form} onSubmit={handleSubmit} noValidate>
      <TextField
        label="Plassnummer"
        value={seatNumber}
        onChange={(event) => setSeatNumber(event.target.value)}
        required
        maxLength={10}
        error={seatNumberError}
      />
      <TextArea
        label="Beskrivelse"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        rows={4}
      />
      <div className={styles.features}>
        {(Object.keys(CATEGORY_TITLES) as FeatureCategory[]).map((category) => (
          <FeatureGroup
            key={category}
            title={CATEGORY_TITLES[category]}
            features={features.filter((feature) => feature.category === category)}
            selectedIds={selectedFeatureIds}
            onToggle={toggleFeature}
          />
        ))}
      </div>
    </form>
  )
}
