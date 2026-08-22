'use client';

import ReactDOM from 'react-dom';
import React, { useEffect, useState } from 'react';
import styles from './page.module.css';
import { useRefresh } from '@/app/context/appWrapper';
import { GetProjectbyDeveloper } from '@/services/projectinfo';

type Task = {
    title: string;
    status: string;
};

type Project = {
    name: string;
    status: string;
    tasks: Task[];
};

type Developer = {
    name: string;
    department: string;
    email: string;
    projects: Project[];
};

export default function DeveloperPopup({
    developerId,
    developerName,
    developerBU,
    developerEmail,
    onClose
}: {
    developerId: string;
    developerName: string;
    developerBU: string;
    developerEmail: string;
    onClose: () => void;
}) {
    const [developer, setDeveloper] = useState<Developer | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedProjectIndex, setExpandedProjectIndex] = useState<number | null>(null);
    const { refreshKey } = useRefresh();

    useEffect(() => {
        async function fetchDeveloperProjects() {
            try {
                const projectsFromApi = await GetProjectbyDeveloper(developerId);

                const transformedProjects: Project[] = Array.isArray(projectsFromApi)
                    ? projectsFromApi.map((proj: any) => ({
                          name: proj.name,
                          status: proj.status,
                          tasks: proj.tasks?.map((task: any) => ({
                              title: task.name,
                              status: task.status
                          })) || []
                      }))
                    : [];

                setDeveloper({
                    name: developerName || 'N/A',
                    department: developerBU || 'N/A',
                    email: developerEmail,
                    projects: transformedProjects
                });
            } catch (error) {
                console.error('Failed to fetch developer projects:', error);
                setDeveloper({
                    name: developerName || 'N/A',
                    department: developerBU || 'N/A',
                    email: developerEmail,
                    projects: []
                });
            }
        }

        fetchDeveloperProjects();
    }, [developerId, refreshKey]);

    const filteredProjects = developer?.projects.filter((project) =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleTasks = (index: number) => {
        setExpandedProjectIndex(prev => (prev === index ? null : index));
    };

    if (!developer) return null;

    function getStatusClass(status: string) {
        switch (status.toLowerCase()) {
            case 'not started':
                return styles.statusNotStarted;
            case 'in progress':
                return styles.statusInProgress;
            case 'uat':
                return styles.statusUAT;
            case 'on hold':
                return styles.statusOnHold;
            case 'completed':
                return styles.statusCompleted;
            default:
                return '';
        }
    }

    return ReactDOM.createPortal(
        <div className={styles.overlay}>
            <div className={styles.popup}>
                <p className={styles.closeButton} onClick={onClose}>×</p>
                <p className={styles.header}>{developer.name}</p>
                <p className={styles.info}><strong>Department:</strong> {developer.department}</p>
                <p className={styles.info}><strong>Email:</strong> {developer.email}</p>

                {developer.projects.length > 0 ? (
                    <>
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles.searchInput}
                        />

                        <div className={styles.projectList}>
                            {filteredProjects?.map((project, index) => (
                                <div key={index} className={styles.projectCard}>
                                    <div className={styles.projectHeader}>
                                        <span className={styles.projectName}>{project.name}</span>
                                        <div className={styles.projectRight}>
                                            <span className={`${styles.projectStatus} ${getStatusClass(project.status)}`}>
                                                {project.status.toUpperCase()}
                                            </span>
                                            <button
                                                className={styles.viewTaskButton}
                                                onClick={() => toggleTasks(index)}
                                            >
                                                {expandedProjectIndex === index ? 'HIDE TASKS' : 'VIEW TASKS'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className={`${styles.taskList} ${expandedProjectIndex === index ? styles.show : ''}`}>
                                        {project.tasks.map((task, tIndex) => (
                                            <div key={tIndex} className={styles.taskItem}>
                                                <span>{task.title}</span>
                                                <span className={styles.taskStatus}>{task.status.toUpperCase()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <p className={styles.noProjects}>No projects found.</p>
                )}
            </div>
        </div>,
        document.getElementById('modal-root')!
    );
}
