import axios from 'axios';
import { auth } from './firebase';
import { signInWithCustomToken } from 'firebase/auth';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Helper to get ID Token from Custom Token returned by backend
 */
export const exchangeToken = async (customToken: string) => {
  const userCred = await signInWithCustomToken(auth, customToken);
  return await userCred.user.getIdToken();
};
