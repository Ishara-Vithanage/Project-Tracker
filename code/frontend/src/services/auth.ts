//*****************************************************************************************
//** Project       : Project Tracking System      
//** Author        : Ishara Harshana
//** Written Date  : 15/05/2025
//** Purpose       : Log users with AD credentials 
//*****************************************************************************************

import axios, { AxiosResponse } from 'axios';

// Define input shape for login
export interface LoginCredentials {
  userId: string;
  password: string;
}

export interface AuthenticatedUser {
  department: string;
  role: string;
  userId: string;
  status: string;
  email: string;
  name: string;
  lastLogin: string;
}

export interface LoginResponse {
  message: string;
  user: AuthenticatedUser;
}

interface UserDetailsResponse {
  username: string;
  department: string;
  workEmail: string;
}

const backendAPI = process.env.NEXT_PUBLIC_BASE_API_URL

// Login function
const loginUser = async (
  values: LoginCredentials
): Promise<AxiosResponse<LoginResponse>> => {
  try {
    console.log("Login credentials:", values);
    const response = await axios.post<LoginResponse>(`${backendAPI}/login`, values);
    console.log("Login response:", response.data);
    return response;
  } catch (error: any) {
    if (error.response) {
      if (error.response.status === 401 || error.response.status === 400) {
        throw new Error("Invalid userID or password");
      } else {
        throw new Error("Login failed: " + error.response.statusText);
      }
    } else if (error.request) {
      throw new Error("No response from server. Please try again.");
    } else {
      throw new Error("An unexpected error occurred.");
    }
  }
};

const getUserDetails = async (userID: string): Promise<UserDetailsResponse> => {
  try {
    const response = await axios.post<UserDetailsResponse>(`${backendAPI}/get-seylan-user-details`, {
      userID,
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      if (error.response.status === 401) {
        throw new Error("User not found.");
      }
      throw new Error("Failed to fetch user details: " + error.response.statusText);
    } else if (error.request) {
      throw new Error("No response from server. Please try again.");
    } else {
      throw new Error("An unexpected error occurred.");
    }
  }
};


export {
  loginUser,
  getUserDetails,
};