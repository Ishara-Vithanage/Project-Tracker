import axios from 'axios';
import { notFound } from 'next/navigation';
import { env } from 'process';

// Base API URL
const backendAPI = `${env.BASE_API_URL}`;

// Define the structure of a user (you can customize this further)
export interface SubTasks {
  Task_ID: number | null;
  name: string;
  description: string;
  developer: string;
  projectID: Date | null;
  status: Date | null;
  createDate: Date | null;
  targetDate: Date | null;
  [key: string]: any; // fallback for extra props
}

// Get all tasks
const GetTasks = async (): Promise<SubTasks[]> => {
  try {
    const response = await axios.get<SubTasks[]>(`${backendAPI}/SubTasks`);
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

// Get Tasks by Manager
const GetTaskbyManager = async (managerID: string): Promise<SubTasks[]> => {
  try {
    const response = await axios.get<SubTasks[]>(`${backendAPI}/SubTasks/by-manager/${managerID}`);
    if (response.status == 404) {
      notFound();
    }
    return response.data;
  } catch (error) {
    
    console.error('Error fetching data:', error);
    throw error;
  }
};

// Get Tasks by Developer
const GetTaskbyDeveloper = async (devID: string): Promise<SubTasks[]> => {
  try {
    const response = await axios.get<SubTasks[]>(`${backendAPI}/SubTasks/by-developer/${devID}`);
    if (response.status == 404) {
      notFound();
    }
    return response.data;
  } catch (error) {
    
    console.error('Error fetching data:', error);
    throw error;
  }
};

export {
  GetTasks,
  GetTaskbyManager,
  GetTaskbyDeveloper,
};
