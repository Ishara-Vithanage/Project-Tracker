'use client';

import React, { useEffect, useState } from 'react';
import styles from './page.module.css';
import { useUser } from '@/app/context/userProvider';
import { useRefresh } from '@/app/context/appWrapper';
import RecentProjects from '../../../components/recent-projects/page';
import { GetProjectbyManager } from '@/services/projectinfo';
import { GetProjectbyDeveloper } from '@/services/projectinfo';
import { GetProject } from '@/services/projectinfo';
import ImageSlider from '../../../components/image-slider/page';

export default function Home() {
  const { user } = useUser();
  const { refreshKey } = useRefresh();
  const [projectCounts, setProjectCounts] = useState<{ [status: string]: number }>({});
  const [taskCounts, setTaskCounts] = useState<{ [status: string]: number }>({});

  const roleTitles: { [key: string]: string } = {
    MGR: 'PROJECT MANAGER',
    HEAD: 'DEPARTMENT HEAD',
    DEV: 'DEVELOPER',
  };

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        let projectList: any[] = [];
        let taskList: any[] = [];
        if (user.role === 'MGR') {
          projectList = await GetProjectbyManager(user.userID);
          taskList = projectList.flatMap((project: any) => project.tasks || []);
        }

        else if (user.role === 'HEAD') {
          projectList = await GetProject();
          taskList = projectList.flatMap((project: any) => project.tasks || []);
        }

        else {
          projectList = await GetProjectbyDeveloper(user.userID);
          taskList = projectList.flatMap((project: any) => project.tasks || []);
        }
        const normalize = (str: string) => str.trim().toUpperCase();

        const projectCountMap = projectList.reduce((acc: any, project: any) => {
          const status = normalize(project.status);
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

        const taskCountMap = taskList.reduce((acc: any, task: any) => {
          const status = normalize(task.status);
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

        setProjectCounts(projectCountMap);
        setTaskCounts(taskCountMap);
      } catch (error) {
        console.error('Error fetching project/task info:', error);
      }
    };

    fetchData();
  }, [user?.userID, refreshKey]);

  // Calculate pending projects/tasks (exclude 'COMPLETED')
  const pendingProjectCount = Object.entries(projectCounts)
    .filter(([status]) => status !== 'COMPLETED')
    .reduce((sum, [, count]) => sum + count, 0);

  const pendingTaskCount = Object.entries(taskCounts)
    .filter(([status]) => status !== 'COMPLETED')
    .reduce((sum, [, count]) => sum + count, 0);

  return (
    <div className={styles.mainContainer}>
      {/* Top section */}
      <div className={styles.welcomeSection}>
        <p className={styles.welcomeText}>WELCOME, {user?.name.toUpperCase()}</p>
        <p className={styles.welcomeText}>
          {roleTitles[user?.role] || user?.role} - {user?.department}
        </p>
      </div>

      {/* Middle section */}
      <div className={styles.middleSection}>

        {/* Middle left section */}
        <div className={styles.middleleft}>
          <RecentProjects />
        </div>

        {/* Middle right section */}
        <div className={styles.middleRight}>

          {/* Top section */}
          <div className={styles.middleRightTop}>
            <div className={styles.cardCount}>
              <div className={styles.statsContainer}>
                {pendingProjectCount > 0 ? (<div className={styles.statBox}>
                  <div className={styles.count}>{String(pendingProjectCount).padStart(2, '0')}</div>
                  <div className={styles.textBlock}>
                    <div className={styles.labelTop}>PENDING</div>
                    <div className={styles.labelBottom}>PROJECTS</div>
                  </div>
                </div>) : (<p className={styles.nullText}>NO PENDING PROJECTS</p>)}
                {pendingTaskCount > 0 ? (<div className={styles.statBox}>
                  <div className={styles.count}>{String(pendingTaskCount).padStart(2, '0')}</div>
                  <div className={styles.textBlock}>
                    <div className={styles.labelTop}>PENDING</div>
                    <div className={styles.labelBottom}>TASKS</div>
                  </div>
                </div>) : (<p className={styles.nullText}>NO PENDING TASKS</p>)}
              </div>
              {pendingProjectCount > 0 && <div className={styles.viewLink}>VIEW PENDING PROJECTS &gt;&gt;</div>}
            </div>
          </div>

          {/* Bottom section */}
          <div className={styles.middleRightBottom}>
            <div className={styles.cardSlider}>
              <ImageSlider />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom section: Project status counts */}
      <div className={styles.bottomSection}>
        <div className={styles.buttonLine}>
          <StatusButton label="NOT STARTED" count={projectCounts['NOT STARTED']} style={styles.statusNotStarted} />
          <StatusButton label="IN PROGRESS" count={projectCounts['IN PROGRESS']} style={styles.statusInProgress} />
          <StatusButton label="ON HOLD" count={projectCounts['ON HOLD']} style={styles.statusOnHold} />
        </div>
        <div className={styles.buttonLine}>
          <StatusButton label="UAT" count={projectCounts['UAT']} style={styles.statusUAT} />
          <StatusButton label="COMPLETED" count={projectCounts['COMPLETED']} style={styles.statusCompleted} />
        </div>
      </div>
    </div>
  );
}

function StatusButton({ label, count = 0, style }: { label: string; count?: number; style: string }) {
  const styles = require('./page.module.css');
  const formattedCount = String(count).padStart(2, '0');

  return (
    <div className={`${styles.buttonContainer} ${style}`}>
      <div className={styles.statusIndicator}></div>
      <div className={styles.buttonContent}>{label}</div>
      <div className={styles.projectCount}>
        {Number(formattedCount) > 0 ? (
          formattedCount
        ) : (
          <p className={styles.nullTextCount}>NO PROJECTS</p>
        )}
      </div>
    </div>
  );
}
