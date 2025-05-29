import { todosCollection } from '../../lib/firebase';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export interface RepeatSettings {
  type: 'daily' | 'weekly' | 'custom';
  // 'custom'일 경우 추가 설정 (예: 매주 특정 요일, 매월 특정일 등)
  days?: number[]; // 0 (일요일) - 6 (토요일)
  interval?: number; // 예: 2 (2주마다)
}

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  failed: boolean;
  createdAt: FirebaseFirestoreTypes.Timestamp; // 생성 시간 추가
  dueDate?: FirebaseFirestoreTypes.Timestamp;
  repeat?: RepeatSettings;
  // Google Calendar 이벤트 ID (선택 사항)
  googleCalendarEventId?: string;
}

// Todo 항목을 추가하는 함수 (예시)
export const addTodo = async (todo: Omit<Todo, 'id' | 'createdAt'>): Promise<string | null> => {
  try {
    const docRef = await todosCollection.add({
      ...todo,
      createdAt: firestore.FieldValue.serverTimestamp(), // 서버 타임스탬프 사용
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding document: ", error);
    return null;
  }
};

// 모든 Todo 항목 가져오기
export const getTodos = async (): Promise<Todo[]> => {
  try {
    const snapshot = await todosCollection.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Todo));
  } catch (error) {
    console.error("Error getting documents: ", error);
    return [];
  }
};

// Todo 항목 업데이트 (체크/완료/실패 처리 포함)
export const updateTodo = async (id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>): Promise<void> => {
  try {
    await todosCollection.doc(id).update(updates);
  } catch (error) {
    console.error("Error updating document: ", error);
  }
};

// Todo 항목 삭제
export const deleteTodo = async (id: string): Promise<void> => {
  try {
    await todosCollection.doc(id).delete();
  } catch (error) {
    console.error("Error deleting document: ", error);
  }
};

// 여기에 더 많은 CRUD 함수 (getTodos, updateTodo, deleteTodo 등)를 추가할 예정입니다. 