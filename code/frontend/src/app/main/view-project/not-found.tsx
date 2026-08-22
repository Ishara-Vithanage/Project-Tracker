'use client';

import React from 'react';

export default function NoProjects() {
  const styles = {
    container: {
      padding: '1rem',
      backgroundColor: 'rgba(255, 0, 0, 0.05)', // light red transparent
      color: '#991b1b',
      border: '1px solid #fca5a5',
      borderRadius: '0.5rem',
      textAlign: 'center' as const,
      marginTop: '2rem',
    },
    message: {
      fontSize: '1rem',
      fontWeight: 500,
      fontFamily: '"Segoe UI", sans-serif',
}
  };

  return (
    <div style={styles.container}>
      <p style={styles.message}>No Projects Available</p>
    </div>
  );
}
