import { auth } from './firebase';
import { signInWithCustomToken } from 'firebase/auth';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const exchangeToken = async (customToken: string) => {
  const userCred = await signInWithCustomToken(auth, customToken);
  return await userCred.user.getIdToken();
};

export const getUserProfile = async () => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("No authenticated user");

  const response = await fetch(`${API_BASE_URL}/users/profile`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) throw new Error('Failed to fetch profile');
  return await response.json();
};
export const updateProfile = async (data: { 
  name?: string, 
  bio?: string, 
  rgbColor?: { r: number, g: number, b: number }, 
  brightness?: number, 
  appBrightness?: number, 
  accentColor?: string,
  alarms?: any[],
  standbyDelay?: number, // Legacy field for mapping support
  logoutDelay?: number,  // Legacy field for mapping support
  standByDelay?: number,
  terminationDelay?: number,
  widgetSettings?: any,
  musicSyncEnabled?: boolean
}) => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("No authenticated user");

  const response = await fetch(`${API_BASE_URL}/users/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update profile');
  }

  return await response.json();
};

export const updateProfilePicture = async (formData: FormData) => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("No authenticated user");

  const response = await fetch(`${API_BASE_URL}/users/profile-picture`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update profile picture');
  }

  return await response.json();
};

// Alarms API
export const getAlarms = async () => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("No authenticated user");

  const response = await fetch(`${API_BASE_URL}/alarms`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch alarms');
  return await response.json();
};

export const createAlarm = async (data: any) => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("No authenticated user");

  const response = await fetch(`${API_BASE_URL}/alarms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  return await response.json();
};

export const updateAlarm = async (id: string, data: any) => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("No authenticated user");

  const response = await fetch(`${API_BASE_URL}/alarms/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  return await response.json();
};

export const deleteAlarm = async (id: string) => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("No authenticated user");

  const response = await fetch(`${API_BASE_URL}/alarms/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
};

// Notes API
export const getNotes = async () => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("No authenticated user");

  const response = await fetch(`${API_BASE_URL}/notes`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch notes');
  return await response.json();
};

export const createNote = async (data: any) => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("No authenticated user");

  const response = await fetch(`${API_BASE_URL}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  return await response.json();
};

export const updateNote = async (id: string, data: any) => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("No authenticated user");

  const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  return await response.json();
};

export const deleteNote = async (id: string) => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("No authenticated user");

  const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
};
