'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import '@/app/globals.css';
import { addProject, GetProject } from '@/services/projectinfo';
import { getUsersAsType } from '@/services/systemUsers';
import { useUser } from '@/app/context/userProvider';
import AlertBox from '@/components/alert-box/page';
import { useToast } from '@/components/toast/page';
import { useRouter } from 'next/navigation';
// import sendEmail from '@/services/sendEmail';
// import mailtoDeveloper from '@/services/mailTemplates/toDeveloperCreate';
// import mailtoManager from '@/services/mailTemplates/toManagerCreate';
import { getUserbyUserID } from '@/services/systemUsers';
import auditLog from "@/services/audit_log";
import getSriLankaTimeISO from "@/services/getSLTime";

interface SubTask {
  task_ID: string;
  name: string;
  description: string;
  developer: string;
  status: string;
  createDate: string;
  targetDate: string;
}

interface ProjectInfo {
  projectId: string;
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

type TaskFormState = Omit<SubTask, 'task_ID' | 'status'>;

const getNextIdentifier = (identifiers: unknown[], prefix: string) => {
  const highestIdentifier = identifiers.reduce<number>((highest, identifier) => {
    const match = String(identifier ?? '').match(new RegExp(`^${prefix}(\\d+)$`));
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);

  return `${prefix}${highestIdentifier + 1}`;
};

const emptyTaskForm: TaskFormState = {
  name: '',
  description: '',
  developer: '',
  createDate: '',
  targetDate: '',
};

export default function CreateProject() {
  const { user } = useUser();
  const router = useRouter();
  const { showToast } = useToast();
  const [showAlert, setShowAlert] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [businessUnit, setBusinessUnit] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectNature, setProjectNature] = useState('');
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [developers, setDevelopers] = useState<{ userID: string; name: string; role: string }[]>([]);
  const [currentTask, setCurrentTask] = useState<TaskFormState>(emptyTaskForm);

  // Edit state
  const [editingTaskID, setEditingTaskID] = useState<string | null>(null);
  const [editTaskForm, setEditTaskForm] = useState<TaskFormState>(emptyTaskForm);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const [devData, mgrData] = await Promise.all([
          getUsersAsType('dev'),
          getUsersAsType('mgr'),
        ]);
        const combined = [
          ...(devData.users ?? []).map(u => ({ ...u, role: 'dev' })),
          ...(mgrData.users ?? []).map(u => ({ ...u, role: 'mgr' })),
        ];
        setDevelopers(combined);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };

    fetchUsers();
  }, []);

  const addSubTask = () => {
    if (currentTask.name && currentTask.description) {
      const newTask: SubTask = {
        task_ID: getNextIdentifier(subTasks.map(task => task.task_ID), 't'),
        name: currentTask.name,
        description: currentTask.description,
        developer: currentTask.developer,
        status: 'Pending',
        createDate: currentTask.createDate || new Date().toISOString().split('T')[0],
        targetDate: currentTask.targetDate,
      };
      setSubTasks([...subTasks, newTask]);
      setCurrentTask(emptyTaskForm);
    }
  };

  const deleteTask = (task_ID: string) => {
    setSubTasks(subTasks.filter(task => task.task_ID !== task_ID));
  };

  const startEditTask = (task: SubTask) => {
    setEditingTaskID(task.task_ID);
    setEditTaskForm({
      name: task.name,
      description: task.description,
      developer: task.developer,
      createDate: task.createDate,
      targetDate: task.targetDate,
    });
  };

  const cancelEdit = () => {
    setEditingTaskID(null);
    setEditTaskForm(emptyTaskForm);
  };

  const saveEditTask = (task_ID: string) => {
    if (!editTaskForm.name || !editTaskForm.description) return;
    setSubTasks(prev =>
      prev.map(t =>
        t.task_ID === task_ID
          ? {
            ...t,
            name: editTaskForm.name,
            description: editTaskForm.description,
            developer: editTaskForm.developer,
            createDate: editTaskForm.createDate,
            targetDate: editTaskForm.targetDate,
          }
          : t
      )
    );
    setEditingTaskID(null);
    setEditTaskForm(emptyTaskForm);
  };

  const handleSubmit = async () => {
    try {
      const projects = await GetProject();
      const projectId = getNextIdentifier(
        projects.map(project => (project as unknown as { projectID?: string }).projectID),
        'p'
      );
      const projectData = {
        projectId,
        name: projectName,
        businessUnit,
        manager: user?.userID || '',
        startDate,
        endDate,
        description: projectDescription,
        nature: projectNature,
        createDate: new Date().toISOString().split('T')[0],
        finishDate: new Date().toISOString().split('T')[0],
        status: "not started",
        tasks: subTasks.map(({ task_ID, ...taskWithoutId }) => ({
          ...taskWithoutId,
          Task_ID: task_ID,
          projectID: projectId,
        })),
      };

      console.log("Submitting project data:", projectData);
      await addProject(projectData as any);
      showToast("Project created successfully", "success");
      router.push('/main/create-project');

      const developerIDs = [...new Set(subTasks.map(task => task.developer).filter(Boolean))];
      const developerUserPromises = developerIDs.map(id => getUserbyUserID(id));
      const developerUsers = (await Promise.all(developerUserPromises)).flat();
      // const developerEmails = developerUsers
      //   .map(devUser => devUser?.email)
      //   .filter(email => email);

      // const developerEmailBody = mailtoDeveloper(
      //   projectData.name,
      //   subTasks.map(task => ({
      //     name: task.name,
      //     developer: developers.find(dev => dev.userID === task.developer)?.name || "Unassigned",
      //     targetDate: task.targetDate,
      //   }))
      // );

      // const managerEmail = user?.email;
      // const managerEmailBody = mailtoManager(
      //   projectData.name,
      //   subTasks.map(task => ({
      //     name: task.name,
      //     developer: developers.find(dev => dev.userID === task.developer)?.name || "Unassigned",
      //     targetDate: task.targetDate,
      //   }))
      // );

      // const emailPromises = [];

      // if (developerEmails.length > 0) {
      //   emailPromises.push(sendEmail({
      //     toEmail: developerEmails.join(','),
      //     subject: `New Project Assigned: ${projectData.name}`,
      //     body: developerEmailBody,
      //   }));
      // }

      // if (managerEmail) {
      //   emailPromises.push(sendEmail({
      //     toEmail: user?.email,
      //     subject: `Project Created: ${projectData.name}`,
      //     body: managerEmailBody,
      //   }));
      // }

      // await Promise.all(emailPromises);

      // const auditEntry = {
      //   user: user.userID,
      //   action: "New Project Created",
      //   keyValue: projectName,
      //   tableName: "PROJECT_INFO",
      //   updateField: "",
      //   newValue: "",
      //   oldValue: "",
      //   LMD: getSriLankaTimeISO(),
      // };
      // await auditLog(auditEntry);

    } catch (error) {
      showToast("Error creating project: " + (error instanceof Error ? error.message : "Unknown error"), "error");
      console.error("Error creating project:", error);
    }
  };

  const formValid =
    projectName.trim() !== '' &&
    businessUnit.trim() !== '' &&
    startDate.trim() !== '' &&
    endDate.trim() !== '' &&
    projectDescription.trim() !== '' &&
    projectNature.trim() !== '';

  return (
    <div className={styles.main_container}>
      <h1>CREATE NEW PROJECT</h1>
      <div className={styles.form}>
        <div className={styles.formRow}>
          <div className={styles.inputField}>
            <label>Project Name</label>
            <input type="text" value={projectName} onChange={e => setProjectName(e.target.value)} />
          </div>

          <div className={styles.inputField}>
            <label>Business Unit</label>
            <input type="text" value={businessUnit} onChange={e => setBusinessUnit(e.target.value)} />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.inputField}>
            <label>Manager</label>
            <input type="text" value={user?.name || ''} disabled />
          </div>

          <div className={styles.inputField}>
            <label>Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>

          <div className={styles.inputField}>
            <label>End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.inputField}>
            <label>Nature</label>
            <select value={projectNature} onChange={e => setProjectNature(e.target.value)}>
              <option value="" disabled>Select</option>
              <option>New</option>
              <option>Existing</option>
              <option>Bug fix/Patch</option>
            </select>
          </div>

          <div className={styles.inputField}>
            <label>Description</label>
            <textarea value={projectDescription} onChange={e => setProjectDescription(e.target.value)} />
          </div>
        </div>
      </div>

      <div className={styles.subSection}>
        <h2>ADD SUB TASK</h2>

        <div className={styles.formRow}>
          <div className={styles.inputField}>
            <label>Task Name</label>
            <input
              type="text"
              value={currentTask.name}
              onChange={e => setCurrentTask({ ...currentTask, name: e.target.value })}
            />
          </div>

          <div className={styles.inputField}>
            <label>Create Date</label>
            <input
              type="date"
              min={startDate?.slice(0, 10)}
              max={endDate?.slice(0, 10)}
              value={currentTask.createDate}
              onChange={e => setCurrentTask({ ...currentTask, createDate: e.target.value })}
            />
          </div>

          <div className={styles.inputField}>
            <label>Target Date</label>
            <input
              type="date"
              min={startDate?.slice(0, 10)}
              max={endDate?.slice(0, 10)}
              value={currentTask.targetDate}
              onChange={e => setCurrentTask({ ...currentTask, targetDate: e.target.value })}
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.inputField}>
            <label>Description</label>
            <textarea
              value={currentTask.description}
              onChange={e => setCurrentTask({ ...currentTask, description: e.target.value })}
            />
          </div>

          <div className={styles.inputField}>
            <label>Developer</label>
            <select
              value={currentTask.developer}
              onChange={e => setCurrentTask({ ...currentTask, developer: e.target.value })}
            >
              <option value="">Select</option>
              {developers.map(dev => (
                <option key={dev.userID} value={dev.userID}>
                  {dev.name} ({dev.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.actions}>
          <button onClick={addSubTask}>ADD TASK</button>
        </div>

        {subTasks.length > 0 && (
          <div className={styles.taskList}>
            <p className={styles.subheading}>TASK SUMMARY</p>
            {subTasks.map(task => (
              <div key={task.task_ID} className={styles.taskCard}>
                {editingTaskID === task.task_ID ? (
                  /* ── EDIT MODE ── */
                  <div className={styles.editForm}>
                    <div className={styles.editRow}>
                      <div className={styles.editField}>
                        <label>Task Name</label>
                        <input
                          type="text"
                          value={editTaskForm.name}
                          onChange={e => setEditTaskForm({ ...editTaskForm, name: e.target.value })}
                        />
                      </div>
                      <div className={styles.editField}>
                        <label>Create Date</label>
                        <input
                          type="date"
                          min={startDate?.slice(0, 10)}
                          max={endDate?.slice(0, 10)}
                          value={editTaskForm.createDate}
                          onChange={e => setEditTaskForm({ ...editTaskForm, createDate: e.target.value })}
                        />
                      </div>
                      <div className={styles.editField}>
                        <label>Target Date</label>
                        <input
                          type="date"
                          min={startDate?.slice(0, 10)}
                          max={endDate?.slice(0, 10)}
                          value={editTaskForm.targetDate}
                          onChange={e => setEditTaskForm({ ...editTaskForm, targetDate: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className={styles.editRow}>
                      <div className={styles.editFieldWide}>
                        <label>Description</label>
                        <textarea
                          value={editTaskForm.description}
                          onChange={e => setEditTaskForm({ ...editTaskForm, description: e.target.value })}
                        />
                      </div>
                      <div className={styles.editField}>
                        <label>Developer</label>
                        <select
                          value={editTaskForm.developer}
                          onChange={e => setEditTaskForm({ ...editTaskForm, developer: e.target.value })}
                        >
                          <option value="">Select</option>
                          {developers.map(dev => (
                            <option key={dev.userID} value={dev.userID}>
                              {dev.name} ({dev.role})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className={styles.btnSectionTask}>
                      <button className={styles.saveBtn} onClick={() => saveEditTask(task.task_ID)}>SAVE</button>
                      <button className={styles.cancelBtn} onClick={cancelEdit}>CANCEL</button>
                    </div>
                  </div>
                ) : (
                  /* ── VIEW MODE ── */
                  <>
                    <div className={styles.taskCardHeader}>
                      <strong>{task.name}</strong>
                    </div>
                    <div className={styles.taskCardMeta}>
                      <span>
                        👤 {developers.find(d => d.userID === task.developer)?.name || 'Unassigned'}
                      </span>
                    </div>
                    <div className={styles.taskCardDesc}>{task.description}</div>
                    <div className={styles.taskCardDates}>
                      Start: {task.createDate} &nbsp;|&nbsp; Target: {task.targetDate}
                    </div>
                    <div className={styles.btnSectionTask}>
                      <button onClick={() => startEditTask(task)}>EDIT</button>
                      <button onClick={() => deleteTask(task.task_ID)}>DELETE</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <button type='submit' disabled={!formValid} onClick={() => setShowAlert(true)}>CREATE PROJECT</button>
        <AlertBox
          show={showAlert}
          param="to create this project"
          onConfirm={() => {
            handleSubmit();
            setShowAlert(false);
          }}
          onCancel={() => setShowAlert(false)}
        />
      </div>
    </div>
  );
}
