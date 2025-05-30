import {
  Timestamp,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp // FieldValue 대신 serverTimestamp 직접 import
} from '@react-native-firebase/firestore';
import { plainToTodo } from '../types/adapters/PlainToTodo';

import { todosCollection, db } from '../lib/firebase'; // db도 가져올 수 있도록 수정
import { Todo } from '../types/todo.types';

// Todo 항목을 추가하는 함수
export const addTodo = async (args: { todo: Omit<Todo, 'id' | 'createdAt' | 'status'> & { title: string } }): Promise<string> => {
  const { todo } = args;
  try {
    const todoDataWithTimestamp = {
      ...todo,
      nextOccurrence: todo.nextOccurrence || Timestamp.now(),
      status: 'ONGOING',
      createdAt: serverTimestamp(), // serverTimestamp() 직접 호출
    };
    const docRef = await addDoc(todosCollection, todoDataWithTimestamp);
    return docRef.id;
  } catch (error) {
    console.error("Error adding document: ", error);
    throw error;
  }
};

// 모든 Todo 항목 가져오기 (nextOccurrence 기준으로 필터링 및 정렬)
export const getTodos = async (): Promise<Todo[]> => {
  try {
    const now = Timestamp.now();
    
    const q = query(
      todosCollection, 
      where('nextOccurrence', '!=', null),
      where('nextOccurrence', '<=', now),
      orderBy('nextOccurrence', 'asc')
    );

    const snapshot = await getDocs(q);

    const todosFromDb = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Todo)); // data()의 타입이 Todo와 완전히 일치하지 않을 수 있으므로 캐스팅 유지

    return todosFromDb;

  } catch (error) {
    console.error("Error getting documents: ", error);
    throw error;
  }
};

export const getTodoById = async (args: { id: string }): Promise<Todo> => {
  const { id } = args;
  const docRef = doc(db, 'todos', id); // doc(db, collectionName, id) 형태로 변경
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) { // exists() 메소드로 확인
    throw new Error('Todo not found');
  }
  // data()의 반환 타입은 DocumentData. plainToTodo를 통해 Todo 타입으로 변환
  return plainToTodo({id: docSnap.id, ...docSnap.data()}); 
};

// Todo 항목 업데이트
export const updateTodo = async (args: { id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>> }): Promise<void> => {
  const { id, updates } = args;
  try {
    const docRef = doc(db, 'todos', id);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error("Error updating document: ", error);
    throw error;
  }
};

// Todo 항목 삭제
export const deleteTodo = async (args: { id: string }): Promise<void> => {
  const { id } = args;
  try {
    const docRef = doc(db, 'todos', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting document: ", error);
    throw error;
  }
}; 