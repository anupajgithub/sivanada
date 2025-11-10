import { useState, useEffect } from 'react';
import { authService } from '../services';
import { User } from '../types';

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize auth state
    const initAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen to auth state changes
    const unsubscribe = authService.onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.signIn(email, password);
      
      if (response.success && response.data) {
        setUser(response.data);
        return { success: true };
      } else {
        setError(response.error || 'Sign in failed');
        return { success: false, error: response.error };
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Sign in failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const response = await authService.signOut();
      
      if (response.success) {
        setUser(null);
        return { success: true };
      } else {
        setError(response.error || 'Sign out failed');
        return { success: false, error: response.error };
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Sign out failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    signIn,
    signOut,
    isAuthenticated: !!user
  };
}