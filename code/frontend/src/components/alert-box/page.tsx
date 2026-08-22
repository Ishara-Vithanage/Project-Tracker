'use client';

import ReactDOM from 'react-dom';
import React from 'react';
import styles from './page.module.css';

interface AlertBoxProps {
  show: boolean;
  param: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function AlertBox({ show, param, onConfirm, onCancel }: AlertBoxProps) {
  if (!show) return null;

  return ReactDOM.createPortal(
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Are you sure {param}?</h2>
        <div className={styles.actions}>
          <button className={styles.okButton} onClick={onConfirm}>OK</button>
          <button className={styles.cancelButton} onClick={onCancel}>CANCEL</button>
        </div>
      </div>
    </div>,
    document.getElementById('modal-root')!
  );
}
