'use client';

import React from 'react';
import loadingGIF from '/public/loading.gif';
import "@/app/globals.css";
import styles from './loading.module.css';

const Loading = () => {
    return (
        <div className={styles.loadingContainer}>
            <img src={loadingGIF.src} alt="Loading..." className={styles.loadingGif} />
            <p className={styles.loadingText}>Loading...</p>
        </div>
    );
};

export default Loading;
