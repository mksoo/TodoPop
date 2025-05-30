import firestore from '@react-native-firebase/firestore';
import { todosCollection } from '../lib/firebase'; // 경로 수정
import { Todo } from '../types/todo.types'; // 경로 수정
import { plainToTodo } from '@/types/adapters/PlainToTodo';

// Todo 항목을 추가하는 함수
export const addTodo = async (args: { todo: Omit<Todo, 'id' | 'createdAt'> }): Promise<string> => {
  const { todo } = args;
  try {
    const docRef = await todosCollection.add({
      ...todo,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding document: ", error);
    throw error;
  }
};

// 모든 Todo 항목 가져오기
export const getTodos = async (): Promise<Todo[]> => {
  try {
    const snapshot = await todosCollection.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => plainToTodo(doc.data()));
  } catch (error) {
    console.error("Error getting documents: ", error);
    throw error;
  }
};

export const getTodoById = async (args: { id: string }): Promise<Todo> => {
  const { id } = args;
  const doc = await todosCollection.doc(id).get();
  const data = doc.data();

  if (!data) {
    throw new Error('Todo not found');
  }

  return plainToTodo(data);
};

// Todo 항목 업데이트
export const updateTodo = async (args: { id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>> }): Promise<void> => {
  const { id, updates } = args;
  try {
    await todosCollection.doc(id).update(updates);
  } catch (error) {
    console.error("Error updating document: ", error);
    throw error;
  }
};

// Todo 항목 삭제
export const deleteTodo = async (args: { id: string }): Promise<void> => {
  const { id } = args;
  try {
    await todosCollection.doc(id).delete();
  } catch (error) {
    console.error("Error deleting document: ", error);
    throw error;
  }
}; 