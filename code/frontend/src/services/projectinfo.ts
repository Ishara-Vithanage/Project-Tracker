import axios from 'axios';
import { notFound } from 'next/navigation';
import { env } from 'process';

// Base API URL
const backendAPI = env.BASE_API_URL

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

// Get projectInfo
const GetProject = async (): Promise<ProjectInfo[]> => {
  try {
    const response = await axios.get<ProjectInfo[]>(`${backendAPI}/projectInfo`);
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

// Get ProjectInfo by ManagerID
const GetProjectbyManager = async (managerID: string): Promise<ProjectInfo[]> => {
  try {
    const response = await axios.get<ProjectInfo[]>(`${backendAPI}/ProjectInfo/by-manager/${managerID}`);
    if (response.status == 404) {
      notFound();
    }
    return response.data;
  } catch (error) {

    console.error('Error fetching data:', error);
    throw error;
  }
};

// Get ProjectInfo by DeveloperID
const GetProjectbyDeveloper = async (devID: string): Promise<ProjectInfo[]> => {
  try {
    const response = await axios.get<ProjectInfo[]>(`${backendAPI}/ProjectInfo/by-developer/${devID}`);
    if (response.status == 404) {
      notFound();
    }
    return response.data;
  } catch (error) {

    console.error('Error fetching data:', error);
    throw error;
  }
};

//Get ProjectInfo by ProjectID
const GetProjectbyID = async (projectID: number): Promise<ProjectInfo> => {
  try {
    const response = await axios.get<ProjectInfo>(`${backendAPI}/ProjectInfo/${projectID}`);
    if (response.status == 404) {
      notFound();
    }
    return response.data;
  } catch (error) {

    console.error('Error fetching data:', error);
    throw error;
  }
};

// Get ProjectInfo by Department
const GetProjectbyDepartment = async (businessUnit: string): Promise<ProjectInfo[]> => {
  try {
    const response = await axios.get<ProjectInfo[]>(`${backendAPI}/ProjectInfo/by-department/${businessUnit}`);
    if (response.status == 404) {
      notFound();
    }
    return response.data;
  } catch (error) {

    console.error('Error fetching data:', error);
    throw error;
  }
};

// Add a new Project
const addProject = async (values: ProjectInfo): Promise<any> => {
  try {
    const response = await axios.post(`${backendAPI}/ProjectInfo`, values);
    if (response.status == 201) {
      console.log("Project added successfully", response)
    }
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Update a Project
const updateProject = async (projectID: number, values: ProjectInfo): Promise<any> => {
  try {
    const response = await axios.put(`${backendAPI}/ProjectInfo/${projectID}`, values);
    if (response.status == 200) {
      console.log("Project updated successfully", response)
    }
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// Delete a Project
const deleteProject = async (projectID: number): Promise<any> => {
  try {
    const response = await axios.delete(`${backendAPI}/ProjectInfo/${projectID}`);
    if (response.status == 200) {
      console.log("Project deleted successfully", response)
    }
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
};


// Exports
export {
  GetProject,
  GetProjectbyManager,
  GetProjectbyDeveloper,
  GetProjectbyID,
  GetProjectbyDepartment,
  addProject,
  updateProject,
  deleteProject
};
