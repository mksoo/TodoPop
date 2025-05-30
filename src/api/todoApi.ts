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

/**
 * 새로운 할 일(Todo) 항목을 Firestore에 추가합니다.
 * 
 * @param args 함수 인자 객체
 * @param args.todo 추가할 할 일 데이터. `id`, `createdAt`, `status` 필드는 서버에서 자동 생성/설정되므로 제외합니다.
 *                  `title`은 필수이며, `nextOccurrence`가 제공되지 않으면 현재 시간으로 기본 설정됩니다.
 * @returns 생성된 Firestore 문서의 ID.
 * @throws Firestore 작업 중 오류 발생 시 해당 오류를 throw합니다.
 */
export const addTodo = async (args: { todo: Omit<Todo, 'id' | 'createdAt' | 'status'> & { title: string } }): Promise<string> => {
  const { todo } = args;
  try {
    const todoDataWithTimestamp = {
      ...todo,
      // nextOccurrence가 없으면 현재 시간으로 설정 (반복 없는 일반 Todo 또는 첫 반복 생성 시).
      // 반복 Todo의 경우, 호출하는 쪽 (예: useAddTodo 훅)에서 계산된 첫 nextOccurrence를 전달할 수 있음.
      nextOccurrence: todo.nextOccurrence || Timestamp.now(),
      status: 'ONGOING', // 새로운 Todo는 항상 'ONGOING' 상태로 시작
      createdAt: serverTimestamp(), // 서버 타임스탬프 사용
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
 * 현재는 `nextOccurrence`가 존재하고, 그 값이 현재 시간보다 작거나 같은 (즉, 이미 발생했거나 오늘 발생할) 
 * 할 일들만 가져오며, `nextOccurrence` 기준으로 오름차순 정렬합니다.
 * 
 * @returns `Todo` 객체의 배열.
 * @throws Firestore 작업 중 오류 발생 시 해당 오류를 throw합니다.
 */
export const getTodos = async (): Promise<Todo[]> => {
  try {
    const now = Timestamp.now();
    
    // 쿼리 조건:
    // 1. nextOccurrence 필드가 null이 아님 (즉, 존재해야 함)
    // 2. nextOccurrence 값이 현재 시간 (now)보다 작거나 같음
    // 정렬: nextOccurrence 오름차순
    const q = query(
      todosCollection, 
      where('nextOccurrence', '!=', null),
      where('nextOccurrence', '<=', now),
      orderBy('nextOccurrence', 'asc')
    );

    const snapshot = await getDocs(q);

    // Firestore 문서들을 Todo 객체로 변환 (id 포함)
    // 여기서 data()의 타입은 DocumentData이므로, Todo 타입으로 단언하거나 변환 함수 사용.
    // plainToTodo를 여기서 직접 사용할 수도 있지만, 현재는 반환 후 훅에서 변환하는 구조로 예상됨.
    // Firestore의 데이터를 Todo 타입으로 변환하는 것은 plainToTodo 어댑터의 역할.
    // 다만, Firestore에서 직접 가져온 데이터는 Timestamp 객체를 포함하므로 plainToTodo는 주로 JS 객체 -> Todo 변환에 사용.
    // 여기서는 Firestore 데이터를 바로 Todo 타입으로 캐스팅 (리스크 존재 가능, 데이터 구조 일치 중요)
    const todosFromDb = snapshot.docs.map(doc => {
      const data = doc.data();
      // data()는 Todo 타입의 필드를 포함해야 함. Firestore의 Timestamp는 그대로 유지.
      return plainToTodo({ id: doc.id, ...data });
    });

    return todosFromDb;

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
  const docRef = doc(db, 'todos', id); // db 참조, 컬렉션 이름, 문서 ID로 문서 참조 생성
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
    const docRef = doc(db, 'todos', id);
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
    const docRef = doc(db, 'todos', id);
    await deleteDoc(docRef); // 문서 삭제
  } catch (error) {
    console.error("Error deleting document in todoApi: ", error);
    throw error;
  }
}; 