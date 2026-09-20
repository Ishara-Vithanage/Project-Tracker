//*****************************************************************************************
//** Project       : Project Tracking System      
//** Author        : Ishara Harshana
//** Written Date  : 15/05/2025
//** Purpose       : Log users with AD credentials 
//*****************************************************************************************

import axios from 'axios';
import { fetchUserAttributes, getCurrentUser, signIn, signOut } from 'aws-amplify/auth';
import './cognito';

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

interface DynamoUserDetails {
  userID?: string;
  userId?: string;
  department?: string;
  role?: string;
  status?: string;
  email?: string;
  name?: string;
  lastLogin?: string;
}

const backendAPI = process.env.NEXT_PUBLIC_BASE_API_URL

// Login function
const loginUser = async (values: LoginCredentials): Promise<LoginResponse> => {
  try {
    try {
      await signOut();
    } catch (error: unknown) {
      if (!(error instanceof Error && error.name === 'UserUnAuthenticatedException')) {
        throw error;
      }
    }

    const { isSignedIn, nextStep } = await signIn({
      username: values.userId,
      password: values.password,
    });

    if (!isSignedIn) {
      throw new Error(`Additional sign-in step required: ${nextStep.signInStep}`);
    }

    const attributes = await fetchUserAttributes();
    const { username } = await getCurrentUser();
    const userId = values.userId || attributes.preferred_username || username;
    const response = await axios.get<DynamoUserDetails>(
      `${backendAPI}/users/by-user-id/${encodeURIComponent(userId)}`
    );
    const userDetails = response.data;
    if (userDetails.status && userDetails.status.toLowerCase() !== 'active') {
      throw new Error('User is inactive');
    }

    const dynamoUserId = userDetails.userID ?? userDetails.userId ?? userId;

    return {
      message: 'Login successful',
      user: {
        department: userDetails.department ?? attributes['custom:department'] ?? '',
        role: userDetails.role ?? attributes['custom:role'] ?? '',
        userId: dynamoUserId,
        status: userDetails.status ?? attributes['custom:status'] ?? 'active',
        email: userDetails.email ?? attributes.email ?? '',
        name: userDetails.name ?? attributes.name ?? dynamoUserId,
        lastLogin: userDetails.lastLogin ?? attributes['custom:lastLogin'] ?? '',
      },
    };
  } catch (error: unknown) {
    if (error instanceof Error && ['NotAuthorizedException', 'UserNotFoundException'].includes(error.name)) {
      throw new Error('Invalid userID or password');
    }
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error('User profile not found');
      }
      throw new Error('Failed to load user profile');
    }
    throw error instanceof Error ? error : new Error('An unexpected error occurred.');
  }
};

export { loginUser };
