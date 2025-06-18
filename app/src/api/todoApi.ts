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
  serverTimestamp, // FieldValue 대신 serverTimestamp 직접 import
  where,
  collection
} from '@react-native-firebase/firestore';
import { plainToTodo } from '../types/adapters/PlainToTodo';
import { Todo } from '../types/todo.types';
import { db } from '../lib/firebase';

// 'todos' 컬렉션에 대한 참조입니다. Todo 타입을 명시적으로 사용하려면
// collection 함수 호출 시 두 번째 제네릭 인자로 전달하거나 (Firestore v9 Web SDK 방식),
// 또는 withConverter를 사용하는 것이 좋습니다.
// React Native Firebase에서는 아래와 같이 캐스팅 없이 사용해도 기본 타입으로 작동합니다.
// 필요하다면, todosCollection을 사용하는 곳에서 타입을 더 명확히 할 수 있습니다.
const todosCollection = collection(db, 'Todos');

/**
 * 새로운 할 일(Todo) 항목을 Firestore에 추가합니다.
 * 
 * @param args 함수 인자 객체
 * @param args.todo 추가할 할 일 데이터. `id`, `createdAt`, `status` 필드는 서버에서 자동 생성/설정되므로 제외합니다.
 * @returns 생성된 Firestore 문서의 ID.
 * @throws Firestore 작업 중 오류 발생 시 해당 오류를 throw합니다.
 */
export const addTodo = async (args: { todo: Omit<Todo, 'id' | 'createdAt' | 'isActive' | 'lastGeneratedDate'> & { title: string }, uid: string }): Promise<string> => {
  const { todo, uid } = args;
  try {
    const todoDataWithTimestamp = {
      ...todo,
      isActive: true, // 새로운 Todo는 항상 활성화 상태로 시작
      createdAt: serverTimestamp(), // 서버 타임스탬프 사용
      uid,
    };
    const docRef = await addDoc(todosCollection, todoDataWithTimestamp);
    return docRef.id;
  } catch (error) {
    console.error("Error adding document in todoApi: ", error);
    throw error;
  }
};

/**
 * Firestore에서 할 일(Todo) 목록을 가져옵니다.
 * 
 * @returns `Todo` 객체의 배열.
 * @throws Firestore 작업 중 오류 발생 시 해당 오류를 throw합니다.
 */
export const getTodos = async (args: { uid: string }): Promise<Todo[]> => {
  const { uid } = args;
  try {
    let q = query(
      todosCollection,
      where('uid', '==', uid),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => (plainToTodo({ id: doc.id, ...doc.data() })));

  } catch (error) {
    console.error("Error getting documents from todoApi: ", error);
    throw error;
  }
};

/**
 * Firestore에서 특정 ID를 가진 할 일(Todo) 항목을 가져옵니다.
 * 
 * @param args 함수 인자 객체
 * @param args.id 가져올 할 일의 Firestore 문서 ID.
 * @returns `Todo` 객체.
 * @throws 할 일을 찾을 수 없거나 Firestore 작업 중 오류 발생 시 오류를 throw합니다.
 */
export const getTodoById = async (args: { id: string }): Promise<Todo> => {
  const { id } = args;
  const docRef = doc(todosCollection, id); // db 참조, 컬렉션 이름, 문서 ID로 문서 참조 생성
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error(`Todo with id ${id} not found in todoApi`);
  }
  // Firestore 문서 데이터와 ID를 합쳐 Todo 객체로 변환 (plainToTodo 어댑터 사용)
  return plainToTodo({id: docSnap.id, ...docSnap.data()}); 
};

/**
 * Firestore에 있는 특정 할 일(Todo) 항목을 업데이트합니다.
 * 
 * @param args 함수 인자 객체
 * @param args.id 업데이트할 할 일의 Firestore 문서 ID.
 * @param args.updates 업데이트할 필드와 값들을 포함하는 부분적인 `Todo` 객체.
 *                     `id`와 `createdAt` 필드는 업데이트할 수 없습니다.
 * @returns Promise<void> 작업 완료를 나타냅니다.
 * @throws Firestore 작업 중 오류 발생 시 해당 오류를 throw합니다.
 */
export const updateTodo = async (args: { id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>> }): Promise<void> => {
  const { id, updates } = args;
  try {
    const docRef = doc(todosCollection, id);
    await updateDoc(docRef, updates); // 제공된 updates 객체로 문서 업데이트
  } catch (error) {
    console.error("Error updating document in todoApi: ", error);
    throw error;
  }
};

/**
 * Firestore에서 특정 ID를 가진 할 일(Todo) 항목을 삭제합니다.
 * 
 * @param args 함수 인자 객체
 * @param args.id 삭제할 할 일의 Firestore 문서 ID.
 * @returns Promise<void> 작업 완료를 나타냅니다.
 * @throws Firestore 작업 중 오류 발생 시 해당 오류를 throw합니다.
 */
export const deleteTodo = async (args: { id: string }): Promise<void> => {
  const { id } = args;
  try {
    const docRef = doc(todosCollection, id);
    await deleteDoc(docRef); // 문서 삭제
  } catch (error) {
    console.error("Error deleting document in todoApi: ", error);
    throw error;
  }
}; 