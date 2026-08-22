'use client';

import { useEffect } from 'react';
import styles from './error.module.css';

interface ErrorProps {
  error: Error;
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Error in page:", error);
  }, [error]);

  return (
    <div className={styles.errorContainer}>
      <h1 className={styles.errorTitle}>Something went wrong!</h1>
      <p className={styles.errorMessage}>{error.message}</p>
      <button onClick={reset} className={styles.retryButton}>
        Try Again
      </button>
    </div>
  );
}
