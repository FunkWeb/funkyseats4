import { TIME_PERIODS } from '../../../../contracts/booking'
import { Card } from '../../components/Card'
import { Notice } from '../../components/Notice'
import { Spinner } from '../../components/Spinner'
import { PERIOD_LABELS } from './bookingLabels'
import { useMyBookingStats } from './useMyBookingStats'
import styles from './BookingStats.module.css'

export function BookingStats() {
  const statsQuery = useMyBookingStats()

  if (statsQuery.isPending) {
    return (
      <section className={styles.section} aria-label="Statistikk">
        <Spinner label="Laster statistikk" />
      </section>
    )
  }

  if (statsQuery.isError) {
    return (
      <section className={styles.section} aria-label="Statistikk">
        <Notice
          variant="danger"
          title="Kunne ikke hente statistikk"
          description="Prøv igjen senere."
        />
      </section>
    )
  }

  const stats = statsQuery.data
  const maxMonthCount = Math.max(...stats.perMonth.map((entry) => entry.count), 1)

  const tiles = [
    { label: 'Kommende', value: stats.upcoming },
    { label: 'Fullførte', value: stats.completed },
    { label: 'Avbestilte', value: stats.cancelled },
    { label: 'Denne måneden', value: stats.thisMonth },
  ]

  return (
    <section className={styles.section} aria-label="Statistikk">
      <div className={styles.tiles}>
        {tiles.map((tile) => (
          <Card key={tile.label} className={styles.tile}>
            <span className={styles.tileLabel}>{tile.label}</span>
            <span className={styles.tileValue}>{tile.value}</span>
          </Card>
        ))}
      </div>

      <div className={styles.detailsGrid}>
        <Card className={styles.card}>
          <h2 className={styles.cardTitle}>Favoritter</h2>
          <div className={styles.favouriteList}>
            <div className={styles.favouriteItem}>
              <span className={styles.favouriteHeader}>Favorittrom</span>
              {stats.favouriteRoom ? (
                <span className={styles.favouriteValue}>
                  {stats.favouriteRoom.name}{' '}
                  <span className={styles.favouriteMeta}>({stats.favouriteRoom.count})</span>
                </span>
              ) : (
                <p className={styles.emptyText}>Ingen reservasjoner enda</p>
              )}
            </div>

            <div className={styles.favouriteItem}>
              <span className={styles.favouriteHeader}>Favorittsete</span>
              {stats.favouriteSeat ? (
                <span className={styles.favouriteValue}>
                  Sete {stats.favouriteSeat.seatNumber} – {stats.favouriteSeat.roomName}{' '}
                  <span className={styles.favouriteMeta}>({stats.favouriteSeat.count})</span>
                </span>
              ) : (
                <p className={styles.emptyText}>Ingen reservasjoner enda</p>
              )}
            </div>
          </div>
        </Card>

        <Card className={styles.card}>
          <h2 className={styles.cardTitle}>Per tidsperiode</h2>
          <ul className={styles.periodList}>
            {TIME_PERIODS.map((period) => (
              <li key={period} className={styles.periodRow}>
                <span>{PERIOD_LABELS[period]}</span>
                <span className={styles.periodCount}>{stats.byPeriod[period]}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className={styles.card}>
          <h2 className={styles.cardTitle}>Siste 6 måneder</h2>
          <ul className={styles.barList}>
            {stats.perMonth.map((entry) => {
              const widthPercent =
                entry.count === 0 ? 0 : Math.round((entry.count / maxMonthCount) * 100)

              return (
                <li key={entry.month} className={styles.barRow}>
                  <span className={styles.barMonth}>{entry.month}</span>
                  <div className={styles.barTrack}>
                    <div className={styles.barFill} style={{ width: `${widthPercent}%` }} />
                  </div>
                  <span className={styles.barCount}>{entry.count}</span>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>
    </section>
  )
}
