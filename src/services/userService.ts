import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit as fbLimit,
  startAfter
} from 'firebase/firestore';
import { onSnapshot } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, auth, storage } from '../lib/firebase';
import { User, ApiResponse, PaginatedResponse, QueryFilters } from '../types';

class UserService {
  private collectionName = 'users';
  private storageFolder = 'user_avatars';

  // Get all users with filters
  async getUsers(filters: QueryFilters = {}): Promise<PaginatedResponse<User>> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;

      let q = query(collection(db, this.collectionName));

      // Apply filters
      if (status && status !== 'all') {
        q = query(q, where('status', '==', status));
      }

      // Apply sorting
      q = query(q, orderBy(sortBy, sortOrder));

      // Apply pagination
      if (page > 1) {
        const previousPageQuery = query(
          collection(db, this.collectionName),
          orderBy(sortBy, sortOrder),
          fbLimit((page - 1) * limit)
        );
        const previousDocs = await getDocs(previousPageQuery);
        const lastDoc = previousDocs.docs[previousDocs.docs.length - 1];
        if (lastDoc) {
          q = query(q, startAfter(lastDoc), fbLimit(limit));
        }
      } else {
        q = query(q, fbLimit(limit));
      }

      const querySnapshot = await getDocs(q);
      let users = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];

      // Apply search filter (client-side for complex text search)
      if (search) {
        const searchLower = search.toLowerCase();
        users = users.filter(user => 
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          (user.phone && user.phone.toLowerCase().includes(searchLower))
        );
      }

      // Get total count for pagination
      const totalQuery = query(collection(db, this.collectionName));
      const totalSnapshot = await getDocs(totalQuery);
      const total = totalSnapshot.size;

      return {
        success: true,
        data: users,
        total,
        page,
        limit,
        hasMore: users.length === limit
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        hasMore: false
      };
    }
  }

  // Get user by ID
  async getUser(id: string): Promise<ApiResponse<User>> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          success: true,
          data: {
            id: docSnap.id,
            ...docSnap.data()
          } as User
        };
      } else {
        return {
          success: false,
          error: 'User not found'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get user'
      };
    }
  }

  // Create new user
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { password: string }): Promise<ApiResponse<User>> {
    try {
      const { password, ...userDataWithoutPassword } = userData;
      
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, password);
      const firebaseUser = userCredential.user;

      // Update Firebase Auth profile
      await updateProfile(firebaseUser, {
        displayName: userData.name
      });

      const now = new Date().toISOString();
      const newUser = {
        ...userDataWithoutPassword,
        id: firebaseUser.uid,
        createdAt: now,
        updatedAt: now
      };

      // Save user data to Firestore
      await setDoc(doc(db, this.collectionName, firebaseUser.uid), newUser);
      
      return {
        success: true,
        data: newUser as User,
        message: 'User created successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create user'
      };
    }
  }

  // Update user
  async updateUser(id: string, updates: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(docRef, updateData);

      // Get updated document
      const updatedDoc = await getDoc(docRef);
      if (updatedDoc.exists()) {
        return {
          success: true,
          data: {
            id: updatedDoc.id,
            ...updatedDoc.data()
          } as User,
          message: 'User updated successfully'
        };
      } else {
        return {
          success: false,
          error: 'User not found after update'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update user'
      };
    }
  }

  // Delete user
  async deleteUser(id: string): Promise<ApiResponse<null>> {
    try {
      // Get user data first to delete associated avatar
      const userResponse = await this.getUser(id);
      if (!userResponse.success || !userResponse.data) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Delete associated avatar from storage if it exists
      const user = userResponse.data;
      if (user.avatar && user.avatar.includes('firebasestorage.googleapis.com')) {
        try {
          const avatarRef = ref(storage, user.avatar);
          await deleteObject(avatarRef);
        } catch (avatarError) {
          // Avatar deletion failed, but continue with user deletion
          console.warn('Failed to delete user avatar:', avatarError);
        }
      }

      // Delete user document
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);

      return {
        success: true,
        message: 'User deleted successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete user'
      };
    }
  }

  // Upload user avatar
  async uploadAvatar(file: File, userId: string): Promise<ApiResponse<string>> {
    try {
      const fileName = `${userId}_${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `${this.storageFolder}/${fileName}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Update user document with new avatar URL
      await this.updateUser(userId, { avatar: downloadURL });
      
      return {
        success: true,
        data: downloadURL,
        message: 'Avatar uploaded successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to upload avatar'
      };
    }
  }

  // Update user status
  async updateUserStatus(id: string, status: User['status']): Promise<ApiResponse<User>> {
    try {
      return await this.updateUser(id, { status });
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update user status'
      };
    }
  }

  // Update user role
  async updateUserRole(id: string, role: User['role']): Promise<ApiResponse<User>> {
    try {
      return await this.updateUser(id, { role });
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update user role'
      };
    }
  }

  // Get users by role
  async getUsersByRole(role: User['role']): Promise<ApiResponse<User[]>> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('role', '==', role),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const users = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];

      return {
        success: true,
        data: users
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message || 'Failed to get users by role'
      };
    }
  }

  // Get active users count
  async getActiveUsersCount(): Promise<ApiResponse<number>> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('status', '==', 'active')
      );

      const querySnapshot = await getDocs(q);
      
      return {
        success: true,
        data: querySnapshot.size
      };
    } catch (error: any) {
      return {
        success: false,
        data: 0,
        error: error.message || 'Failed to get active users count'
      };
    }
  }

  // Get users statistics
  async getUsersStats(): Promise<ApiResponse<{
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    admins: number;
    editors: number;
    viewers: number;
    thisMonth: number;
  }>> {
    try {
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      const users = querySnapshot.docs.map(doc => doc.data()) as User[];

      const now = new Date();
      const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const stats = {
        total: users.length,
        active: users.filter(u => u.status === 'active').length,
        inactive: users.filter(u => u.status === 'inactive').length,
        suspended: users.filter(u => u.status === 'suspended').length,
        admins: users.filter(u => u.role === 'admin').length,
        editors: users.filter(u => u.role === 'editor').length,
        viewers: users.filter(u => u.role === 'viewer').length,
        thisMonth: users.filter(u => u.createdAt.startsWith(thisMonth)).length
      };

      return {
        success: true,
        data: stats
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get users statistics'
      };
    }
  }

  // Bulk update users
  async bulkUpdateUsers(ids: string[], updates: Partial<User>): Promise<ApiResponse<number>> {
    try {
      let updatedCount = 0;
      const updatePromises = ids.map(async (id) => {
        try {
          await this.updateUser(id, updates);
          updatedCount++;
        } catch (error) {
          console.error(`Failed to update user ${id}:`, error);
        }
      });

      await Promise.all(updatePromises);

      return {
        success: true,
        data: updatedCount,
        message: `Successfully updated ${updatedCount} users`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to bulk update users'
      };
    }
  }

  // Real-time: subscribe to users list
  subscribeToUsers(filters: QueryFilters = {}, callback: (users: User[]) => void) {
    const {
      search,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = 50
    } = filters;

    let q = query(collection(db, this.collectionName));

    if (status && status !== 'all') {
      q = query(q, where('status', '==', status));
    }

    q = query(q, orderBy(sortBy, sortOrder), fbLimit(limit));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let users = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as User[];
      if (search) {
        const s = search.toLowerCase();
        users = users.filter(u =>
          u.name.toLowerCase().includes(s) ||
          u.email.toLowerCase().includes(s) ||
          (u.phone && u.phone.toLowerCase().includes(s))
        );
      }
      callback(users);
    });

    return unsubscribe;
  }

  // Real-time: subscribe to single user
  subscribeToUser(id: string, callback: (user: User | null) => void) {
    const ref = doc(db, this.collectionName, id);
    return onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() } as User);
      } else {
        callback(null);
      }
    });
  }
}

export const userService = new UserService();