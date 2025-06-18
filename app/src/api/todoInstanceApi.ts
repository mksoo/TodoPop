import {
  Timestamp,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  where,
  collection
} from '@react-native-firebase/firestore';
import { plainToTodoInstance } from '../types/adapters/PlainToTodoInstance';
import { TodoInstance } from '../types/todoInstance.types';
import { db } from '../lib/firebase';

// TodoInstance 컬렉션 참조
const todoInstancesCollection = collection(db, 'TodoInstances');

/**
 * 새로운 TodoInstance를 Firestore에 추가합니다.
 */
export const addTodoInstance = async (instance: Omit<TodoInstance, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(todoInstancesCollection, {
      ...instance,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding TodoInstance:', error);
    throw error;
  }
};

/**
 * TodoInstance 목록을 가져옵니다. (기간 필터, 템플릿 필터 등 확장 가능)
 */
export const getTodoInstances = async (args: {
  templateId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
  uid?: string;
} = {}): Promise<TodoInstance[]> => {
  try {
    let q = query(todoInstancesCollection);
    // 필터 조건 추가
    if (args.templateId) {
      q = query(q, where('templateId', '==', args.templateId));
    }
    if (args.startDate) {
      q = query(q, where('instanceDate', '>=', Timestamp.fromDate(args.startDate)));
    }
    if (args.endDate) {
      q = query(q, where('instanceDate', '<=', Timestamp.fromDate(args.endDate)));
    }
    if (args.status) {
      q = query(q, where('status', '==', args.status));
    }
    if (args.uid) {
      q = query(q, where('uid', '==', args.uid));
    }
    q = query(q, orderBy('instanceDate', 'desc'));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => plainToTodoInstance({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting TodoInstances:', error);
    throw error;
  }
};

/**
 * 특정 ID의 TodoInstance를 가져옵니다.
 */
export const getTodoInstanceById = async (args: { id: string }): Promise<TodoInstance> => {
  const { id } = args;
  try {
    const docRef = doc(todoInstancesCollection, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error(`TodoInstance with id ${id} not found`);
    }
    return plainToTodoInstance({ id: docSnap.id, ...docSnap.data() });
  } catch (error) {
    console.error('Error getting TodoInstance by id:', error);
    throw error;
  }
};

/**
 * TodoInstance를 업데이트합니다.
 */
export const updateTodoInstance = async (args: { id: string; updates: Partial<Omit<TodoInstance, 'id' | 'createdAt'>> }): Promise<void> => {
  const { id, updates } = args;
  try {
    const docRef = doc(todoInstancesCollection, id);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error('Error updating TodoInstance:', error);
    throw error;
  }
};

/**
 * TodoInstance를 삭제합니다.
 */
export const deleteTodoInstance = async (args: { id: string }): Promise<void> => {
  const { id } = args;
  try {
    const docRef = doc(todoInstancesCollection, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting TodoInstance:', error);
    throw error;
  }
}; 