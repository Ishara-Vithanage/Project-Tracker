'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';
import DevInfo from '@/components/dev-info/page';
import { GetDeveloperStat } from '@/services/developerStat';

interface DevStat {
  name: string;
  userID: string;
  department: string;
  email: string;
  pendingProjects: number;
  pendingTasks: number;
}
export default function InquiryPage() {
    const [allDevelopers, setAllDevelopers] = useState<DevStat[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showPopup, setShowPopup] = useState(false);
    const [selectedDeveloperId, setSelectedDeveloperId] = useState('');

    useEffect(() => {
        async function fetchDeveloperStats() {
            try {
                const response = await GetDeveloperStat();
                console.log('Fetched Developer Stats:', response);
                setAllDevelopers(response);
            } catch (error) {
                console.error('Failed to fetch developer stats:', error);
            }
        }

        fetchDeveloperStats();
    }, []);

    const filteredDevelopers = allDevelopers.filter((dev) =>
        dev.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={styles.main_container}>
            <h1 className={styles.pageTitle}>DEVELOPER STATS</h1>

            {/* Display developer count*/}
            <div className={styles.statsContainer}>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Total Developers</span>
                    <span className={styles.statValue}>{allDevelopers.length}</span>
                </div>

                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Available Developers</span>
                    <span className={styles.statValue}>
                        {
                            allDevelopers.filter(
                                (dev) => dev.pendingProjects === 0 && dev.pendingTasks === 0
                            ).length
                        }
                    </span>
                </div>

                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Working on Projects</span>
                    <span className={styles.statValue}>
                        {
                            allDevelopers.filter(
                                (dev) => dev.pendingProjects > 0 || dev.pendingTasks > 0
                            ).length
                        }
                    </span>
                </div>
            </div>
            
            {/* Developer table */}
            <div className={styles.tableWrapper}>
                <input
                    type="text"
                    placeholder="Search developer..."
                    className={styles.searchInput}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />

                <div className={styles.scrollableTable}>
                    <table className={styles.devTable}>
                        <thead>
                            <tr>
                                <th className={styles.tableHeader}>Developer Name</th>
                                <th className={styles.tableHeader}>Pending Projects</th>
                                <th className={styles.tableHeader}>Pending Tasks</th>
                                <th className={styles.tableHeader}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDevelopers.map((dev, index) => (
                                <tr key={index} className={styles.tableRow}>
                                    <td className={styles.tableCell}>{dev.name}</td>
                                    <td className={styles.tableCell}>{dev.pendingProjects}</td>
                                    <td className={styles.tableCell}>{dev.pendingTasks}</td>
                                    <td className={styles.tableCell}>
                                        <button
                                            className={styles.viewMoreSmallButton}
                                            onClick={() => {
                                                setSelectedDeveloperId(dev.userID);
                                                setShowPopup(true);
                                            }}
                                        >
                                            VIEW MORE
                                        </button>
                                        {showPopup && selectedDeveloperId === dev.userID && (
                                            <DevInfo
                                                developerId={dev.userID}
                                                developerName={dev.name}
                                                developerBU={dev.department}
                                                developerEmail={dev.email}
                                                onClose={() => setShowPopup(false)}
                                            />
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredDevelopers.length === 0 && (
                                <tr>
                                    <td className={styles.tableCell} colSpan={4}>
                                        No developers found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
