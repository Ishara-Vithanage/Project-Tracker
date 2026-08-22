'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { GetProjectbyID, updateProject } from '@/services/projectinfo';
import { getUsersAsType } from '@/services/systemUsers';
import { deleteProject } from '@/services/projectinfo';
import { useUser } from '@/app/context/userProvider';
import styles from './page.module.css';
import AlertBox from '@/components/alert-box/page';
import { useToast } from '@/components/toast/page';
import mailtoDeveloper from '@/services/mailTemplates/toDeveloperUpdate';
import mailtoManager from '@/services/mailTemplates/toManagerUpdate';
import sendEmail from '@/services/sendEmail';
import { getUserbyUserID } from '@/services/systemUsers';
import auditLog from "@/services/audit_log";
import getSriLankaTimeISO from "@/services/getSLTime";
import ProjectPDFReport from '@/components/project-report/page';

interface Task {
  name: string;
  developer: string;
  targetDate: string;
}

export default function ProjectDetails() {
  const searchParams = useSearchParams();
  const projectID = searchParams.get('projectID');
  const [project, setProject] = useState<any>(null);
  const [developers, setDevelopers] = useState<any[]>([]);
  const [projectDevs, setProjectDevs] = useState<any>([]); // Array to hold developers which are part of the project
  const [devMails, setDevMails] = useState<string[]>([]); // Array to hold developer emails
  const [expandedTasks, setExpandedTasks] = useState<number[]>([]);
  const { user } = useUser();
  const router = useRouter();
  const [showAlert, setShowAlert] = useState(false);
  const [alertAction, setAlertAction] = useState<'update' | 'delete' | 'remove-task' | null>(null);
  const [taskToRemoveIndex, setTaskToRemoveIndex] = useState<number | null>(null);
  const { showToast } = useToast();
  const [showReport, setShowReport] = useState(false);

  const isManager = user?.userID === project?.manager;
  const isHead = user?.role === 'HEAD';
  const isDeveloper = user?.role === 'DEV';
  const loggedDev = user.userID;

  useEffect(() => {
    if (!projectID) return;
    const fetchProject = async () => {
      try {
        console.log("Logged dev: ", loggedDev);
        const data = await GetProjectbyID(Number(projectID));
        console.log('Fetched project data:', data);
        if (data?.tasks?.length && data.tasks.every((t: any) => t.status === 'Live')) {
          data.status = 'LIVE';
        }
        setProject(data);

        const devUsernames = Array.from(
          new Set(data.tasks.map((task: any) => task.developer))
        );

        const devDetailsPromises = devUsernames.map((username: string) =>
          getUserbyUserID(username)
        );

        const projectDevs = await Promise.all(devDetailsPromises);
        setProjectDevs(projectDevs);

        const developerEmails = projectDevs.map((dev: any) => dev.email);
        setDevMails(developerEmails);

      } catch (error) {
        console.error('Failed to fetch project:', error);
      }
    };

    fetchProject();

    const fetchDevelopers = async () => {
      try {
        let devUsers: any[] = [];
        let mgrUsers: any[] = [];

        try {
          const devData = await getUsersAsType('DEV');
          devUsers = (devData.users ?? []).map((u: any) => ({ ...u, role: 'DEV' }));
          console.log('DEV users fetched:', devUsers);
        } catch (e) {
          console.error('Failed to fetch DEV users:', e);
        }

        try {
          const mgrData = await getUsersAsType('MGR');
          mgrUsers = (mgrData.users ?? []).map((u: any) => ({ ...u, role: 'MGR' }));
          console.log('MGR users fetched:', mgrUsers);
        } catch (e) {
          console.error('Failed to fetch MGR users:', e);
        }

        const combined = [...devUsers, ...mgrUsers];
        console.log('Combined users for dropdown:', combined);
        setDevelopers(combined);
      } catch (error) {
        console.error('Failed to fetch developers:', error);
      }
    };

    fetchDevelopers();
  }, [projectID]);

  const handleStatusChange = (newStatus: string) => {
    if (project.status === 'Not Started' && newStatus === 'Completed') {
      setProject((prev: any) => ({
        ...prev,
        status: 'In Progress',
      }));
    }

    if (project.status === 'Live' && newStatus !== 'Live') {
      setProject((prev: any) => ({
        ...prev,
        status: 'In Progress',
      }));
    }
  };

  const handleUpdate = async () => {
    if (!projectID || !project) return;

    const payload = {
      ...project,
      p_ID: Number(projectID),
      startDate: new Date(project.startDate).toISOString(),
      endDate: new Date(project.endDate).toISOString(),
      createDate: new Date(project.createDate).toISOString(),
      finishDate: new Date(project.finishDate).toISOString(),
      tasks: project.tasks.map((task: any) => ({
        ...task,
        projectID: Number(projectID),
      })),
    };

    try {
      await updateProject(Number(projectID), payload);
      showToast('Project updated successfully!', 'success');
      router.push('/main/view-project');

      const developerEmails = devMails.filter(email => email !== undefined && email !== null);

      const developerEmailBody = mailtoDeveloper(
        project.name,
        project.tasks.map((task: Task) => ({
          name: task.name,
          developer: developers.find(dev => dev.userID === task.developer)?.name || "Unassigned",
          targetDate: task.targetDate
        }))
      );

      const managerID = project.manager;
      const managerDetails = await getUserbyUserID(managerID);
      const managerEmail = managerDetails?.email;
      const managerEmailBody = mailtoManager(
        project.name,
        project.tasks.map((task: Task) => ({
          name: task.name,
          developer: developers.find(dev => dev.userID === task.developer)?.name || "Unassigned",
          targetDate: task.targetDate
        }))
      );

      const emailPromises = [];

      if (developerEmails.length > 0) {
        emailPromises.push(sendEmail({
          toEmail: developerEmails.join(','),
          subject: `Project updated: ${project.name}`,
          body: developerEmailBody
        }));
      }

      if (managerEmail) {
        emailPromises.push(sendEmail({
          toEmail: managerEmail,
          subject: `Project Updated: ${project.name}`,
          body: managerEmailBody
        }));
      }
      await Promise.all(emailPromises);

      // Audit log entry
      const auditEntry = {
        user: user.userID,
        action: "Project Updated",
        keyValue: project.name,
        tableName: "PROJECT_INFO",
        updateField: "",
        newValue: "",
        oldValue: "",
        LMD: new Date().toISOString(),
      };
      await auditLog(auditEntry);

    } catch (error) {
      console.error('Update failed:', error);
      showToast('Failed to update the project.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!projectID) return;

    try {
      await deleteProject(Number(projectID));
      showToast('Project deleted successfully!', 'success');
      router.push('/main/view-project');

      // Audit log entry
      const auditEntry = {
        user: user.userID,
        action: "Project Deleted",
        keyValue: project.name,
        tableName: "PROJECT_INFO",
        updateField: "",
        newValue: "",
        oldValue: "",
        LMD: getSriLankaTimeISO(),
      };
      await auditLog(auditEntry);

    } catch (error) {
      console.error('Delete failed:', error);
      showToast('Failed to delete the project.', 'error');
    }
  };

  const toggleTask = (index: number) => {
    setExpandedTasks((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleAddTask = () => {
    const newIndex = project.tasks.length;
    const newTask = {
      name: '',
      description: '',
      developer: developers[0]?.userID || '',
      createDate: new Date().toISOString().slice(0, 10),
      targetDate: '',
      status: 'Pending',
      projectID: Number(projectID),
    };

    setProject({ ...project, tasks: [...project.tasks, newTask] });
    setExpandedTasks([...expandedTasks, newIndex]);
  };

  const handleRemoveTask = (index: number) => {
    const updatedTasks = project.tasks.filter((_: any, i: number) => i !== index);
    setProject({ ...project, tasks: updatedTasks });
  };

  if (!project) return <div className={styles.loading}>Loading project details...</div>;

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>{project.name.toUpperCase()}</h2>

      <div className={styles.gridForm}>
        {[
          ['Project Name', project.name, 'name', true],
          ['Business Unit', project.businessUnit, 'businessUnit'],
          ['Manager', project.manager, 'manager', true],
          ['Start Date', project.startDate?.slice(0, 10), 'startDate', false, 'date'],
          ['End Date', project.endDate?.slice(0, 10), 'endDate', false, 'date'],
          ['Description', project.description, 'description'],
          ['Nature', project.nature, 'nature'],
        ].map(([label, value, key, disabled = false, type = 'text'], idx) => (
          <div key={idx} className={styles.inputGroup}>
            <label>{label}</label>
            {key === 'nature' ? (
              <select
                className={styles.input}
                value={project.nature}
                disabled={!isManager}
                onChange={(e) =>
                  setProject({ ...project, nature: e.target.value })
                }
              >
                <option value="New">New</option>
                <option value="Existing">Existing</option>
                <option value="Bug fix/Patch">Bug fix/Patch</option>
              </select>
            ) : (
              <input
                type={type}
                value={value as string}
                disabled={!isManager || disabled}
                className={styles.input}
                onChange={(e) =>
                  setProject({ ...project, [key as string]: e.target.value })
                }
              />
            )}
          </div>
        ))}

        <div className={styles.inputGroup}>
          <label>Status</label>
          <select
            value={project.status}
            className={styles.input}
            onChange={(e) => setProject({ ...project, status: e.target.value })}
            disabled={project.manager !== user.userID}
          >
            <option
              value="Not Started"
              disabled={project.tasks.some((task: any) => task.status === 'Completed')}
            >
              NOT STARTED
            </option>
            <option value="In Progress">IN PROGRESS</option>
            <option value="On Hold">ON HOLD</option>
            <option
              value="UAT"
              disabled={project.tasks.some((task: any) => task.status !== 'Completed')}
            >
              UAT
            </option>
            <option
              value="Live"
              disabled={project.tasks.some((task: any) => task.status !== 'Completed')}
            >
              LIVE
            </option>
          </select>
        </div>

      </div>


      <h3 className={styles.subHeading}>TASKS</h3>

      {project.tasks.map((task: any, index: number) => (
        <div key={index} className={styles.taskSummary}>
          <div className={styles.taskHeader}>
            <span className={styles.taskName}>{task.name}</span>
            <div className={styles.subtaskButtons}>
              <span
                className={`${styles.taskStatus} ${task.status === 'Completed' ? styles.statusCompleted : styles.statusPending
                  }`}
              >
                {task.status.toUpperCase()}
              </span>
              {isManager && (
                <button
                  className={styles.toggleButton}
                  onClick={() => {
                    setTaskToRemoveIndex(index);
                    setAlertAction('remove-task');
                    setShowAlert(true);
                  }}
                >
                  REMOVE TASK
                </button>
              )}
              <button className={styles.toggleButton} onClick={() => toggleTask(index)}>
                {expandedTasks.includes(index) ? 'HIDE DETAILS' : 'VIEW DETAILS'}
              </button>
            </div>
          </div>

          <div
            className={`${styles.taskDetailsWrapper} ${expandedTasks.includes(index) ? styles.taskDetailsExpanded : ''
              }`}
          >
            <div className={styles.taskDetails}>
              {[
                ['Name', task.name, 'name'],
                ['Description', task.description, 'description'],
                ['Developer', task.developer, 'developer'],
                ['Create Date', task.createDate?.slice(0, 10), 'createDate', 'date'],
                ['Target Date', task.targetDate?.slice(0, 10), 'targetDate', 'date'],
              ].map(([label, value, key, type = 'text'], i) => (
                <div key={i} className={styles.inputGroup}>
                  <label>{label}</label>
                  {key === 'developer' ? (
                    <select
                      className={styles.input}
                      value={task.developer}
                      disabled={!isManager}
                      onChange={(e) => {
                        const updatedTasks = [...project.tasks];
                        updatedTasks[index].developer = e.target.value;
                        setProject({ ...project, tasks: updatedTasks });
                      }}
                    >
                      {Array.isArray(developers) &&
                        developers.map((dev) => (
                          <option key={dev.userID} value={dev.userID}>
                            {dev.name} ({dev.role})
                          </option>
                        ))}
                    </select>
                  ) : (
                    <input
                      type={type}
                      value={value as string}
                      disabled={!isManager}
                      className={styles.input}
                      min={project.startDate?.slice(0, 10)}
                      max={project.endDate?.slice(0, 10)}
                      onChange={(e) => {
                        const updatedTasks = [...project.tasks];
                        updatedTasks[index][key as string] = e.target.value;
                        setProject({ ...project, tasks: updatedTasks });
                      }}
                    />
                  )}
                </div>
              ))}

              <div className={styles.inputGroup}>
                <label>Status</label>
                <div className={styles.radioGroup}>
                  {['Pending', 'Completed'].map((statusOption) => (
                    <label key={statusOption} className={styles.radioLabel}>
                      <input
                        type="radio"
                        name={`task-${index}-status`}
                        value={statusOption}
                        checked={task.status === statusOption}
                        disabled={!(isDeveloper && loggedDev === task.developer && project.status !== 'Not Started' || isManager)}
                        onChange={() => {
                          const updated = [...project.tasks];
                          updated[index].status = statusOption;
                          setProject({ ...project, tasks: updated });
                          handleStatusChange(statusOption);
                        }}
                      />
                      {statusOption}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}



      <div className={styles.actions}>
        <button
          className={styles.greenButton}
          onClick={() => {
            const url = `/project-report?projectID=${projectID}`;
            window.open(url, '_blank');
          }}
        >
          GENERATE REPORT
        </button>
        {isManager && (
          <button className={styles.greenButton} onClick={handleAddTask}>
            ADD MORE TASKS
          </button>
        )}
        <button className={styles.greenButton} onClick={() => { setAlertAction('update'); setShowAlert(true); }}>
          APPLY CHANGES
        </button>

        {isManager && (
          <button onClick={() => { setAlertAction('delete'); setShowAlert(true); }}>
            REMOVE PROJECT
          </button>
        )}

        {showAlert && alertAction && (
          <AlertBox
            show={showAlert}
            param={
              alertAction === 'remove-task'
                ? 'remove this task'
                : `want to ${alertAction} the project`
            }
            onConfirm={() => {
              if (alertAction === 'update') handleUpdate();
              else if (alertAction === 'delete') handleDelete();
              else if (alertAction === 'remove-task' && taskToRemoveIndex !== null) {
                handleRemoveTask(taskToRemoveIndex);
              }
              setShowAlert(false);
              setAlertAction(null);
              setTaskToRemoveIndex(null);
            }}
            onCancel={() => {
              setShowAlert(false);
              setAlertAction(null);
              setTaskToRemoveIndex(null);
            }}
          />
        )}

        {showReport && project && (
          <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg max-h-[90vh] overflow-y-auto">
              <ProjectPDFReport project={project} />
              <button
                className="mt-4 px-4 py-2 bg-gray-500 text-white rounded"
                onClick={() => setShowReport(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}