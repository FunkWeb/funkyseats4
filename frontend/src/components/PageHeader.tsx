import styles from './PageHeader.module.css'

type PageHeaderProps = {
    title: string
}

export default function PageHeader({ title }: PageHeaderProps) {
    return (
        <header id={styles.pageHeader}>
            <h1 id={styles.headerTitle}>{title}</h1>
        </header>
    )
}
