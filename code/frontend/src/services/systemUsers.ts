import axios from 'axios';
import { env } from 'process';

// Base API URL
const backendAPI = `${env.BASE_API_URL}/users`;

// Define the structure of a user (you can customize this further)
export interface User {
  userID: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLogin: Date | string; // Use Date or string based on your API response
  [key: string]: any; // fallback for extra props
}

// Add/Edit user input shape (can reuse User, or use Partial<User> if not all fields are needed)
type UserInput = Partial<User>;

// 1. Get all users
const getUsers = async (): Promise<User[]> => {
  try {
    const response = await axios.get<User[]>(`${backendAPI}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

// 1. Get user by ID
const getUserbyUserID = async (id: string): Promise<User> => {
  try {
    const response = await axios.get<User>(`${backendAPI}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

// 2. Add a new user
const addUser = async (values: UserInput): Promise<any> => {
  try {
    const response = await axios.post(`${backendAPI}`, values);
    return response;
  } catch (error) {
    console.error('Error adding user:', error);
    throw error;
  }
};

// 3. Delete a user by ID
const deleteUser = async (id: string): Promise<void> => {
  try {
    await axios.delete(`${backendAPI}/${id}`);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// 4. Get users by type
const getUsersAsType = async (
  userType: string
): Promise<{ users: User[]; count: number }> => {
  try {
    const response = await axios.get<User[]>(`${backendAPI}/getUserAsType?userType=${userType}`);
    const users = response.data;
    return { users, count: users.length };
  } catch (error) {
    console.error('Error fetching users by type:', error);
    throw error;
  }
};

// 5. Update user
const updateUser = async (
  id: string,
  updatedUser: UserInput,
): Promise<void> => {
  try {
    await axios.put(`${backendAPI}/${id}`, updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// 6. Get managers by department
const getManagersByDept = async (
  userDepartment: string
): Promise<{ users: User[]; count: number }> => {
  try {
    const response = await axios.get<User[]>(
      `${backendAPI}/get-managers-by-department/${userDepartment}`
    );
    const users = response.data;
    return { users, count: users.length };
  } catch (error) {
    console.error('Error fetching managers by department:', error);
    throw error;
  }
};

// Exports
export {
  getUsers,
  getUserbyUserID,
  addUser,
  deleteUser,
  getUsersAsType,
  updateUser,
  getManagersByDept,
};