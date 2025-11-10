import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User, ApiResponse } from '../types';

class AuthService {
  // Demo credentials
  private demoCredentials = [
    {
      email: 'admin@demo.com',
      password: 'demo123',
      user: {
        id: 'demo-admin-001',
        name: 'Admin User',
        email: 'admin@demo.com',
        role: 'admin',
        status: 'active',
        imageUrl: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      }
    },
    {
      email: 'user@demo.com',
      password: 'demo123',
      user: {
        id: 'demo-user-001',
        name: 'Demo User',
        email: 'user@demo.com',
        role: 'user',
        status: 'active',
        imageUrl: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      }
    }
  ];

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<ApiResponse<User>> {
    // Check for demo credentials first
    const demoAccount = this.demoCredentials.find(
      cred => cred.email === email && cred.password === password
    );

    if (demoAccount) {
      // Store demo user in localStorage
      localStorage.setItem('demoUser', JSON.stringify(demoAccount.user));
      return {
        success: true,
        data: demoAccount.user
      };
    }

    // Try Firebase authentication
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Clear demo user if any
      localStorage.removeItem('demoUser');
      
      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        
        // Update last login
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          ...userData,
          lastLogin: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });
        
        return {
          success: true,
          data: {
            ...userData,
            lastLogin: new Date().toISOString()
          }
        };
      } else {
        // Create user document if it doesn't exist (for first-time admin users)
        const newUser: User = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Admin User',
          email: firebaseUser.email || email,
          role: 'admin',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        
        await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
        
        return {
          success: true,
          data: newUser
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to sign in'
      };
    }
  }

  // Sign out
  async signOut(): Promise<ApiResponse<null>> {
    try {
      // Check if it's a demo user
      const demoUser = localStorage.getItem('demoUser');
      if (demoUser) {
        localStorage.removeItem('demoUser');
        return {
          success: true,
          message: 'Signed out successfully'
        };
      }

      await signOut(auth);
      return {
        success: true,
        message: 'Signed out successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to sign out'
      };
    }
  }

  // Get current user
  getCurrentUser(): Promise<User | null> {
    return new Promise((resolve) => {
      // Check for demo user first
      const demoUser = localStorage.getItem('demoUser');
      if (demoUser) {
        resolve(JSON.parse(demoUser));
        return;
      }

      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        unsubscribe();
        
        if (firebaseUser) {
          try {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userDoc.exists()) {
              resolve(userDoc.data() as User);
            } else {
              resolve(null);
            }
          } catch (error) {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    });
  }

  // Listen to auth state changes
  onAuthStateChange(callback: (user: User | null) => void) {
    // Check for demo user first
    const demoUser = localStorage.getItem('demoUser');
    if (demoUser) {
      callback(JSON.parse(demoUser));
    }

    return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      // Skip if using demo user
      if (localStorage.getItem('demoUser')) {
        return;
      }

      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            callback(userDoc.data() as User);
          } else {
            callback(null);
          }
        } catch (error) {
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  }

  // Check if user is admin
  async isAdmin(userId: string): Promise<boolean> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        return userData.role === 'admin';
      }
      return false;
    } catch (error) {
      return false;
    }
  }
}

export const authService = new AuthService();