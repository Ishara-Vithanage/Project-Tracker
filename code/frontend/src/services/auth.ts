//*****************************************************************************************
//** Project       : Project Tracking System      
//** Author        : Ishara Harshana
//** Written Date  : 15/05/2025
//** Purpose       : Log users with AD credentials 
//*****************************************************************************************

import axios, { AxiosResponse } from 'axios';
import { env } from 'process';

// Define input shape for login
export interface LoginCredentials {
  userID: string;
  password: string;
}

// Define response shape (update based on actual API response structure)
export interface LoginResponse {
  token?: string;
  message?: string;
  [key: string]: any;
}

const backendAPI = env.BASE_API_URL

// Login function
const loginUser = async (
  values: LoginCredentials
): Promise<AxiosResponse<LoginResponse>> => {
  try {
    const response = await axios.post<LoginResponse>(`${backendAPI}/Login`, values);
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

const getUserDetails = async (userID: string) => {
  try {
    const response = await axios.post<LoginResponse>(`${backendAPI}/get-seylan-user-details`, {
      userID: userID
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