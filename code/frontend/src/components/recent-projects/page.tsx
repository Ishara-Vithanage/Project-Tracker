'use client';

import React, { useEffect, useState } from 'react';
import styles from './page.module.css';
import { GetProjectbyManager } from '@/services/projectinfo';
import { GetProjectbyDeveloper } from '@/services/projectinfo';
import { useUser } from '@/app/context/userProvider';
import { useRefresh } from '@/app/context/appWrapper';

// Define the structure of a user (you can customize this further)
interface SubTask {
  task_ID: number;
  name: string;
  description: string;
  developer: string;
  status: string;
  createDate: string;
  targetDate: string;
}

interface ProjectInfo {
  name: string;
  businessUnit: string;
  manager: string;
  startDate: string;
  endDate: string;
  description: string;
  nature: string;
  createDate: string | null;
  finishDate: string | null;
  status: string;
  tasks: SubTask[];
}

export default function RecentProjects() {
  const { user } = useUser();
  const { refreshKey } = useRefresh();
  const [projects, setProjects] = useState<ProjectInfo[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;

      try {
        let data: ProjectInfo[] = [];
        if (user.role === 'MGR') {
          data = await GetProjectbyManager(user.userID);
        }
        else {
          data = await GetProjectbyDeveloper(user.userID);
        }
        const sorted = [...data].sort(
          (a, b) => new Date(b.createDate ?? 0).getTime() - new Date(a.createDate ?? 0).getTime()
        );
        setProjects(sorted.slice(0, 4)); // Show top 4 recent projects
        console.log("Fetched data: ", data)
      } catch (error) {
        console.error('Error fetching recent projects:', error);
      }
    };

    fetchProjects();
  }, [user?.userID, refreshKey]);

  const statusKeyMap: { [key: string]: string } = {
    'NOT STARTED': 'notStarted',
    'IN PROGRESS': 'inProgress',
    'ON HOLD': 'onHold',
    'UAT': 'uat',
    'COMPLETED': 'completed'
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>RECENT PROJECTS</h3>
      {projects.length > 0 ? (
        <div className={styles.projectList}>
          {projects.map((project, index) => {
            const normalizedStatus = project.status.trim().toUpperCase();
            const statusKey = statusKeyMap[normalizedStatus] || 'notStarted';

            // Count pending tasks
            const pendingTaskCount = project.tasks.filter(
              (task) => task.status.trim().toUpperCase() === 'PENDING'
            ).length;

            const displayStatus =
              normalizedStatus === 'COMPLETED' || normalizedStatus === 'NOT STARTED'
                ? normalizedStatus
                : `${pendingTaskCount} PENDING - ${normalizedStatus}`;

            return (
              <div key={index} className={styles.projectCard}>
                <div className={`${styles.sideLine} ${styles[statusKey]}`} />
                <div className={styles.projectContent}>
                  <span className={styles.projectTitle}>{project.name.toUpperCase()}</span>
                  <span className={`${styles.projectStatus} ${styles[`${statusKey}Text`]}`}>
                    {displayStatus}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (<p className={styles.nullText}>You don't have any projects yet</p>)}
    </div>
  );
}
