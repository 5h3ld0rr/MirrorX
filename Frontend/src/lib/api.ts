import { auth } from './firebase';
import { signInWithCustomToken } from 'firebase/auth';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const exchangeToken = async (customToken: string) => {
  const userCred = await signInWithCustomToken(auth, customToken);
  return await userCred.user.getIdToken();
};
export const updateProfile = async (data: { name?: string, bio?: string }) => {
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
