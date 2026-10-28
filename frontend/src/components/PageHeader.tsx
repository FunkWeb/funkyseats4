import styles from './PageHeader.module.css'

type PageHeaderProps = {
    title: string
}

export default function PageHeader({ title }: PageHeaderProps) {
    return (
        <header className={styles.pageHeader}>
            <h1 className={styles.headerTitle}>{title}</h1>
        </header>
    )
}
