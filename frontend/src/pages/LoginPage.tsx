import { Navigate } from 'react-router'
import { googleLoginUrl } from '../api/authApi'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Spinner } from '../components/Spinner'
import { useAuth } from '../features/auth/useAuth'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const { user, isPending } = useAuth()

  if (user) {
    return <Navigate to="/rooms" replace />
  }

  return (
    <main className={styles.page}>
      <Card className={styles.card}>
        <h1 className={styles.title}>FunkySeats</h1>
        <p className={styles.description}>Logg inn for å reservere plass.</p>
        {isPending ? (
          <Spinner label="Sjekker innlogging" />
        ) : (
          <Button onClick={() => window.location.assign(googleLoginUrl)}>
            Logg inn med Google
          </Button>
        )}
      </Card>
    </main>
  )
}
