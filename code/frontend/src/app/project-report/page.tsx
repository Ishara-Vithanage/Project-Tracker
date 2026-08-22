'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ProjectPDFReport from '@/components/project-report/page';
import { GetProjectbyID } from '@/services/projectinfo';
import styles from './page.module.css';

export default function ProjectReportPage() {
  const searchParams = useSearchParams();
  const projectID = searchParams.get('projectID');
  const [project, setProject] = useState<any>(null);

  useEffect(() => {
    if (!projectID) return;
    const fetchProject = async () => {
      const data = await GetProjectbyID(Number(projectID));
      setProject(data);
    };
    fetchProject();
  }, [projectID]);

  if (!project) return <div>Loading report...</div>;

  return <div className={styles.mainContainer}>
  <ProjectPDFReport project={project} />
  </div>;
}