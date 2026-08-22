import axios from 'axios';
import { env } from 'process';

const backendAPI = env.BASE_API_URL

interface DevStat {
  name: string;
  userID: string;
  department: string;
  email: string;
  pendingProjects: number;
  pendingTasks: number;
}

// Get developerStats
const GetDeveloperStat = async (): Promise<DevStat[]> => {
  try {
    const response = await axios.get<DevStat[]>(`${backendAPI}/Developer/stats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

export {
    GetDeveloperStat
}