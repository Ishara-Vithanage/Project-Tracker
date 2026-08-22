'use client';

import React, { useEffect, useState, useRef } from 'react';
import styles from './page.module.css';
import Image from 'next/image';

const images = [
  '/slider1.png',
  '/slider2.png',
  '/slider3.png',
];

export default function ImageSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      nextSlide();
    }, 4000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentIndex]);

  return (
    <div className={styles.slider}>
      <div
        className={styles.sliderTrack}
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((src, index) => (
          <div className={styles.slide} key={index}>
            <Image src={src} alt={`Slide ${index + 1}`} fill sizes="100vw" className={styles.image} />
          </div>
        ))}
      </div>

      <div className={styles.dots}>
        {images.map((_, i) => (
          <span
            key={i}
            className={`${styles.dot} ${i === currentIndex ? styles.active : ''}`}
            onClick={() => setCurrentIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}
