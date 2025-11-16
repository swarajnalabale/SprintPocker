import Link from 'next/link';
import styles from '../styles/Home.module.css';

export default function Home() {
  const pages = [
    {
      title: 'Sprint Poker',
      description: 'Vote on story points for your tasks',
      icon: '🎯',
      path: '/poker',
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      title: 'Retro Meeting',
      description: 'Share your thoughts and feedback',
      icon: '🔄',
      path: '/retro',
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
  ];

  return (
    <div className={styles.App}>
      <div className={styles.homeContainer}>
        <header className={styles.header}>
          <h1>🚀 SprintPocker</h1>
          <p className={styles.subtitle}>Your agile collaboration toolkit</p>
        </header>

        <div className={styles.pagesGrid}>
          {pages.map((page, index) => (
            <Link key={index} href={page.path} className={styles.pageCard}>
              <div
                className={styles.pageIcon}
                style={{ background: page.color }}
              >
                {page.icon}
              </div>
              <h2 className={styles.pageTitle}>{page.title}</h2>
              <p className={styles.pageDescription}>{page.description}</p>
            </Link>
          ))}
        </div>

        <div className={styles.footer}>
          <p>More tools coming soon...</p>
        </div>
      </div>
    </div>
  );
}
