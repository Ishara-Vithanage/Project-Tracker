import axios from 'axios';
import { notFound } from 'next/navigation';

// Base API URL
const backendAPI = process.env.NEXT_PUBLIC_BASE_API_URL;

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
    const response = await axios.get<SubTasks[]>(`${backendAPI}/tasks`);
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

// Get Tasks by Manager
const GetTaskbyManager = async (manager: string): Promise<SubTasks[]> => {
  try {
    const response = await axios.get<SubTasks[]>(`${backendAPI}/tasks/by-manager/${manager}`);
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
const GetTaskbyDeveloper = async (devevloper: string): Promise<SubTasks[]> => {
  try {
    const response = await axios.get<SubTasks[]>(`${backendAPI}/tasks/by-developer/${devevloper}`);
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
