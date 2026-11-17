import { Link } from 'react-router'
import { Card } from '../components/Card'
import styles from './NotFoundPage.module.css'

export default function NotFoundPage() {
  return (
    <main className={styles.page}>
      <Card className={styles.card}>
        <h1 className={styles.title}>Fant ikke siden</h1>
        <p className={styles.description}>
          Siden du leter etter finnes ikke eller har blitt flyttet.
        </p>
        <Link to="/rooms" className={styles.link}>
          Tilbake til romoversikt
        </Link>
      </Card>
    </main>
  )
}
